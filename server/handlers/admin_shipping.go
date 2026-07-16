package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ── Zones ─────────────────────────────────────────────────────────────────────

func AdminListShippingZones(c *gin.Context) {
	var zones []models.ShippingZone
	q := database.DB.
		Preload("Locations").
		Preload("Methods", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Order("created_at DESC")

	// Optional brand filter
	if brandID := c.Query("brand_id"); brandID != "" {
		q = q.Where("brand_id = ?", brandID)
	}

	if err := q.Find(&zones).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to load shipping zones"})
		return
	}
	c.JSON(200, gin.H{"success": true, "data": zones})
}

func AdminCreateShippingZone(c *gin.Context) {
	var input struct {
		Name    string `json:"name" binding:"required"`
		BrandID uint   `json:"brand_id"`
		UserID  uint   `json:"user_id"`
		Locations []struct {
			Country string `json:"country"`
			State   string `json:"state"`
		} `json:"locations"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Zone name is required"})
		return
	}

	zone := models.ShippingZone{
		Name:     input.Name,
		BrandID:  input.BrandID,
		UserID:   input.UserID,
		IsActive: true,
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&zone).Error; err != nil {
			return err
		}
		for _, loc := range input.Locations {
			if loc.Country == "" {
				continue
			}
			l := models.ShippingZoneLocation{
				ZoneID:  zone.ID,
				Country: loc.Country,
				State:   loc.State,
			}
			if err := tx.Create(&l).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to create zone"})
		return
	}

	database.DB.Preload("Locations").Preload("Methods").First(&zone, zone.ID)
	c.JSON(200, gin.H{"success": true, "message": "Zone created", "data": zone})
}

func AdminUpdateShippingZone(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var zone models.ShippingZone
	if err := database.DB.First(&zone, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Zone not found"})
		return
	}

	var input struct {
		Name    string `json:"name"`
		BrandID *uint  `json:"brand_id"`
		UserID  *uint  `json:"user_id"`
		Locations []struct {
			Country string `json:"country"`
			State   string `json:"state"`
		} `json:"locations"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Invalid input"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if input.Name != "" {
			zone.Name = input.Name
		}
		if input.BrandID != nil {
			zone.BrandID = *input.BrandID
		}
		if input.UserID != nil {
			zone.UserID = *input.UserID
		}
		if err := tx.Save(&zone).Error; err != nil {
			return err
		}

		// Replace locations if provided
		if input.Locations != nil {
			tx.Where("zone_id = ?", zone.ID).Delete(&models.ShippingZoneLocation{})
			for _, loc := range input.Locations {
				if loc.Country == "" {
					continue
				}
				l := models.ShippingZoneLocation{
					ZoneID:  zone.ID,
					Country: loc.Country,
					State:   loc.State,
				}
				if err := tx.Create(&l).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to update zone"})
		return
	}

	database.DB.Preload("Locations").Preload("Methods").First(&zone, zone.ID)
	c.JSON(200, gin.H{"success": true, "message": "Zone updated", "data": zone})
}

func AdminDeleteShippingZone(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var zone models.ShippingZone
	if err := database.DB.First(&zone, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Zone not found"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		tx.Where("zone_id = ?", zone.ID).Delete(&models.ShippingZoneLocation{})
		tx.Where("zone_id = ?", zone.ID).Delete(&models.ShippingMethod{})
		return tx.Delete(&zone).Error
	})
	if err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to delete zone"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Zone deleted"})
}

// ── Methods ───────────────────────────────────────────────────────────────────

func AdminCreateShippingMethod(c *gin.Context) {
	zoneID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var zone models.ShippingZone
	if err := database.DB.First(&zone, zoneID).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Zone not found"})
		return
	}

	var input struct {
		Name        string                   `json:"name" binding:"required"`
		Description string                   `json:"description"`
		PricingType models.ShippingPricingType `json:"pricing_type"`
		FlatRate    float64                  `json:"flat_rate"`
		PerItemRate float64                  `json:"per_item_rate"`
		WeightRate  float64                  `json:"weight_rate"`
		FreeAbove   *float64                 `json:"free_above"`
		MinDays     *int                     `json:"min_days"`
		MaxDays     *int                     `json:"max_days"`
		IsActive    *bool                    `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Method name is required"})
		return
	}

	active := true
	if input.IsActive != nil {
		active = *input.IsActive
	}
	if input.PricingType == "" {
		input.PricingType = models.PricingFlat
	}

	m := models.ShippingMethod{
		ZoneID:      uint(zoneID),
		BrandID:     zone.BrandID,
		Name:        input.Name,
		Description: input.Description,
		PricingType: input.PricingType,
		FlatRate:    input.FlatRate,
		PerItemRate: input.PerItemRate,
		WeightRate:  input.WeightRate,
		FreeAbove:   input.FreeAbove,
		MinDays:     input.MinDays,
		MaxDays:     input.MaxDays,
		IsActive:    active,
	}

	if err := database.DB.Create(&m).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to create method"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Method created", "data": m})
}

func AdminUpdateShippingMethod(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var m models.ShippingMethod
	if err := database.DB.First(&m, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Method not found"})
		return
	}

	var input struct {
		Name        string                    `json:"name"`
		Description string                    `json:"description"`
		PricingType models.ShippingPricingType `json:"pricing_type"`
		FlatRate    float64                   `json:"flat_rate"`
		PerItemRate float64                   `json:"per_item_rate"`
		WeightRate  float64                   `json:"weight_rate"`
		FreeAbove   *float64                  `json:"free_above"`
		MinDays     *int                      `json:"min_days"`
		MaxDays     *int                      `json:"max_days"`
		IsActive    *bool                     `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "Invalid input"})
		return
	}

	updates := map[string]interface{}{
		"name":          input.Name,
		"description":   input.Description,
		"pricing_type":  input.PricingType,
		"flat_rate":     input.FlatRate,
		"per_item_rate": input.PerItemRate,
		"weight_rate":   input.WeightRate,
		"free_above":    input.FreeAbove,
		"min_days":      input.MinDays,
		"max_days":      input.MaxDays,
	}
	if input.IsActive != nil {
		updates["is_active"] = *input.IsActive
	}

	if err := database.DB.Model(&m).Updates(updates).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to update method"})
		return
	}

	database.DB.First(&m, id)
	c.JSON(200, gin.H{"success": true, "message": "Method updated", "data": m})
}

func AdminDeleteShippingMethod(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var m models.ShippingMethod
	if err := database.DB.First(&m, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Method not found"})
		return
	}

	if err := database.DB.Delete(&m).Error; err != nil {
		c.JSON(500, gin.H{"success": false, "message": "Failed to delete method"})
		return
	}

	c.JSON(200, gin.H{"success": true, "message": "Method deleted"})
}

func AdminToggleShippingMethod(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var m models.ShippingMethod
	if err := database.DB.First(&m, id).Error; err != nil {
		c.JSON(404, gin.H{"success": false, "message": "Method not found"})
		return
	}

	m.IsActive = !m.IsActive
	database.DB.Save(&m)

	c.JSON(200, gin.H{"success": true, "data": gin.H{"id": m.ID, "is_active": m.IsActive}})
}