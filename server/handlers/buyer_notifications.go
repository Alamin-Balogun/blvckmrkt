package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/buyer/notifications ─────────────────────────────────────────────
func ListNotifications(c *gin.Context) {
	userID := c.GetUint("userID")

	var notifs []models.Notification
	database.DB.Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(50).
		Find(&notifs)

	var unreadCount int64
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false AND deleted_at IS NULL", userID).
		Count(&unreadCount)

	// Convert to response items
	items := make([]models.NotificationItem, len(notifs))
	for i, n := range notifs {
		items[i] = n.ToItem()
	}

	utils.OK(c, "Notifications fetched", gin.H{
		"notifications": items,
		"unread":        unreadCount,
	})
}

// ── PATCH /api/buyer/notifications/:id/read ──────────────────────────────────
func MarkNotificationRead(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid notification ID", nil)
		return
	}

	res := database.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true)

	if res.RowsAffected == 0 {
		utils.NotFound(c, "Notification not found")
		return
	}
	utils.OK(c, "Notification marked as read", nil)
}

// ── PATCH /api/buyer/notifications/read-all ──────────────────────────────────
func MarkAllNotificationsRead(c *gin.Context) {
	userID := c.GetUint("userID")
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false AND deleted_at IS NULL", userID).
		Update("is_read", true)
	utils.OK(c, "All notifications marked as read", nil)
}

// ── DELETE /api/buyer/notifications/:id ──────────────────────────────────────
func BuyerDeleteNotification(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid notification ID", nil)
		return
	}

	res := database.DB.Where("id = ? AND user_id = ?", id, userID).
		Delete(&models.Notification{})
	
	if res.RowsAffected == 0 {
		utils.NotFound(c, "Notification not found")
		return
	}
	utils.OK(c, "Notification deleted", nil)
}