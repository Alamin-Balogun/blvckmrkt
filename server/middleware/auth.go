package middleware

import (
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// Auth validates the Bearer token, checks blacklist, and injects user claims into context.
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Authorization header missing")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			utils.Unauthorized(c, "Authorization header must be: Bearer <token>")
			c.Abort()
			return
		}

		tokenString := parts[1]

		// ✅ CHECK IF TOKEN IS BLACKLISTED (logged out)
		var blacklisted models.BlacklistedToken
		if err := database.DB.
			Where("token = ? AND expires_at > ?", tokenString, time.Now()).
			First(&blacklisted).Error; err == nil {
			// Token found in blacklist and not yet expired
			utils.Unauthorized(c, "This session has been logged out. Please log in again.")
			c.Abort()
			return
		}

		// Parse and validate token
		claims, err := utils.ParseToken(tokenString)
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired token")
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("userID", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("accountType", claims.AccountType)
		
		// Store token string for logout handler
		c.Set("token", tokenString)
		
		c.Next()
	}
}

// RequireBrand ensures only brand accounts can access the brand dashboard.
func RequireBrand() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("accountType") != "brand" {
			utils.Forbidden(c, "This dashboard is restricted to brand accounts")
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequireBuyer ensures only buyer accounts can access the buyer dashboard.
func RequireBuyer() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString("accountType") != "user" {
			utils.Forbidden(c, "This dashboard is restricted to buyer accounts")
			c.Abort()
			return
		}
		c.Next()
	}
}