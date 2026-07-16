package handlers

import (
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ShowcaseProduct wraps a Product with the brand display name and live availability flag.
type ShowcaseProduct struct {
	models.Product
	BrandName string `json:"brand_name"`
	Available bool   `json:"available"` // false = product is sold out via paid orders
}

// isAvailableForShowcase returns true only if the product has remaining purchasable stock.
//
// Calculation:
//
//	totalStock  = SUM(product_sizes.stock)                        ← warehouse stock
//	paidQty     = SUM(order_items.quantity) WHERE payment_status = 'paid'
//	available   = paidQty < totalStock
//
// A product where every size has stock = 0 is also excluded (zero-stock guard).
func isAvailableForShowcase(productID uint, sizes []models.ProductSize) bool {
	totalStock := 0
	for _, s := range sizes {
		totalStock += s.Stock
	}
	if totalStock == 0 {
		return false
	}

	var result struct{ Total int }
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.quantity), 0) AS total
		FROM order_items oi
		INNER JOIN orders o ON o.id = oi.order_id AND o.deleted_at IS NULL
		WHERE oi.product_id = ?
		  AND o.payment_status = 'paid'
	`, productID).Scan(&result)

	return result.Total < totalStock
}

// enrichWithBrandNames attaches brand store names to a slice of products
// and evaluates real-time availability for each one.
// It issues a single extra DB call to fetch all required brand names at once.
func enrichWithBrandNames(products []models.Product) []ShowcaseProduct {
	if len(products) == 0 {
		return []ShowcaseProduct{}
	}

	// Collect unique brand IDs so we can batch-fetch their names.
	brandIDs := make([]uint, 0, len(products))
	seen := map[uint]bool{}
	for _, p := range products {
		if !seen[p.BrandID] {
			brandIDs = append(brandIDs, p.BrandID)
			seen[p.BrandID] = true
		}
	}

	// Pull brand_name from the brands table in one query.
	var brandRows []struct {
		ID        uint
		BrandName string
	}
	database.DB.Table("brands").
		Select("id, brand_name").
		Where("id IN ?", brandIDs).
		Scan(&brandRows)

	nameMap := map[uint]string{}
	for _, b := range brandRows {
		nameMap[b.ID] = b.BrandName
	}

	result := make([]ShowcaseProduct, 0, len(products))
	for _, p := range products {
		result = append(result, ShowcaseProduct{
			Product:   p,
			BrandName: nameMap[p.BrandID],
			Available: isAvailableForShowcase(p.ID, p.Sizes),
		})
	}
	return result
}

// GetShowcaseProducts — GET /api/shop/showcase
//
// Brand eligibility rule (same as /api/shop/products):
//
//	brands.verification_status = 'verified'
//	brands.subscription_status IN ('active', 'trial')
//	brands.deleted_at IS NULL
//
// Returns two lists:
//
//	"featured" — products the brand explicitly flagged as is_featured=true,
//	             status='active', from eligible brands only.
//	"latest"   — the 30 most recently created active products from eligible brands.
//
// Both lists include Images and Sizes preloaded and carry `available` + `brand_name`.
// Sold-out items are returned with available=false so the frontend can display a
// "Sold Out" overlay rather than hiding them entirely.
func GetShowcaseProducts(c *gin.Context) {
	// ── Eligible brand IDs ────────────────────────────────────────────────────
	// Same rule used by the public shop:
	//   verification_status = 'verified'  (not just 'pending')
	//   subscription_status IN ('active', 'trial')
	//   deleted_at IS NULL
	var eligibleBrandIDs []uint
	database.DB.Table("brands").
		Select("id").
		Where(
			"verification_status = ? AND subscription_status IN ? AND deleted_at IS NULL",
			"verified",
			[]string{"active", "trial"},
		).
		Pluck("id", &eligibleBrandIDs)

	// Nothing to show if no eligible brands exist yet.
	if len(eligibleBrandIDs) == 0 {
		utils.OK(c, "Showcase products fetched", gin.H{
			"featured": []ShowcaseProduct{},
			"latest":   []ShowcaseProduct{},
		})
		return
	}

	// ── Featured products ─────────────────────────────────────────────────────
	// is_featured = true, status = 'active', brand must be shop-eligible.
	var featuredRaw []models.Product
	database.DB.
		Where(
			"is_featured = ? AND status = ? AND brand_id IN ?",
			true,
			models.ProductActive,
			eligibleBrandIDs,
		).
		Preload("Images").
		Preload("Sizes").
		Order("updated_at DESC").
		Find(&featuredRaw)

	featured := enrichWithBrandNames(featuredRaw)

	// ── Latest products ───────────────────────────────────────────────────────
	// 30 most recently created active products from eligible brands.
	var latestRaw []models.Product
	database.DB.
		Where(
			"status = ? AND brand_id IN ?",
			models.ProductActive,
			eligibleBrandIDs,
		).
		Preload("Images").
		Preload("Sizes").
		Order("created_at DESC").
		Limit(30).
		Find(&latestRaw)

	latest := enrichWithBrandNames(latestRaw)

	utils.OK(c, "Showcase products fetched", gin.H{
		"featured": featured,
		"latest":   latest,
	})
}