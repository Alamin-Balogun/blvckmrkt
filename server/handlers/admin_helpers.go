package handlers

import (
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/gin-gonic/gin"
)

// adminPageParams extracts ?page= and ?limit= from the request.
// Defaults: page=1, limit=20, max limit=100.
func adminPageParams(c *gin.Context) (limit int, offset int) {
	limit = 20
	page := 1

	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 1 {
		page = p
	}

	offset = (page - 1) * limit
	return
}

// adminTimeAgo returns a human-readable relative time string.
func adminTimeAgo(t time.Time) string {
	d := time.Since(t)
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		m := int(d.Minutes())
		if m == 1 {
			return "1 minute ago"
		}
		return strconv.Itoa(m) + " minutes ago"
	case d < 24*time.Hour:
		h := int(d.Hours())
		if h == 1 {
			return "1 hour ago"
		}
		return strconv.Itoa(h) + " hours ago"
	case d < 7*24*time.Hour:
		days := int(d.Hours() / 24)
		if days == 1 {
			return "1 day ago"
		}
		return strconv.Itoa(days) + " days ago"
	default:
		return t.Format("2 Jan 2006")
	}
}

// adminIDFromCtx extracts the admin's uint ID from the Gin context.
// Set by middleware.RequireAdmin() after JWT validation.
func adminIDFromCtx(c *gin.Context) uint {
	v, _ := c.Get("adminID")
	id, _ := v.(uint)
	return id
}

// logActivity records an admin action in the admin_activity_logs table.
// entityType: "user" | "brand" | "order" | "product" | "employee" | "partner" etc.
// entityID:   pointer to the affected record's ID (nil for global actions).
// action:     short verb string e.g. "banned_user", "approved_brand".
// meta:       JSON string with before/after snapshot or extra context (can be "").
func logActivity(c *gin.Context, entityType string, entityID *uint, action, meta string) {
	adminID, _ := c.Get("adminID")
	adminEmail, _ := c.Get("adminEmail")

	id, _ := adminID.(uint)
	email, _ := adminEmail.(string)

	entry := models.AdminActivityLog{
		AdminID:    id,
		AdminEmail: email,
		EntityType: entityType,
		EntityID:   entityID,
		Action:     action,
		Meta:       meta,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	}
	database.DB.Create(&entry)
}