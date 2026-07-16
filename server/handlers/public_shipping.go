package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/shop/brands/:brandId/shipping ───────────────────────────────────
// Public — no auth required.
// Returns all shipping information for a brand:
// - Active shipping zones (with locations + active methods)
// - Local shipping rates
// - Active pickup locations
// Used by the product detail page Shipping tab.
func GetShopShipping(c *gin.Context) {
	brandIDStr := c.Param("brandId")
	if brandIDStr == "" {
		utils.BadRequest(c, "brandId is required", nil)
		return
	}
	brandID, err := strconv.ParseUint(brandIDStr, 10, 64)
	if err != nil || brandID == 0 {
		utils.BadRequest(c, "Invalid brandId", nil)
		return
	}

	// Verify brand is shop-eligible before returning its shipping info
	var brand models.Brand
	if err := database.DB.
		Where("id = ? AND deleted_at IS NULL AND verification_status = 'verified' AND subscription_status IN ('active','trial')", brandID).
		First(&brand).Error; err != nil {
		// Brand not found or not eligible — return empty, not an error,
		// so the frontend just shows "No shipping information available"
		utils.OK(c, "Shipping fetched", gin.H{
			"zones":   []interface{}{},
			"local":   []interface{}{},
			"pickups": []interface{}{},
		})
		return
	}

	// ── Fetch active zones with locations and active methods ─────────────
	var zones []models.ShippingZone
	database.DB.
		Where("brand_id = ? AND is_active = true AND deleted_at IS NULL", brandID).
		Preload("Locations").
		Preload("Methods", "is_active = true AND deleted_at IS NULL").
		Order("created_at ASC").
		Find(&zones)

	// ── Fetch local shipping rates ───────────────────────────────────────
	var local []models.LocalShippingRate
	database.DB.
		Where("brand_id = ?", brandID).
		Order("country ASC, state ASC, city ASC").
		Find(&local)

	// ── Fetch active pickup locations ────────────────────────────────────
	var pickups []models.PickupLocation
	database.DB.
		Where("brand_id = ? AND active = true", brandID).
		Order("created_at ASC").
		Find(&pickups)

	// Ensure nil slices become empty arrays in JSON
	if zones == nil {
		zones = []models.ShippingZone{}
	}
	if local == nil {
		local = []models.LocalShippingRate{}
	}
	if pickups == nil {
		pickups = []models.PickupLocation{}
	}

	utils.OK(c, "Shipping fetched", gin.H{
		"zones":   zones,
		"local":   local,
		"pickups": pickups,
	})
}