package handlers

import (
	"encoding/json"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

var allowedBrandSettings = map[string]bool{
	"enable_wishlist":     true,
	"enable_drops":        true,
	"drop_countdown":      true,
	"drop_duration_days":  true,
	"disable_purchases":   true,
	"currency":            true,
	"currency_symbol":     true,
	"low_stock_threshold": true,
	"commission_rate":     true,
	"maintenance_mode":    true,
	"maintenance_message": true,
}

var brandSettingDefaults = map[string]interface{}{
	"enable_wishlist":     true,
	"enable_drops":        true,
	"drop_countdown":      true,
	"drop_duration_days":  0,
	"disable_purchases":   false,
	"currency":            "NGN",
	"currency_symbol":     "N",
	"low_stock_threshold": 5,
	"commission_rate":     10,
	"maintenance_mode":    false,
	"maintenance_message": "We're updating the platform. Back soon.",
}

// GET /api/brand/platform-settings
func BrandGetPlatformSettings(c *gin.Context) {
	var rows []models.AdminSetting
	keys := make([]string, 0, len(allowedBrandSettings))
	for k := range allowedBrandSettings {
		keys = append(keys, k)
	}
	database.DB.Where("setting_key IN ?", keys).Find(&rows)

	settings := make(map[string]interface{}, len(brandSettingDefaults))
	for k, v := range brandSettingDefaults {
		settings[k] = v
	}

	for _, r := range rows {
		var parsed interface{}
		if json.Unmarshal([]byte(r.Value), &parsed) == nil {
			settings[r.Key] = parsed
		} else {
			settings[r.Key] = r.Value
		}
	}

	// Capture the platform default BEFORE any brand-specific override
	settings["platform_commission_rate"] = settings["commission_rate"]

	// Brand-specific override
	userID := c.GetUint("userID")
	if userID > 0 {
		var brand models.Brand
		if err := database.DB.Select("commission_rate").
			Where("user_id = ?", userID).
			First(&brand).Error; err == nil {
			if brand.CommissionRate != nil {
				settings["commission_rate"] = *brand.CommissionRate
			}
		}
	}

	utils.OK(c, "Platform settings fetched", settings)
}

// ── getAdminSettingBool ───────────────────────────────────────────────────────
// Reads one admin setting as bool. Returns fallback if missing or unparseable.
// Used by brand_drops.go to check enable_drops before allowing drop inserts.
func getAdminSettingBool(key string, fallback bool) bool {
	var row models.AdminSetting
	if err := database.DB.Where("setting_key = ?", key).First(&row).Error; err != nil {
		return fallback
	}
	var v bool
	if err := json.Unmarshal([]byte(row.Value), &v); err != nil {
		return fallback
	}
	return v
}

// ── getAdminSettingFloat ──────────────────────────────────────────────────────
// Reads one admin setting as float64. Returns fallback if missing or unparseable.
// Used by brand_drops.go to read drop_duration_days when setting ends_at.
func getAdminSettingFloat(key string, fallback float64) float64 {
	var row models.AdminSetting
	if err := database.DB.Where("setting_key = ?", key).First(&row).Error; err != nil {
		return fallback
	}
	var v float64
	if err := json.Unmarshal([]byte(row.Value), &v); err != nil {
		return fallback
	}
	return v
}