package middleware

import (
	"encoding/json"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/gin-gonic/gin"
)

// PurchasesEnabled blocks the request with 503 if the admin has set
// disable_purchases = true in admin_settings.
// Apply this to any route that creates or modifies orders/cart checkouts.
func PurchasesEnabled() gin.HandlerFunc {
	return func(c *gin.Context) {
		var setting models.AdminSetting
		if err := database.DB.Where("setting_key = ?", "disable_purchases").First(&setting).Error; err == nil {
			var disabled bool
			if json.Unmarshal([]byte(setting.Value), &disabled) == nil && disabled {
				c.AbortWithStatusJSON(503, gin.H{
					"success": false,
					"message": "Purchases are temporarily unavailable. Please try again later.",
				})
				return
			}
		}
		c.Next()
	}
}