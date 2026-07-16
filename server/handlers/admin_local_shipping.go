package handlers

import (
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/gin-gonic/gin"
)

// ── Local Shipping Rates ──────────────────────────────────────────────────────

func AdminListLocalShippingRates(c *gin.Context) {
	var rates []models.LocalShippingRate
	q := database.DB.Order("created_at DESC")

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		like := "%" + search + "%"
		q = q.Where("country LIKE ? OR state LIKE ? OR city LIKE ?", like, like, like)
	}
	if brandID := c.Query("brand_id"); brandID != "" {
		q = q.Where("brand_id = ?", brandID)
	}
	if country := c.Query("country_code"); country != "" {
		q = q.Where("country_code = ?", country)
	}

	if err := q.Find(&rates).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to load local shipping rates"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": rates})
}

func AdminGetLocalShippingRate(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var rate models.LocalShippingRate
	if err := database.DB.First(&rate, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Rate not found"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": rate})
}

func AdminCreateLocalShippingRate(c *gin.Context) {
	var input struct {
		BrandID        uint                 `json:"brand_id" binding:"required"`
		Country        string               `json:"country" binding:"required"`
		CountryCode    string               `json:"country_code" binding:"required"`
		State          string               `json:"state"`
		StateCode      string               `json:"state_code"`
		City           *string              `json:"city"`
		Currency       string               `json:"currency"`
		CurrencySymbol string               `json:"currency_symbol"`
		BasePrice      float64              `json:"base_price"`
		AreaOverrides  models.AreaOverrides  `json:"area_overrides"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Brand, country, and country code are required"})
		return
	}

	if input.AreaOverrides == nil {
		input.AreaOverrides = models.AreaOverrides{}
	}

	rate := models.LocalShippingRate{
		BrandID:        input.BrandID,
		Country:        input.Country,
		CountryCode:    input.CountryCode,
		State:          input.State,
		StateCode:      input.StateCode,
		City:           input.City,
		Currency:       input.Currency,
		CurrencySymbol: input.CurrencySymbol,
		BasePrice:      input.BasePrice,
		AreaOverrides:  input.AreaOverrides,
	}

	if err := database.DB.Create(&rate).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to create rate"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Rate created", "data": rate})
}

func AdminUpdateLocalShippingRate(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var rate models.LocalShippingRate
	if err := database.DB.First(&rate, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Rate not found"})
		return
	}

	var input struct {
		BrandID        *uint                `json:"brand_id"`
		Country        string               `json:"country"`
		CountryCode    string               `json:"country_code"`
		State          string               `json:"state"`
		StateCode      string               `json:"state_code"`
		City           *string              `json:"city"`
		Currency       string               `json:"currency"`
		CurrencySymbol string               `json:"currency_symbol"`
		BasePrice      *float64             `json:"base_price"`
		AreaOverrides  *models.AreaOverrides `json:"area_overrides"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Invalid input"})
		return
	}

	if input.BrandID != nil {
		rate.BrandID = *input.BrandID
	}
	if input.Country != "" {
		rate.Country = input.Country
	}
	if input.CountryCode != "" {
		rate.CountryCode = input.CountryCode
	}
	rate.State = input.State
	rate.StateCode = input.StateCode
	if input.City != nil {
		rate.City = input.City
	}
	if input.Currency != "" {
		rate.Currency = input.Currency
	}
	if input.CurrencySymbol != "" {
		rate.CurrencySymbol = input.CurrencySymbol
	}
	if input.BasePrice != nil {
		rate.BasePrice = *input.BasePrice
	}
	if input.AreaOverrides != nil {
		rate.AreaOverrides = *input.AreaOverrides
	}

	if err := database.DB.Save(&rate).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to update rate"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Rate updated", "data": rate})
}

func AdminDeleteLocalShippingRate(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var rate models.LocalShippingRate
	if err := database.DB.First(&rate, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Rate not found"})
		return
	}

	if err := database.DB.Unscoped().Delete(&rate).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to delete rate"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Rate deleted"})
}

// ── Pickup Locations ──────────────────────────────────────────────────────────

func AdminListPickupLocations(c *gin.Context) {
	var locations []models.PickupLocation
	q := database.DB.Order("created_at DESC")

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		like := "%" + search + "%"
		q = q.Where("name LIKE ? OR city LIKE ? OR state LIKE ? OR address LIKE ?", like, like, like, like)
	}
	if brandID := c.Query("brand_id"); brandID != "" {
		q = q.Where("brand_id = ?", brandID)
	}
	if status := c.Query("status"); status != "" {
		if status == "active" {
			q = q.Where("active = ?", true)
		} else if status == "inactive" {
			q = q.Where("active = ?", false)
		}
	}

	if err := q.Find(&locations).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to load pickup locations"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": locations})
}

func AdminGetPickupLocation(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loc models.PickupLocation
	if err := database.DB.First(&loc, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Pickup location not found"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": loc})
}

func AdminCreatePickupLocation(c *gin.Context) {
	var input struct {
		BrandID      uint   `json:"brand_id" binding:"required"`
		Name         string `json:"name" binding:"required"`
		Address      string `json:"address" binding:"required"`
		City         string `json:"city"`
		State        string `json:"state"`
		StateCode    string `json:"state_code"`
		Country      string `json:"country"`
		CountryCode  string `json:"country_code"`
		Phone        string `json:"phone"`
		Instructions string `json:"instructions"`
		Active       *bool  `json:"active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Brand, name, and address are required"})
		return
	}

	active := true
	if input.Active != nil {
		active = *input.Active
	}

	loc := models.PickupLocation{
		BrandID:      input.BrandID,
		Name:         input.Name,
		Address:      input.Address,
		City:         input.City,
		State:        input.State,
		StateCode:    input.StateCode,
		Country:      input.Country,
		CountryCode:  input.CountryCode,
		Phone:        input.Phone,
		Instructions: input.Instructions,
		Active:       active,
	}

	if err := database.DB.Create(&loc).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to create pickup location"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Pickup location created", "data": loc})
}

func AdminUpdatePickupLocation(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loc models.PickupLocation
	if err := database.DB.First(&loc, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Pickup location not found"})
		return
	}

	var input struct {
		BrandID      *uint  `json:"brand_id"`
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
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Invalid input"})
		return
	}

	if input.BrandID != nil {
		loc.BrandID = *input.BrandID
	}
	if input.Name != "" {
		loc.Name = input.Name
	}
	if input.Address != "" {
		loc.Address = input.Address
	}
	loc.City = input.City
	loc.State = input.State
	loc.StateCode = input.StateCode
	loc.Country = input.Country
	loc.CountryCode = input.CountryCode
	loc.Phone = input.Phone
	loc.Instructions = input.Instructions
	if input.Active != nil {
		loc.Active = *input.Active
	}

	if err := database.DB.Save(&loc).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to update pickup location"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Pickup location updated", "data": loc})
}

func AdminDeletePickupLocation(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var loc models.PickupLocation
	if err := database.DB.First(&loc, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Pickup location not found"})
		return
	}

	if err := database.DB.Unscoped().Delete(&loc).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to delete pickup location"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Pickup location deleted"})
}