package middleware

import (
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
)

// localhostPattern matches any http/https localhost or 127.0.0.1 origin on any port
var localhostPattern = regexp.MustCompile(`^https?://(localhost|127\.0\.0\.1)(:\d+)?$`)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if localhostPattern.MatchString(origin) {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}