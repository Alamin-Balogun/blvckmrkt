package middleware

import (
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// RequireVerifiedBrand blocks brand dashboard access only when an admin has
// suspended the account. Pending (not-yet-verified) brands get full
// dashboard access — verification only controls whether their products are
// publicly visible (see the verification_status filter in shop.go), not
// whether they can log in and use their dashboard. Replaces the old
// SubscriptionGuard — the subscription feature has been removed.
func RequireVerifiedBrand() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")

		var brand models.Brand
		if err := database.DB.Where("user_id = ?", userID).First(&brand).Error; err != nil {
			utils.Forbidden(c, "Brand profile not found")
			c.Abort()
			return
		}

		if brand.VerificationStatus == models.VerificationSuspended {
			utils.Forbidden(c, "Your brand's dashboard access has been suspended. "+
				"Contact blvckmrkt.market@gmail.com for details.")
			c.Abort()
			return
		}

		c.Next()
	}
}
