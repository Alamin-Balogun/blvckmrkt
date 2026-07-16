package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ══════════════════════════════════════════════════════════════════════════════
// LOCAL SHIPPING RATES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/brand/shipping/local
func BrandListLocalShippingRates(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var rates []models.LocalShippingRate
	database.DB.
		Where("brand_id = ?", brand.ID).
		Order("country ASC, state ASC, city ASC").
		Find(&rates)

	utils.OK(c, "Local shipping rates fetched", gin.H{"rates": rates})
}

// POST /api/brand/shipping/local
// Upserts a rate — updates if country+state+city already exists, creates otherwise.
func BrandSaveLocalShippingRate(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		Country        string                `json:"country"          binding:"required"`
		CountryCode    string                `json:"country_code"     binding:"required"`
		State          string                `json:"state"            binding:"required"`
		StateCode      string                `json:"state_code"       binding:"required"`
		City           *string               `json:"city"`
		Currency       string                `json:"currency"`
		CurrencySymbol string                `json:"currency_symbol"`
		BasePrice      float64               `json:"base_price"       binding:"required,min=0"`
		AreaOverrides  models.AreaOverrides  `json:"area_overrides"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "country, country_code, state, state_code and base_price are required", nil)
		return
	}

	// Normalise city: empty string → NULL so the UNIQUE KEY works correctly
	var city *string
	if req.City != nil && *req.City != "" {
		city = req.City
	}

	// Ensure nil area_overrides becomes an empty slice (not null)
	overrides := req.AreaOverrides
	if overrides == nil {
		overrides = models.AreaOverrides{}
	}

	// Try to find an existing rate for this exact location
	var existing models.LocalShippingRate
	q := database.DB.Where(
		"brand_id = ? AND country_code = ? AND state_code = ?",
		brand.ID, req.CountryCode, req.StateCode,
	)
	if city != nil {
		q = q.Where("city = ?", *city)
	} else {
		q = q.Where("city IS NULL")
	}

	if err := q.First(&existing).Error; err == nil {
		// ── UPDATE ────────────────────────────────────────────────────────────
		existing.Country        = req.Country
		existing.State          = req.State
		existing.City           = city
		existing.Currency       = req.Currency
		existing.CurrencySymbol = req.CurrencySymbol
		existing.BasePrice      = req.BasePrice
		existing.AreaOverrides  = overrides

		if err := database.DB.Save(&existing).Error; err != nil {
			utils.InternalError(c, "Failed to update shipping rate")
			return
		}
		utils.OK(c, "Shipping rate updated", existing)
		return
	}

	// ── CREATE ────────────────────────────────────────────────────────────────
	rate := models.LocalShippingRate{
		BrandID:        brand.ID,
		Country:        req.Country,
		CountryCode:    req.CountryCode,
		State:          req.State,
		StateCode:      req.StateCode,
		City:           city,
		Currency:       req.Currency,
		CurrencySymbol: req.CurrencySymbol,
		BasePrice:      req.BasePrice,
		AreaOverrides:  overrides,
	}
	if err := database.DB.Create(&rate).Error; err != nil {
		utils.InternalError(c, "Failed to save shipping rate")
		return
	}

	utils.Created(c, "Shipping rate saved", rate)
}

// DELETE /api/brand/shipping/local/:id
func BrandDeleteLocalShippingRate(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid rate ID", nil)
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	result := database.DB.
		Where("id = ? AND brand_id = ?", id, brand.ID).
		Delete(&models.LocalShippingRate{})

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Shipping rate not found")
		return
	}

	utils.OK(c, "Shipping rate deleted", nil)
}

// ══════════════════════════════════════════════════════════════════════════════
// PICKUP LOCATIONS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/brand/pickup-locations
func BrandListPickupLocations(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var locations []models.PickupLocation
	database.DB.
		Where("brand_id = ?", brand.ID).
		Order("active DESC, created_at ASC").
		Find(&locations)

	utils.OK(c, "Pickup locations fetched", gin.H{"locations": locations})
}

// POST /api/brand/pickup-locations
func BrandCreatePickupLocation(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		Name         string `json:"name"         binding:"required"`
		Address      string `json:"address"      binding:"required"`
		City         string `json:"city"         binding:"required"`
		State        string `json:"state"`
		StateCode    string `json:"state_code"`
		Country      string `json:"country"`
		CountryCode  string `json:"country_code"`
		Phone        string `json:"phone"`
		Instructions string `json:"instructions"`
		Active       *bool  `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "name, address and city are required", nil)
		return
	}

	active := true
	if req.Active != nil {
		active = *req.Active
	}

	loc := models.PickupLocation{
		BrandID:      brand.ID,
		Name:         req.Name,
		Address:      req.Address,
		City:         req.City,
		State:        req.State,
		StateCode:    req.StateCode,
		Country:      req.Country,
		CountryCode:  req.CountryCode,
		Phone:        req.Phone,
		Instructions: req.Instructions,
		Active:       active,
	}
	if err := database.DB.Create(&loc).Error; err != nil {
		utils.InternalError(c, "Failed to create pickup location")
		return
	}

	utils.Created(c, "Pickup location created", loc)
}

// PUT /api/brand/pickup-locations/:id
func BrandUpdatePickupLocation(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid location ID", nil)
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var loc models.PickupLocation
	if err := database.DB.
		Where("id = ? AND brand_id = ?", id, brand.ID).
		First(&loc).Error; err != nil {
		utils.NotFound(c, "Pickup location not found")
		return
	}

	var req struct {
		Name         string `json:"name"`
		Address      string `json:"address"`
		City         string `json:"city"`
		State        string `json:"state"`
		StateCode    string `json:"state_code"`
		Country      string `json:"country"`
		CountryCode  string `json:"country_code"`
		Phone        string `json:"phone"`
		Instructions string `json:"instructions"`
		Active       *bool  `json:"active"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.Name    != "" { updates["name"]    = req.Name    }
	if req.Address != "" { updates["address"] = req.Address }
	if req.City    != "" { updates["city"]    = req.City    }
	// Always update optional fields (allow clearing)
	updates["state"]        = req.State
	updates["state_code"]   = req.StateCode
	updates["country"]      = req.Country
	updates["country_code"] = req.CountryCode
	updates["phone"]        = req.Phone
	updates["instructions"] = req.Instructions
	if req.Active != nil {
		updates["active"] = *req.Active
	}

	if err := database.DB.Model(&loc).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to update pickup location")
		return
	}

	database.DB.First(&loc, loc.ID)
	utils.OK(c, "Pickup location updated", loc)
}

// DELETE /api/brand/pickup-locations/:id
func BrandDeletePickupLocation(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid location ID", nil)
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	result := database.DB.
		Where("id = ? AND brand_id = ?", id, brand.ID).
		Delete(&models.PickupLocation{})

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Pickup location not found")
		return
	}

	utils.OK(c, "Pickup location deleted", nil)
}