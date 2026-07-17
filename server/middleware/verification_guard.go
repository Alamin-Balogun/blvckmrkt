package middleware

import (
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// RequireVerifiedBrand blocks brand dashboard access until admin has marked
// the brand's account verified. Replaces the old SubscriptionGuard — the
// subscription feature has been removed, so verification status alone now
// decides whether a brand's dashboard/storefront presence is active.
func RequireVerifiedBrand() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")

		var brand models.Brand
		if err := database.DB.Where("user_id = ?", userID).First(&brand).Error; err != nil {
			utils.Forbidden(c, "Brand profile not found")
			c.Abort()
			return
		}

		if brand.VerificationStatus != models.VerificationVerified {
			utils.Forbidden(c, "Your brand is still pending verification. "+
				"We'll notify you once it's approved. Contact blvckmrkt.market@gmail.com if this takes longer than a few business days.")
			c.Abort()
			return
		}

		c.Next()
	}
}
