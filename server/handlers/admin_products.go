package handlers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/products ───────────────────────────────────────────────────
func AdminListProducts(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search        := strings.TrimSpace(c.Query("search"))
	status        := c.Query("status")
	brandIDStr    := c.Query("brand_id")

	q := database.DB.Model(&models.Product{}).Preload("Images").Preload("Sizes")

	if search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if brandIDStr != "" {
		q = q.Where("brand_id = ?", brandIDStr)
	}

	var total int64
	q.Count(&total)

	var products []models.Product
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&products)

	// Attach brand names
	brandIDs := make([]uint, 0, len(products))
	for _, p := range products {
		brandIDs = append(brandIDs, p.BrandID)
	}
	var brands []models.Brand
	database.DB.Where("id IN ?", brandIDs).Find(&brands)
	brandMap := map[uint]string{}
	for _, b := range brands {
		brandMap[b.ID] = b.BrandName
	}

	// Check which products are currently in an active drop
	productIDs := make([]uint, 0, len(products))
	for _, p := range products {
		productIDs = append(productIDs, p.ID)
	}
	type dpRow struct {
		ProductID  uint   `gorm:"column:product_id"`
		DropStatus string `gorm:"column:status"`
		DropName   string `gorm:"column:drop_name"`
	}
	var dropRows []dpRow
	if len(productIDs) > 0 {
		database.DB.Raw(`
			SELECT dp.product_id, dp.status, d.name AS drop_name
			FROM drop_products dp
			JOIN drops d ON d.id = dp.drop_id AND d.deleted_at IS NULL
			WHERE dp.product_id IN ? AND dp.status != 'ended'
		`, productIDs).Scan(&dropRows)
	}
	dropMap := map[uint]dpRow{}
	for _, r := range dropRows {
		dropMap[r.ProductID] = r
	}

	type ProductRow struct {
		models.Product
		BrandName  string `json:"brand_name"`
		InDrop     bool   `json:"in_drop"`
		DropStatus string `json:"drop_status,omitempty"`
		DropName   string `json:"drop_name,omitempty"`
	}
	rows := make([]ProductRow, len(products))
	for i, p := range products {
		dr := dropMap[p.ID]
		rows[i] = ProductRow{
			Product:    p,
			BrandName:  brandMap[p.BrandID],
			InDrop:     dr.ProductID != 0,
			DropStatus: dr.DropStatus,
			DropName:   dr.DropName,
		}
	}

	utils.OK(c, "Products fetched", gin.H{"products": rows, "total": total})
}

// ── GET /api/admin/products/:id ───────────────────────────────────────────────
func AdminGetProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid product ID", nil)
		return
	}

	var product models.Product
	if err := database.DB.Preload("Images").Preload("Sizes").First(&product, id).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	var brand models.Brand
	database.DB.First(&brand, product.BrandID)

	type ProductDetail struct {
		models.Product
		BrandName string `json:"brand_name"`
	}
	utils.OK(c, "Product fetched", gin.H{
		"product": ProductDetail{Product: product, BrandName: brand.BrandName},
	})
}

// ── POST /api/admin/products ──────────────────────────────────────────────────
func AdminCreateProduct(c *gin.Context) {
	var req struct {
		BrandID      uint    `json:"brand_id"      binding:"required"`
		Name         string  `json:"name"          binding:"required"`
		Description  string  `json:"description"`
		Price        float64 `json:"price"         binding:"required"`
		ComparePrice float64 `json:"compare_price"`
		CategoryID   *uint   `json:"category_id"`
		Tags         string  `json:"tags"`
		IsFeatured   bool    `json:"is_featured"`
		Images       []struct {
			URL      string `json:"url"`
			Position int    `json:"position"`
		} `json:"images"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "brand_id, name and price are required", nil)
		return
	}

	var brand models.Brand
	if err := database.DB.First(&brand, req.BrandID).Error; err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	slug := utils.Slugify(req.Name)
	var count int64
	base := slug
	for i := 1; ; i++ {
		database.DB.Model(&models.Product{}).Where("slug = ?", slug).Count(&count)
		if count == 0 {
			break
		}
		slug = fmt.Sprintf("%s-%d", base, i)
	}

	product := models.Product{
		BrandID:      req.BrandID,
		UserID:       brand.UserID,
		Name:         req.Name,
		Slug:         slug,
		Description:  req.Description,
		Price:        req.Price,
		ComparePrice: req.ComparePrice,
		CategoryID:   req.CategoryID,
		Tags:         req.Tags,
		IsFeatured:   req.IsFeatured,
		Status:       models.ProductDraft,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		utils.InternalError(c, "Failed to create product")
		return
	}

	// Save uploaded images
	for _, img := range req.Images {
		if img.URL == "" {
			continue
		}
		database.DB.Create(&models.ProductImage{
			ProductID: product.ID,
			URL:       img.URL,
			Position:  img.Position,
		})
	}

	database.DB.Preload("Images").Preload("Sizes").First(&product, product.ID)
	utils.Created(c, "Product created", product)
}

// ── PATCH /api/admin/products/:id ─────────────────────────────────────────────
func AdminUpdateProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid product ID", nil)
		return
	}

	var req struct {
		Name         string  `json:"name"`
		Description  string  `json:"description"`
		Price        float64 `json:"price"`
		ComparePrice float64 `json:"compare_price"`
		Status       string  `json:"status"`
		IsFeatured   *bool   `json:"is_featured"`
		Tags         string  `json:"tags"`
		CategoryID   *uint   `json:"category_id"`
		Images       []struct {
			URL      string `json:"url"`
			Position int    `json:"position"`
		} `json:"images"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.Name != ""         { updates["name"]          = req.Name }
	if req.Description != ""  { updates["description"]   = req.Description }
	if req.Price > 0          { updates["price"]         = req.Price }
	if req.ComparePrice > 0   { updates["compare_price"] = req.ComparePrice }
	if req.Status != ""       { updates["status"]        = req.Status }
	if req.IsFeatured != nil  { updates["is_featured"]   = *req.IsFeatured }
	if req.Tags != ""         { updates["tags"]          = req.Tags }
	if req.CategoryID != nil  { updates["category_id"]   = req.CategoryID }

	if len(updates) > 0 {
		database.DB.Model(&models.Product{}).Where("id = ?", id).Updates(updates)
	}

	// Replace images if provided
	if len(req.Images) > 0 {
		database.DB.Where("product_id = ?", id).Delete(&models.ProductImage{})
		for _, img := range req.Images {
			if img.URL == "" {
				continue
			}
			database.DB.Create(&models.ProductImage{
				ProductID: uint(id),
				URL:       img.URL,
				Position:  img.Position,
			})
		}
	}

	var product models.Product
	database.DB.Preload("Images").Preload("Sizes").First(&product, id)
	utils.OK(c, "Product updated", product)
}

// ── DELETE /api/admin/products/:id ────────────────────────────────────────────
func AdminDeleteProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid product ID", nil)
		return
	}
	database.DB.Delete(&models.Product{}, id)
	utils.OK(c, "Product deleted", nil)
}

// ── GET /api/admin/drops ──────────────────────────────────────────────────────
func AdminListDrops(c *gin.Context) {
	limit, offset := adminPageParams(c)
	status        := c.Query("status")
	search        := strings.TrimSpace(c.Query("search"))

	q := database.DB.Model(&models.Drop{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}

	var total int64
	q.Count(&total)

	var drops []models.Drop
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&drops)

	// Attach brand names
	brandIDs := make([]uint, 0, len(drops))
	for _, d := range drops {
		brandIDs = append(brandIDs, d.BrandID)
	}
	var brands []models.Brand
	database.DB.Where("id IN ?", brandIDs).Find(&brands)
	brandMap := map[uint]string{}
	for _, b := range brands {
		brandMap[b.ID] = b.BrandName
	}

	type DropRow struct {
		models.Drop
		BrandName string `json:"brand_name"`
	}
	rows := make([]DropRow, len(drops))
	for i, d := range drops {
		rows[i] = DropRow{Drop: d, BrandName: brandMap[d.BrandID]}
	}

	utils.OK(c, "Drops fetched", gin.H{"drops": rows, "total": total})
}

// ── GET /api/admin/drops/:id ──────────────────────────────────────────────────
func AdminGetDrop(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid drop ID", nil)
		return
	}

	var drop models.Drop
	if err := database.DB.First(&drop, id).Error; err != nil {
		utils.NotFound(c, "Drop not found")
		return
	}

	// Fetch associated drop_products with product names
	var dropProducts []models.DropProduct
	database.DB.Where("drop_id = ?", id).Find(&dropProducts)

	productIDs := make([]uint, 0, len(dropProducts))
	for _, dp := range dropProducts {
		productIDs = append(productIDs, dp.ProductID)
	}
	var products []models.Product
	if len(productIDs) > 0 {
		database.DB.Where("id IN ?", productIDs).Find(&products)
	}
	productMap := map[uint]string{}
	for _, p := range products {
		productMap[p.ID] = p.Name
	}

	type DPRow struct {
		models.DropProduct
		Name string `json:"name"`
	}
	dpRows := make([]DPRow, len(dropProducts))
	for i, dp := range dropProducts {
		dpRows[i] = DPRow{DropProduct: dp, Name: productMap[dp.ProductID]}
	}

	var brand models.Brand
	database.DB.First(&brand, drop.BrandID)

	utils.OK(c, "Drop fetched", gin.H{
		"drop":     drop,
		"brand":    gin.H{"id": brand.ID, "name": brand.BrandName},
		"products": dpRows,
	})
}

// ── PATCH /api/admin/drops/:id ────────────────────────────────────────────────
func AdminUpdateDrop(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid drop ID", nil)
		return
	}

	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	allowed := map[string]bool{
		"name": true, "drop_at": true, "ends_at": true,
	}
	updates := map[string]interface{}{}
	for k, v := range body {
		if allowed[k] {
			updates[k] = v
		}
	}

	database.DB.Model(&models.Drop{}).Where("id = ?", id).Updates(updates)
	utils.OK(c, "Drop updated", nil)
}

// ── DELETE /api/admin/drops/:id ───────────────────────────────────────────────
func AdminDeleteDrop(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid drop ID", nil)
		return
	}
	database.DB.Where("drop_id = ?", id).Delete(&models.DropProduct{})
	database.DB.Delete(&models.Drop{}, id)
	utils.OK(c, "Drop deleted", nil)
}

// ── GET /api/admin/categories ─────────────────────────────────────────────────
func AdminListCategories(c *gin.Context) {
	var cats []models.Category
	database.DB.Order("sort_order ASC, name ASC").Find(&cats)

	// Attach product counts
	type CatRow struct {
		models.Category
		ProductCount int64 `json:"product_count"`
	}
	rows := make([]CatRow, len(cats))
	for i, cat := range cats {
		var count int64
		database.DB.Model(&models.Product{}).
			Where("category_id = ? AND deleted_at IS NULL", cat.ID).
			Count(&count)
		rows[i] = CatRow{Category: cat, ProductCount: count}
	}

	utils.OK(c, "Categories fetched", gin.H{"categories": rows})
}

// ── POST /api/admin/categories ────────────────────────────────────────────────
func AdminCreateCategory(c *gin.Context) {
	var req struct {
		Name        string `json:"name"        binding:"required"`
		Slug        string `json:"slug"        binding:"required"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Name and slug are required", nil)
		return
	}

	cat := models.Category{
		Name:        strings.TrimSpace(req.Name),
		Slug:        strings.TrimSpace(req.Slug),
		Description: req.Description,
		ImageURL:    req.ImageURL,
		SortOrder:   req.SortOrder,
	}
	if err := database.DB.Create(&cat).Error; err != nil {
		utils.InternalError(c, "Failed to create category")
		return
	}
	utils.Created(c, "Category created", cat)
}

// ── PATCH /api/admin/categories/:id ──────────────────────────────────────────
func AdminUpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid category ID", nil)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		ImageURL    string `json:"image_url"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid body", nil)
		return
	}

	var cat models.Category
	if err := database.DB.First(&cat, id).Error; err != nil {
		utils.NotFound(c, "Category not found")
		return
	}
	if req.Name != "" { cat.Name = req.Name }
	if req.Slug != "" { cat.Slug = req.Slug }
	cat.Description = req.Description
	cat.ImageURL    = req.ImageURL
	cat.SortOrder   = req.SortOrder
	database.DB.Save(&cat)
	utils.OK(c, "Category updated", cat)
}

// ── DELETE /api/admin/categories/:id ─────────────────────────────────────────
func AdminDeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid category ID", nil)
		return
	}
	database.DB.Delete(&models.Category{}, id)
	utils.OK(c, "Category deleted", nil)
}