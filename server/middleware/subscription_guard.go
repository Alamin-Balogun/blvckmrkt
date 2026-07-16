package middleware

import (
    "github.com/Alamin-Balogun/blvckmrkt/database"
    "github.com/Alamin-Balogun/blvckmrkt/models"
    "github.com/Alamin-Balogun/blvckmrkt/utils"
    "github.com/gin-gonic/gin"
)

// SubscriptionGuard blocks brand dashboard access when subscription
// status is none (transfer pending), expired, or cancelled.
func SubscriptionGuard() gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetUint("userID")

        var brand models.Brand
        if err := database.DB.Where("user_id = ?", userID).First(&brand).Error; err != nil {
            utils.Forbidden(c, "Brand profile not found")
            c.Abort()
            return
        }

        blocked := map[string]bool{
            "none":      true,
            "expired":   true,
            "cancelled": true,
        }

        // ✅ Convert custom type to string
        if blocked[string(brand.SubscriptionStatus)] {
            utils.Forbidden(c, "Your subscription is not active. "+
                "If you paid via bank transfer, your payment is pending admin verification. "+
                "Contact blvckmrkt.market@gmail.com if this takes longer than 7 business days.")
            c.Abort()
            return
        }

        c.Next()
    }
}