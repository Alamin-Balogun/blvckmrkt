package handlers

import (
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── applyCommissionForBrand ──────────────────────────────────────────────────
// Checks if the brand has a custom commission rate. If not, uses platform default.
// Returns displayPrice (buyer sees) and comparePrice (original brand price, shown slashed).
func applyCommissionForBrand(brandPrice float64, brandID uint) (displayPrice, comparePrice float64) {
	var brand models.Brand
	database.DB.Select("commission_rate").First(&brand, brandID)

	var rate float64
	if brand.CommissionRate != nil {
		// Brand has custom commission rate
		rate = *brand.CommissionRate
	} else {
		// Use platform default
		rate = getAdminSettingFloat("commission_rate", 10)
	}

	if rate <= 0 || rate >= 100 {
		return brandPrice, 0
	}
	displayPrice = brandPrice * (1 - rate/100)
	displayPrice = float64(int(displayPrice*100+0.5)) / 100 // Round to 2 decimals
	comparePrice = brandPrice
	return
}

// ── GET /api/brand/products ───────────────────────────────────────────────────
func BrandListProducts(c *gin.Context) {
	userID := c.GetUint("userID")

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	q := database.DB.Where("brand_id = ?", brand.ID).
		Preload("Images").
		Preload("Sizes").
		Order("created_at DESC")

	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}
	if search := strings.TrimSpace(c.Query("search")); search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}

	var products []models.Product
	q.Find(&products)

	type ProductWithSales struct {
		models.Product
		TotalSales   int     `json:"total_sales"`
		TotalRevenue float64 `json:"total_revenue"`
	}

	result := make([]ProductWithSales, len(products))
	for i, p := range products {
		var sales struct {
			Count   int
			Revenue float64
		}
		database.DB.Raw(`
			SELECT COUNT(*) as count, COALESCE(SUM(total_price),0) as revenue
			FROM order_items
			WHERE product_id = ?
		`, p.ID).Scan(&sales)

		result[i] = ProductWithSales{
			Product:      p,
			TotalSales:   sales.Count,
			TotalRevenue: sales.Revenue,
		}
	}

	utils.OK(c, "Products fetched", gin.H{
		"products": result,
		"total":    len(result),
		"pages":    1,
	})
}

// ── GET /api/brand/products/:id ───────────────────────────────────────────────
func BrandGetProduct(c *gin.Context) {
	userID := c.GetUint("userID")
	productID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var product models.Product
	if err := database.DB.
		Where("id = ? AND brand_id = ?", productID, brand.ID).
		Preload("Images").
		Preload("Sizes").
		First(&product).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	utils.OK(c, "Product fetched", product)
}

// ── POST /api/brand/products ──────────────────────────────────────────────────
func BrandCreateProduct(c *gin.Context) {
	userID := c.GetUint("userID")

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		Name         string  `json:"name"         binding:"required"`
		Description  string  `json:"description"`
		Price        float64 `json:"price"        binding:"required,min=0"`
		ComparePrice float64 `json:"compare_price"` // ignored - calculated server-side
		CategoryID   *uint   `json:"category_id"`
		Status       string  `json:"status"`
		IsFeatured   bool    `json:"is_featured"`
		Tags         string  `json:"tags"`
		Images       []struct {
			URL      string `json:"url"`
			Position int    `json:"position"`
		} `json:"images"`
		Sizes []struct {
			Size  string `json:"size"`
			Stock int    `json:"stock"`
		} `json:"sizes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "name and price are required", nil)
		return
	}

	status := models.ProductDraft
	if req.Status != "" {
		status = models.ProductStatus(req.Status)
	}

	// req.Price is the brand's asking price.
	// Store it in brand_price (source of truth — survives commission_rate changes).
	// Then derive the buyer-facing price and the slashed compare_price using brand-specific rate.
	brandPrice := req.Price
	displayPrice, comparePrice := applyCommissionForBrand(brandPrice, brand.ID)

	product := models.Product{
		BrandID:      brand.ID,
		UserID:       userID,
		CategoryID:   req.CategoryID,
		Name:         strings.TrimSpace(req.Name),
		Slug:         utils.Slugify(req.Name),
		Description:  req.Description,
		BrandPrice:   brandPrice,   // source of truth
		Price:        displayPrice, // recalculated on every commission_rate change
		ComparePrice: comparePrice, // brand's original ask (shown slashed)
		Status:       status,
		IsFeatured:   req.IsFeatured,
		Tags:         req.Tags,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		product.Slug = utils.Slugify(req.Name) + "-" + strconv.Itoa(int(brand.ID))
		if err2 := database.DB.Create(&product).Error; err2 != nil {
			utils.InternalError(c, "Failed to create product")
			return
		}
	}

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

	for _, sz := range req.Sizes {
		if sz.Size == "" {
			continue
		}
		database.DB.Create(&models.ProductSize{
			ProductID: product.ID,
			Size:      sz.Size,
			Stock:     sz.Stock,
		})
	}

	database.DB.Preload("Images").Preload("Sizes").First(&product, product.ID)
	utils.Created(c, "Product created", product)
}

// ── PUT /api/brand/products/:id ───────────────────────────────────────────────
func BrandUpdateProduct(c *gin.Context) {
	userID := c.GetUint("userID")
	productID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var product models.Product
	if err := database.DB.
		Where("id = ? AND brand_id = ?", productID, brand.ID).
		First(&product).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	var req struct {
		Name         string  `json:"name"`
		Description  string  `json:"description"`
		Price        float64 `json:"price"` // brand's asking price
		ComparePrice float64 `json:"compare_price"` // ignored - server-side only
		CategoryID   *uint   `json:"category_id"`
		Status       string  `json:"status"`
		IsFeatured   *bool   `json:"is_featured"`
		Tags         string  `json:"tags"`
		Images       []struct {
			URL      string `json:"url"`
			Position int    `json:"position"`
		} `json:"images"`
		Sizes []struct {
			Size  string `json:"size"`
			Stock int    `json:"stock"`
		} `json:"sizes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = strings.TrimSpace(req.Name)
		updates["slug"] = utils.Slugify(req.Name)
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	// When the brand changes their asking price, update brand_price (source of
	// truth) and recalculate price + compare_price using their custom commission rate.
	if req.Price > 0 {
		brandPrice := req.Price
		displayPrice, comparePrice := applyCommissionForBrand(brandPrice, brand.ID)
		updates["brand_price"]   = brandPrice
		updates["price"]         = displayPrice
		updates["compare_price"] = comparePrice
	}
	if req.CategoryID != nil {
		updates["category_id"] = req.CategoryID
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.IsFeatured != nil {
		updates["is_featured"] = *req.IsFeatured
	}
	if req.Tags != "" {
		updates["tags"] = req.Tags
	}

	database.DB.Model(&product).Updates(updates)

	if req.Status != "" {
		syncDropProductStatus(product.ID, models.ProductStatus(req.Status))
	}

	if len(req.Images) > 0 {
		database.DB.Where("product_id = ?", product.ID).Delete(&models.ProductImage{})
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
	}

	if len(req.Sizes) > 0 {
		database.DB.Where("product_id = ?", product.ID).Delete(&models.ProductSize{})
		for _, sz := range req.Sizes {
			if sz.Size == "" {
				continue
			}
			database.DB.Create(&models.ProductSize{
				ProductID: product.ID,
				Size:      sz.Size,
				Stock:     sz.Stock,
			})
		}
	}

	database.DB.Preload("Images").Preload("Sizes").First(&product, product.ID)
	utils.OK(c, "Product updated", product)
}

// ── PATCH /api/brand/products/:id/status ──────────────────────────────────────
func BrandUpdateProductStatus(c *gin.Context) {
	userID := c.GetUint("userID")
	productID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "status is required", nil)
		return
	}

	valid := map[string]bool{
		"active":   true,
		"draft":    true,
		"sold_out": true,
		"archived": true,
	}
	if !valid[req.Status] {
		utils.BadRequest(c, "status must be active, draft, sold_out, or archived", nil)
		return
	}

	result := database.DB.Model(&models.Product{}).
		Where("id = ? AND brand_id = ?", productID, brand.ID).
		Update("status", req.Status)

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Product not found")
		return
	}

	syncDropProductStatus(uint(productID), models.ProductStatus(req.Status))
	utils.OK(c, "Product status updated", gin.H{"id": productID, "status": req.Status})
}

// ── DELETE /api/brand/products/:id ────────────────────────────────────────────
func BrandDeleteProduct(c *gin.Context) {
	userID := c.GetUint("userID")
	productID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	result := database.DB.
		Where("id = ? AND brand_id = ?", productID, brand.ID).
		Delete(&models.Product{})

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Product not found")
		return
	}

	utils.OK(c, "Product deleted", nil)
}

// ── syncDropProductStatus ─────────────────────────────────────────────────────
func syncDropProductStatus(productID uint, newProductStatus models.ProductStatus) {
	var dropStatus models.DropStatus
	switch newProductStatus {
	case models.ProductDraft, models.ProductArchived:
		dropStatus = models.DropScheduled
	default:
		dropStatus = models.DropLive
	}

	database.DB.Model(&models.DropProduct{}).
		Where("product_id = ? AND status != ?", productID, models.DropEnded).
		Update("status", dropStatus)
}