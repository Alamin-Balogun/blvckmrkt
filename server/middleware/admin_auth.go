package middleware

import (
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// RequireAdmin validates the admin Bearer JWT (separate from regular user JWTs).
// On success injects:
//
//	c.Set("adminID",    claims.AdminID)  — uint
//	c.Set("adminEmail", claims.Email)    — string
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			utils.Unauthorized(c, "Authorization header missing or malformed")
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")

		claims, err := utils.ParseAdminToken(tokenStr)
		if err != nil {
			utils.Unauthorized(c, "Invalid or expired admin token")
			c.Abort()
			return
		}

		c.Set("adminID",    claims.AdminID)
		c.Set("adminEmail", claims.Email)
		c.Next()
	}
}