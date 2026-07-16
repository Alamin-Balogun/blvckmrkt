package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN NOTIFICATION MANAGEMENT (using simple notifications table)
// ─────────────────────────────────────────────────────────────────────────────

// ── GET /api/admin/notifications ─────────────────────────────────────────────
// Shows recent notifications sent (admin view)
func AdminListNotifications(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search := c.Query("search")

	type NotifRow struct {
		ID        uint      `json:"id"`
		UserID    uint      `json:"user_id"`
		UserName  string    `json:"user_name"`
		UserEmail string    `json:"user_email"`
		Type      string    `json:"type"`
		Title     string    `json:"title"`
		Body      string    `json:"body"`
		IsRead    bool      `json:"is_read"`
		RefType   string    `json:"ref_type"`
		CreatedAt time.Time `json:"created_at"`
	}

	q := database.DB.Table("notifications n").
		Select(`n.id, n.user_id,
		        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
		        u.email AS user_email,
		        n.type, n.title, n.body, n.is_read, n.ref_type, n.created_at`).
		Joins("LEFT JOIN users u ON u.id = n.user_id").
		Where("n.deleted_at IS NULL")

	if search != "" {
		like := "%" + search + "%"
		q = q.Where("n.title LIKE ? OR n.body LIKE ? OR u.email LIKE ?", like, like, like)
	}

	var total int64
	database.DB.Model(&models.Notification{}).Where("deleted_at IS NULL").Count(&total)

	var rows []NotifRow
	q.Order("n.created_at DESC").Limit(limit).Offset(offset).Scan(&rows)

	utils.OK(c, "Notifications fetched", gin.H{"notifications": rows, "total": total})
}

// ── POST /api/admin/notifications ────────────────────────────────────────────
// Send notification to one user or multiple users by target group
func AdminSendNotification(c *gin.Context) {
	var body struct {
		Title        string `json:"title"         binding:"required"`
		Body         string `json:"body"          binding:"required"`
		Type         string `json:"type"`         // news|drop|order|system
		Target       string `json:"target"`       // all|buyers|brands|user
		TargetUserID *uint  `json:"target_user_id"` // required when target="user"
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "title and body are required", nil)
		return
	}
	if body.Type == "" {
		body.Type = "news"
	}
	if body.Target == "" {
		body.Target = "all"
	}

	notifType := models.NotifNews
	switch body.Type {
	case "drop":
		notifType = models.NotifDrop
	case "order":
		notifType = models.NotifOrder
	case "system":
		notifType = models.NotifSystem
	}

	// ── PERSONAL: Send to ONE specific user ──────────────────────────────────
	if body.Target == "user" {
		if body.TargetUserID == nil {
			utils.BadRequest(c, "target_user_id is required when target is 'user'", nil)
			return
		}
		var u models.User
		if err := database.DB.First(&u, *body.TargetUserID).Error; err != nil {
			utils.NotFound(c, "User not found")
			return
		}

		if err := database.DB.Create(&models.Notification{
			UserID:  u.ID,
			Type:    notifType,
			Title:   body.Title,
			Body:    body.Body,
			RefType: "admin",
		}).Error; err != nil {
			utils.InternalError(c, "Failed to send notification")
			return
		}

		userName := strings.TrimSpace(u.FirstName + " " + u.LastName)
		if userName == "" {
			userName = u.Email
		}
		logActivity(c, "notification", &u.ID, "send", "Personal notification → "+userName)
		utils.Created(c, "Notification sent", gin.H{"recipients": 1})
		return
	}

	// ── GROUP: Send to ALL users matching target ─────────────────────────────
	var users []models.User
	q := database.DB.Where("deleted_at IS NULL AND account_type NOT IN ('admin','banned')")

	switch body.Target {
	case "buyers":
		q = q.Where("account_type = 'user'")
	case "brands":
		q = q.Where("account_type = 'brand'")
	// "all" → no extra filter
	}

	q.Find(&users)

	if len(users) == 0 {
		utils.BadRequest(c, "No users found for this target", nil)
		return
	}

	// Batch insert notifications
	notifications := make([]models.Notification, len(users))
	for i, u := range users {
		notifications[i] = models.Notification{
			UserID:  u.ID,
			Type:    notifType,
			Title:   body.Title,
			Body:    body.Body,
			RefType: "admin",
		}
	}

	if err := database.DB.CreateInBatches(notifications, 100).Error; err != nil {
		utils.InternalError(c, "Failed to send notifications")
		return
	}

	logActivity(c, "notification", nil, "send", "Broadcast → "+body.Target)
	utils.Created(c, "Notification sent", gin.H{"recipients": len(users)})
}

// ── DELETE /api/admin/notifications/:id ──────────────────────────────────────
func AdminDeleteNotification(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid ID", nil)
		return
	}
	database.DB.Delete(&models.Notification{}, id)
	utils.OK(c, "Notification deleted", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// USER-FACING HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

// GetUserNotifications — GET /api/buyer/notifications (or /api/brand/notifications)
func GetUserNotifications(c *gin.Context) {
	userID := c.GetUint("userID")

	var notifs []models.Notification
	database.DB.Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").Limit(50).Find(&notifs)

	var unreadCount int64
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false AND deleted_at IS NULL", userID).
		Count(&unreadCount)

	items := make([]models.NotificationItem, len(notifs))
	for i, n := range notifs {
		items[i] = n.ToItem()
	}

	utils.OK(c, "Notifications fetched", gin.H{
		"notifications": items,
		"unread":        unreadCount,
	})
}

// MarkPersonalRead — POST /api/notifications/:id/read
func MarkPersonalRead(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid ID", nil)
		return
	}
	userID := c.GetUint("userID")
	database.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).Update("is_read", true)
	utils.OK(c, "Marked as read", nil)
}

// MarkAllRead — POST /api/notifications/read-all
func MarkAllRead(c *gin.Context) {
	userID := c.GetUint("userID")
	database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND is_read = false", userID).Update("is_read", true)
	utils.OK(c, "All marked as read", nil)
}


// ─────────────────────────────────────────────────────────────────────────────
// ✅ REMOVED DUPLICATE FUNCTIONS:
// AdminListSubscriptions and AdminUpdateSubscription are now only in admin_subscriptions.go
// ─────────────────────────────────────────────────────────────────────────────

// ── ADDRESSES ─────────────────────────────────────────────────────────────────

func AdminListAddresses(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search        := c.Query("search")

	type AddrRow struct {
		ID        uint   `json:"id"`
		UserID    uint   `json:"user_id"`
		UserName  string `json:"user_name"`
		UserEmail string `json:"user_email"`
		Label     string `json:"label"`
		Line1     string `json:"line1"`
		Line2     string `json:"line2"`
		City      string `json:"city"`
		State     string `json:"state"`
		Postcode  string `json:"postcode"`
		Country   string `json:"country"`
		IsDefault bool   `json:"is_default"`
		CreatedAt string `json:"created_at"`
	}

	q := database.DB.Table("addresses a").
		Select(`a.id, a.user_id,
		        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
		        u.email AS user_email,
		        a.label, a.line1, a.line2, a.city, a.state,
		        a.postcode, a.country, a.is_default, a.created_at`).
		Joins("LEFT JOIN users u ON u.id = a.user_id").
		Where("a.deleted_at IS NULL")

	if search != "" {
		like := "%" + search + "%"
		q = q.Where("u.first_name LIKE ? OR u.email LIKE ? OR a.city LIKE ? OR a.country LIKE ?",
			like, like, like, like)
	}

	var total int64
	database.DB.Table("addresses").Where("deleted_at IS NULL").Count(&total)
	var rows []AddrRow
	q.Order("a.created_at DESC").Limit(limit).Offset(offset).Scan(&rows)
	utils.OK(c, "Addresses fetched", gin.H{"addresses": rows, "total": total})
}

func AdminUpdateAddress(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid address ID", nil)
		return
	}
	var body map[string]interface{}
	c.ShouldBindJSON(&body)
	allowed := map[string]bool{
		"label": true, "line1": true, "line2": true, "city": true,
		"state": true, "postcode": true, "country": true, "is_default": true,
	}
	updates := map[string]interface{}{}
	for k, v := range body { if allowed[k] { updates[k] = v } }
	database.DB.Model(&models.Address{}).Where("id = ?", id).Updates(updates)
	utils.OK(c, "Address updated", nil)
}

func AdminDeleteAddress(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid address ID", nil)
		return
	}
	database.DB.Delete(&models.Address{}, id)
	utils.OK(c, "Address deleted", nil)
}

// ── POST /api/admin/addresses ─────────────────────────────────────────────────
// Create an address on behalf of any user (by user_id).
func AdminCreateAddress(c *gin.Context) {
	var req struct {
		UserID    uint   `json:"user_id"  binding:"required"`
		Label     string `json:"label"    binding:"required"`
		Line1     string `json:"line1"    binding:"required"`
		Line2     string `json:"line2"`
		City      string `json:"city"     binding:"required"`
		State     string `json:"state"`
		Postcode  string `json:"postcode"`
		Country   string `json:"country"  binding:"required"`
		IsDefault bool   `json:"is_default"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "user_id, label, line1, city and country are required", nil)
		return
	}

	// Verify user exists
	var user models.User
	if database.DB.First(&user, req.UserID).Error != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// If marking as default, clear existing default for this user
	if req.IsDefault {
		database.DB.Model(&models.Address{}).
			Where("user_id = ?", req.UserID).
			Update("is_default", false)
	}

	// First address for this user is always default
	var count int64
	database.DB.Model(&models.Address{}).Where("user_id = ?", req.UserID).Count(&count)
	if count == 0 {
		req.IsDefault = true
	}

	addr := models.Address{
		UserID:    req.UserID,
		Label:     req.Label,
		Line1:     req.Line1,
		Line2:     req.Line2,
		City:      req.City,
		State:     req.State,
		Postcode:  req.Postcode,
		Country:   req.Country,
		IsDefault: req.IsDefault,
	}
	if err := database.DB.Create(&addr).Error; err != nil {
		utils.InternalError(c, "Failed to create address")
		return
	}

	utils.Created(c, "Address created", addr.ToResponse())
}

// suppress unused import warning
var _ = gorm.ErrRecordNotFound