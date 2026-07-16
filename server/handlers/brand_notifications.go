package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/brand/notifications ─────────────────────────────────────────────
func BrandListNotifications(c *gin.Context) {
	GetUserNotifications(c) // Reuse the same handler
}

// ── POST /api/brand/notifications/:id/read ───────────────────────────────────
func BrandMarkNotificationRead(c *gin.Context) {
	MarkPersonalRead(c) // Reuse the same handler
}

// ── POST /api/brand/notifications/read-all ───────────────────────────────────
func BrandMarkAllNotificationsRead(c *gin.Context) {
	MarkAllRead(c) // Reuse the same handler
}

// ── DELETE /api/brand/notifications/:id ──────────────────────────────────────
func BrandDeleteNotification(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid notification ID", nil)
		return
	}
	res := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{})
	if res.RowsAffected == 0 {
		utils.NotFound(c, "Notification not found")
		return
	}
	utils.OK(c, "Notification deleted", nil)
}