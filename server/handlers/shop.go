package handlers

import (
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── eligibleBrandsSubquery ────────────────────────────────────────────────────
const eligibleBrandsSubquery = `(
	SELECT id FROM brands
	WHERE deleted_at         IS NULL
	  AND verification_status = 'verified'
)`

// ── ProductSummary ────────────────────────────────────────────────────────────
type ProductSummary struct {
	ID           uint                 `json:"id"`
	Name         string               `json:"name"`
	Slug         string               `json:"slug"`
	BrandPrice   float64              `json:"brand_price,omitempty"`
	Price        float64              `json:"price"`
	ComparePrice float64              `json:"compare_price,omitempty"`
	Tags         string               `json:"tags,omitempty"`
	BrandID      uint                 `json:"brand_id"`
	BrandName    string               `json:"brand_name"`
	PrimaryImage string               `json:"primary_image"`
	Sizes        []models.ProductSize `json:"sizes,omitempty"`
	CreatedAt    interface{}          `json:"created_at,omitempty"`
}

// ── fetchProductSummaries ─────────────────────────────────────────────────────
func fetchProductSummaries(productIDs []uint) map[uint]ProductSummary {
	if len(productIDs) == 0 {
		return map[uint]ProductSummary{}
	}

	var products []models.Product
	database.DB.Where("id IN ?", productIDs).Preload("Images").Preload("Sizes").Find(&products)

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

	result := map[uint]ProductSummary{}
	for _, p := range products {
		primaryImg := ""
		for _, img := range p.Images {
			if img.Position == 0 {
				primaryImg = img.URL
				break
			}
		}
		if primaryImg == "" && len(p.Images) > 0 {
			primaryImg = p.Images[0].URL
		}
		result[p.ID] = ProductSummary{
			ID: p.ID, Name: p.Name, Slug: p.Slug,
			BrandPrice: p.BrandPrice, Price: p.Price, ComparePrice: p.ComparePrice,
			Tags: p.Tags, BrandID: p.BrandID, BrandName: brandMap[p.BrandID],
			PrimaryImage: primaryImg, Sizes: p.Sizes,
		}
	}
	return result
}

// ── GET /api/shop/products ────────────────────────────────────────────────────
func ListProducts(c *gin.Context) {
	query := database.DB.Model(&models.Product{}).
		Joins(`
			JOIN brands __b ON __b.id = products.brand_id
			  AND __b.deleted_at         IS NULL
			  AND __b.verification_status = 'verified'
		`).
		Where("products.status = ? AND products.deleted_at IS NULL", models.ProductActive).
		Preload("Images").
		Preload("Sizes")

	if brandIDs := c.Query("brand_ids"); brandIDs != "" {
		ids := strings.Split(brandIDs, ",")
		query = query.Where("products.brand_id IN ?", ids)
	} else if brandID := c.Query("brand_id"); brandID != "" {
		query = query.Where("products.brand_id = ?", brandID)
	}
	if catID := c.Query("category_id"); catID != "" {
		query = query.Where("products.category_id = ?", catID)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where(
			"products.name LIKE ? OR products.tags LIKE ?",
			"%"+search+"%", "%"+search+"%",
		)
	}
	if tag := c.Query("tag"); tag != "" {
		query = query.Where("products.tags LIKE ?", "%"+tag+"%")
	}
	if excludeBrandID := c.Query("exclude_brand_id"); excludeBrandID != "" {
		query = query.Where("products.brand_id != ?", excludeBrandID)
	}
	if minPrice := c.Query("min_price"); minPrice != "" {
		query = query.Where("products.price >= ?", minPrice)
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		query = query.Where("products.price <= ?", maxPrice)
	}

	switch c.Query("sort") {
	case "price_asc":
		query = query.Order("products.price ASC")
	case "price_desc":
		query = query.Order("products.price DESC")
	default:
		query = query.Order("products.created_at DESC")
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit > 50 {
		limit = 50
	}
	offset := (page - 1) * limit

	var total int64
	query.Count(&total)

	var products []models.Product
	query.Offset(offset).Limit(limit).Find(&products)

	brandIDs := make([]uint, len(products))
	for i, p := range products {
		brandIDs[i] = p.BrandID
	}
	var brands []models.Brand
	database.DB.Where("id IN ?", brandIDs).Find(&brands)
	brandMap := map[uint]string{}
	for _, b := range brands {
		brandMap[b.ID] = b.BrandName
	}

	resp := make([]ProductSummary, len(products))
	for i, p := range products {
		primaryImg := ""
		for _, img := range p.Images {
			if img.Position == 0 {
				primaryImg = img.URL
				break
			}
		}
		if primaryImg == "" && len(p.Images) > 0 {
			primaryImg = p.Images[0].URL
		}
		resp[i] = ProductSummary{
			ID: p.ID, Name: p.Name, Slug: p.Slug,
			BrandPrice: p.BrandPrice, Price: p.Price, ComparePrice: p.ComparePrice,
			Tags: p.Tags, BrandID: p.BrandID, BrandName: brandMap[p.BrandID],
			PrimaryImage: primaryImg, Sizes: p.Sizes, CreatedAt: p.CreatedAt,
		}
	}

	utils.OK(c, "Products fetched", gin.H{
		"products": resp,
		"total":    total,
		"page":     page,
		"limit":    limit,
		"pages":    (total + int64(limit) - 1) / int64(limit),
	})
}

// ── GET /api/shop/products/:id ────────────────────────────────────────────────
// Accepts BOTH numeric ID and slug string.
// Returns full product detail with images, sizes, brand info, category, reviews summary.
func GetProduct(c *gin.Context) {
	param := c.Param("id")

	var product models.Product

	// Try numeric ID first, then fall back to slug lookup
	if numID, err := strconv.ParseUint(param, 10, 64); err == nil {
		database.DB.
			Where("id = ? AND status = ? AND deleted_at IS NULL", numID, models.ProductActive).
			Preload("Images").Preload("Sizes").
			First(&product)
	} else {
		database.DB.
			Where("slug = ? AND status = ? AND deleted_at IS NULL", param, models.ProductActive).
			Preload("Images").Preload("Sizes").
			First(&product)
	}

	if product.ID == 0 {
		utils.NotFound(c, "Product not found")
		return
	}

	// ── Verify the brand is eligible ──────────────────────────────────────
	var brand models.Brand
	database.DB.First(&brand, product.BrandID)

	if brand.ID == 0 ||
		brand.VerificationStatus != models.VerificationVerified ||
		(brand.SubscriptionStatus != models.SubStatusActive &&
			brand.SubscriptionStatus != models.SubStatusTrial) {
		utils.NotFound(c, "Product not found")
		return
	}

	// ── Build images list + find primary ──────────────────────────────────
	imgList := make([]gin.H, 0, len(product.Images))
	primaryImage := ""
	for _, img := range product.Images {
		imgList = append(imgList, gin.H{
			"id":       img.ID,
			"url":      img.URL,
			"position": img.Position,
		})
		if img.Position == 0 || primaryImage == "" {
			primaryImage = img.URL
		}
	}

	// ── Build sizes list ──────────────────────────────────────────────────
	sizeList := make([]gin.H, 0, len(product.Sizes))
	for _, s := range product.Sizes {
		sizeList = append(sizeList, gin.H{
			"id":   s.ID,
			"size": s.Size,
			"name": s.Size,
		})
	}

	// ── Resolve category name ─────────────────────────────────────────────
	categoryName := ""
	if product.CategoryID != nil {
		var cat models.Category
		if database.DB.First(&cat, *product.CategoryID).Error == nil {
			categoryName = cat.Name
		}
	}

	// ── Reviews summary ───────────────────────────────────────────────────
	var reviews []models.Review
	database.DB.Where("product_id = ?", product.ID).Find(&reviews)

	avgRating := 0.0
	if len(reviews) > 0 {
		sum := 0
		for _, r := range reviews {
			sum += r.Rating
		}
		avgRating = float64(sum) / float64(len(reviews))
	}

	// ── Response ──────────────────────────────────────────────────────────
	utils.OK(c, "Product fetched", gin.H{
		"id":            product.ID,
		"name":          product.Name,
		"slug":          product.Slug,
		"description":   product.Description,
		"price":         product.Price,
		"compare_price": product.ComparePrice,
		"brand_price":   product.BrandPrice,
		"status":        product.Status,
		"is_featured":   product.IsFeatured,
		"tags":          product.Tags,
		"brand_id":      product.BrandID,
		"brand_name":    brand.BrandName,
		"brand_slug":    brand.Slug,
		"category_id":   product.CategoryID,
		"category_name": categoryName,
		"primary_image": primaryImage,
		"images":        imgList,
		"sizes":         sizeList,
		"avg_rating":    avgRating,
		"review_count":  len(reviews),
		"created_at":    product.CreatedAt,
		"updated_at":    product.UpdatedAt,
	})
}

// ── GET /api/shop/products/:id/reviews ────────────────────────────────────────
// Accepts BOTH numeric ID and slug string for the product identifier.
func ShopListProductReviews(c *gin.Context) {
	param := c.Param("id")

	var product models.Product

	// Support both numeric ID and slug
	if numID, err := strconv.ParseUint(param, 10, 64); err == nil {
		database.DB.
			Where("id = ? AND deleted_at IS NULL", numID).
			First(&product)
	} else {
		database.DB.
			Where("slug = ? AND deleted_at IS NULL", param).
			First(&product)
	}

	if product.ID == 0 {
		utils.NotFound(c, "Product not found")
		return
	}

	var reviews []models.Review
	database.DB.
		Where("product_id = ?", product.ID).
		Order("created_at DESC").
		Find(&reviews)

	// Collect unique user IDs to batch-fetch names
	userIDSet := map[uint]bool{}
	for _, r := range reviews {
		userIDSet[r.UserID] = true
	}
	userIDs := make([]uint, 0, len(userIDSet))
	for uid := range userIDSet {
		userIDs = append(userIDs, uid)
	}

	var users []models.User
	if len(userIDs) > 0 {
		database.DB.Where("id IN ?", userIDs).Find(&users)
	}
	userMap := map[uint]string{}
	for _, u := range users {
		name := u.FirstName
		if u.LastName != "" {
			name += " " + string(u.LastName[0]) + "."
		}
		userMap[u.ID] = name
	}

	result := make([]gin.H, 0, len(reviews))
	for _, r := range reviews {
		userName := "User"
		if n, ok := userMap[r.UserID]; ok && n != "" {
			userName = n
		}

		result = append(result, gin.H{
			"id":         r.ID,
			"user_name":  userName,
			"rating":     r.Rating,
			"title":      r.Title,
			"comment":    r.Body,
			"created_at": r.CreatedAt,
		})
	}

	utils.OK(c, "Reviews fetched", gin.H{
		"reviews": result,
		"total":   len(result),
	})
}

// ── GET /api/shop/counts ──────────────────────────────────────────────────────
func GetShopCounts(c *gin.Context) {
	type CountRow struct {
		ID    uint  `gorm:"column:id"`
		Count int64 `gorm:"column:count"`
	}

	var catRows []CountRow
	database.DB.Raw(`
		SELECT p.category_id AS id, COUNT(*) AS count
		FROM products p
		JOIN brands b ON b.id = p.brand_id
		  AND b.deleted_at         IS NULL
		  AND b.verification_status = 'verified'
		WHERE p.status     = 'active'
		  AND p.deleted_at IS NULL
		  AND p.category_id IS NOT NULL
		GROUP BY p.category_id
	`).Scan(&catRows)

	var brandRows []CountRow
	database.DB.Raw(`
		SELECT p.brand_id AS id, COUNT(*) AS count
		FROM products p
		JOIN brands b ON b.id = p.brand_id
		  AND b.deleted_at         IS NULL
		  AND b.verification_status = 'verified'
		WHERE p.status     = 'active'
		  AND p.deleted_at IS NULL
		GROUP BY p.brand_id
	`).Scan(&brandRows)

	catCounts := map[uint]int64{}
	brandCounts := map[uint]int64{}
	for _, r := range catRows {
		catCounts[r.ID] = r.Count
	}
	for _, r := range brandRows {
		brandCounts[r.ID] = r.Count
	}

	utils.OK(c, "Counts fetched", gin.H{
		"categories": catCounts,
		"brands":     brandCounts,
	})
}

// ── GET /api/shop/brands ──────────────────────────────────────────────────────
func ListBrands(c *gin.Context) {
	type ShopBrand struct {
		ID                 uint   `json:"id"`
		DisplayID          string `json:"display_id"`
		BrandName          string `json:"brand_name"`
		Slug               string `json:"slug"`
		LogoURL            string `json:"logo_url"`
		Category           string `json:"category"`
		ProductCount       int    `json:"product_count"`
		VerificationStatus string `json:"verification_status"`
		IsExclusive        bool   `json:"is_exclusive"`
	}

	var brands []ShopBrand
	database.DB.Raw(`
		SELECT
			b.id,
			b.display_id,
			b.brand_name,
			b.slug,
			COALESCE(b.logo_url, '')  AS logo_url,
			COALESCE(b.category, '')  AS category,
			COUNT(DISTINCT p.id)      AS product_count,
			b.verification_status     AS verification_status,
			b.is_exclusive            AS is_exclusive
		FROM brands b
		LEFT JOIN products p
			ON  p.brand_id   = b.id
			AND p.status     = 'active'
			AND p.deleted_at IS NULL
		WHERE b.deleted_at          IS NULL
		  AND b.verification_status  = 'verified'
		GROUP BY b.id, b.display_id, b.brand_name, b.slug, b.logo_url, b.category,
			b.verification_status, b.is_exclusive, b.featured_rank
		ORDER BY
			CASE WHEN b.featured_rank IS NULL THEN 1 ELSE 0 END ASC,
			b.featured_rank ASC,
			b.brand_name ASC
	`).Scan(&brands)

	if brands == nil {
		brands = []ShopBrand{}
	}

	utils.OK(c, "Brands fetched", gin.H{"brands": brands})
}

// ── GET /api/shop/categories ──────────────────────────────────────────────────
func ListCategories(c *gin.Context) {
	var cats []models.Category
	database.DB.Order("sort_order ASC, name ASC").Find(&cats)
	utils.OK(c, "Categories fetched", cats)
}