package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ══════════════════════════════════════════════════════════════════════════════
// ZONES
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/brand/shipping/zones
// Returns all zones (with locations + methods) for the brand.
func BrandListShippingZones(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var zones []models.ShippingZone
	database.DB.
		Where("brand_id = ? AND deleted_at IS NULL", brand.ID).
		Preload("Locations").
		Preload("Methods", "deleted_at IS NULL").
		Order("created_at ASC").
		Find(&zones)

	utils.OK(c, "Zones fetched", zones)
}

// POST /api/brand/shipping/zones
func BrandCreateShippingZone(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		Name      string `json:"name" binding:"required"`
		IsActive  *bool  `json:"is_active"`
		Locations []struct {
			Country string `json:"country" binding:"required"`
			State   string `json:"state"`
		} `json:"locations"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "name is required", nil)
		return
	}

	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	zone := models.ShippingZone{
		BrandID:  brand.ID,
		UserID:   userID,
		Name:     req.Name,
		IsActive: active,
	}
	if err := database.DB.Create(&zone).Error; err != nil {
		utils.InternalError(c, "Failed to create zone")
		return
	}

	for _, loc := range req.Locations {
		if loc.Country == "" {
			continue
		}
		database.DB.Create(&models.ShippingZoneLocation{
			ZoneID:  zone.ID,
			Country: loc.Country,
			State:   loc.State,
		})
	}

	database.DB.Preload("Locations").Preload("Methods").First(&zone, zone.ID)
	utils.Created(c, "Zone created", zone)
}

// PUT /api/brand/shipping/zones/:id
func BrandUpdateShippingZone(c *gin.Context) {
	userID := c.GetUint("userID")
	zoneID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var zone models.ShippingZone
	if err := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", zoneID, brand.ID).
		First(&zone).Error; err != nil {
		utils.NotFound(c, "Zone not found")
		return
	}

	var req struct {
		Name      string `json:"name"`
		IsActive  *bool  `json:"is_active"`
		Locations []struct {
			Country string `json:"country"`
			State   string `json:"state"`
		} `json:"locations"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if len(updates) > 0 {
		database.DB.Model(&zone).Updates(updates)
	}

	// Replace locations if provided
	if req.Locations != nil {
		database.DB.Where("zone_id = ?", zone.ID).Delete(&models.ShippingZoneLocation{})
		for _, loc := range req.Locations {
			if loc.Country == "" {
				continue
			}
			database.DB.Create(&models.ShippingZoneLocation{
				ZoneID:  zone.ID,
				Country: loc.Country,
				State:   loc.State,
			})
		}
	}

	database.DB.Preload("Locations").Preload("Methods", "deleted_at IS NULL").First(&zone, zone.ID)
	utils.OK(c, "Zone updated", zone)
}

// DELETE /api/brand/shipping/zones/:id
func BrandDeleteShippingZone(c *gin.Context) {
	userID := c.GetUint("userID")
	zoneID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	result := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", zoneID, brand.ID).
		Delete(&models.ShippingZone{})

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Zone not found")
		return
	}

	// Soft-delete all methods in this zone too
	database.DB.
		Where("zone_id = ? AND brand_id = ?", zoneID, brand.ID).
		Delete(&models.ShippingMethod{})

	utils.OK(c, "Zone deleted", nil)
}

// ══════════════════════════════════════════════════════════════════════════════
// METHODS
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/brand/shipping/zones/:zoneId/methods
func BrandCreateShippingMethod(c *gin.Context) {
	userID := c.GetUint("userID")
	zoneID, _ := strconv.ParseUint(c.Param("zoneId"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	// Confirm zone belongs to brand
	var zone models.ShippingZone
	if err := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", zoneID, brand.ID).
		First(&zone).Error; err != nil {
		utils.NotFound(c, "Zone not found")
		return
	}

	var req struct {
		Name           string   `json:"name"            binding:"required"`
		Description    string   `json:"description"`
		PricingType    string   `json:"pricing_type"`
		FlatRate       float64  `json:"flat_rate"`
		PerItemRate    float64  `json:"per_item_rate"`
		WeightRate     float64  `json:"weight_rate"`
		FreeAbove      *float64 `json:"free_above"`
		MinDays        *int     `json:"min_days"`
		MaxDays        *int     `json:"max_days"`
		IsActive       *bool    `json:"is_active"`
		Currency       string   `json:"currency"`        // ISO code e.g. NGN, USD, GBP
		CurrencySymbol string   `json:"currency_symbol"` // e.g. ₦, $, £
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "name is required", nil)
		return
	}

	pt := models.PricingFlat
	if req.PricingType != "" {
		pt = models.ShippingPricingType(req.PricingType)
	}

	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}

	method := models.ShippingMethod{
		ZoneID:         zone.ID,
		BrandID:        brand.ID,
		Name:           req.Name,
		Description:    req.Description,
		PricingType:    pt,
		FlatRate:       req.FlatRate,
		PerItemRate:    req.PerItemRate,
		WeightRate:     req.WeightRate,
		FreeAbove:      req.FreeAbove,
		MinDays:        req.MinDays,
		MaxDays:        req.MaxDays,
		IsActive:       active,
		Currency:       req.Currency,
		CurrencySymbol: req.CurrencySymbol,
	}
	if err := database.DB.Create(&method).Error; err != nil {
		utils.InternalError(c, "Failed to create method")
		return
	}

	utils.Created(c, "Method created", method)
}

// PUT /api/brand/shipping/methods/:id
func BrandUpdateShippingMethod(c *gin.Context) {
	userID := c.GetUint("userID")
	methodID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var method models.ShippingMethod
	if err := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", methodID, brand.ID).
		First(&method).Error; err != nil {
		utils.NotFound(c, "Method not found")
		return
	}

	var req struct {
		Name           string   `json:"name"`
		Description    string   `json:"description"`
		PricingType    string   `json:"pricing_type"`
		FlatRate       *float64 `json:"flat_rate"`
		PerItemRate    *float64 `json:"per_item_rate"`
		WeightRate     *float64 `json:"weight_rate"`
		FreeAbove      *float64 `json:"free_above"`
		MinDays        *int     `json:"min_days"`
		MaxDays        *int     `json:"max_days"`
		IsActive       *bool    `json:"is_active"`
		Currency       string   `json:"currency"`        // ISO code e.g. NGN, USD, GBP
		CurrencySymbol string   `json:"currency_symbol"` // e.g. ₦, $, £
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.Name != ""        { updates["name"]         = req.Name        }
	if req.Description != "" { updates["description"]  = req.Description }
	if req.PricingType != "" { updates["pricing_type"] = req.PricingType }
	if req.FlatRate != nil   { updates["flat_rate"]    = *req.FlatRate   }
	if req.PerItemRate != nil { updates["per_item_rate"] = *req.PerItemRate }
	if req.WeightRate != nil { updates["weight_rate"]  = *req.WeightRate }
	if req.MinDays != nil    { updates["min_days"]     = *req.MinDays    }
	if req.MaxDays != nil    { updates["max_days"]     = *req.MaxDays    }
	if req.IsActive != nil   { updates["is_active"]    = *req.IsActive   }
	// Currency — update whenever sent (brand may change their mind on the currency)
	if req.Currency != ""       { updates["currency"]        = req.Currency       }
	if req.CurrencySymbol != "" { updates["currency_symbol"] = req.CurrencySymbol }
	// FreeAbove can be set to null (disable) or a value — always update when key is present
	updates["free_above"] = req.FreeAbove

	database.DB.Model(&method).Updates(updates)
	database.DB.First(&method, method.ID)
	utils.OK(c, "Method updated", method)
}

// DELETE /api/brand/shipping/methods/:id
func BrandDeleteShippingMethod(c *gin.Context) {
	userID := c.GetUint("userID")
	methodID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	result := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", methodID, brand.ID).
		Delete(&models.ShippingMethod{})

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Method not found")
		return
	}

	utils.OK(c, "Method deleted", nil)
}

// PATCH /api/brand/shipping/methods/:id/toggle
// Quick active/inactive toggle
func BrandToggleShippingMethod(c *gin.Context) {
	userID := c.GetUint("userID")
	methodID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var method models.ShippingMethod
	if err := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", methodID, brand.ID).
		First(&method).Error; err != nil {
		utils.NotFound(c, "Method not found")
		return
	}

	newState := !method.IsActive
	database.DB.Model(&method).Update("is_active", newState)

	utils.OK(c, "Method toggled", gin.H{"id": methodID, "is_active": newState})
}