package handlers

import (
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// AdminSubscriptionRow is the enriched row returned to the admin table.
// It joins brand store_name and user email on top of the subscription record.
type AdminSubscriptionRow struct {
	models.Subscription
	BrandName string `json:"brand_name"`
	Email     string `json:"email"`
}

// ── GET /api/admin/subscriptions ─────────────────────────────────────────────
// Supports: ?limit, ?offset, ?search (brand name or email), ?status
func AdminListSubscriptions(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "30"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	search   := strings.TrimSpace(c.Query("search"))
	status   := strings.TrimSpace(c.Query("status"))

	// Base query joining brands and users so we can return brand_name + email
	// without N+1 lookups.
	q := database.DB.Table("subscriptions s").
		Select(`
			s.*,
			COALESCE(b.brand_name, '') AS brand_name,
			COALESCE(u.email, '')      AS email
		`).
		Joins("LEFT JOIN brands b ON b.id = s.brand_id AND b.deleted_at IS NULL").
		Joins("LEFT JOIN users  u ON u.id = s.user_id  AND u.deleted_at IS NULL").
		Where("s.deleted_at IS NULL").
		Order("s.created_at DESC")

	if status != "" {
		q = q.Where("s.status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("b.brand_name LIKE ? OR u.email LIKE ? OR s.reference LIKE ?", like, like, like)
	}

	// Count total for pagination header
	var total int64
	q.Count(&total)

	// Fetch the page
	var rows []AdminSubscriptionRow
	q.Limit(limit).Offset(offset).Scan(&rows)

	utils.OK(c, "Subscriptions fetched", gin.H{
		"subscriptions": rows,
		"total":         total,
		"limit":         limit,
		"offset":        offset,
	})
}

// ── PATCH /api/admin/subscriptions/:id ───────────────────────────────────────
// Allows admin to change a subscription's status (e.g. cancel, reactivate,
// mark expired) and optionally update the brand's subscription_status to match.
func AdminUpdateSubscription(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	var sub models.Subscription
	if err := database.DB.First(&sub, id).Error; err != nil {
		utils.NotFound(c, "Subscription not found")
		return
	}

	var req struct {
		// ✅ UPDATED — admin can flip transfer payments from none → active
        Status string `json:"status" binding:"required,oneof=none active trial expired cancelled"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "status must be one of: active, trial, expired, cancelled", nil)
		return
	}

	newStatus := models.SubscriptionStatus(req.Status)

	// Update subscription status
	if err := database.DB.Model(&sub).Update("status", newStatus).Error; err != nil {
		utils.InternalError(c, "Failed to update subscription")
		return
	}

	// Sync the brand's subscription_status to match, so the brand dashboard
	// stays consistent without requiring a separate job.
	database.DB.Table("brands").
		Where("id = ?", sub.BrandID).
		Update("subscription_status", string(newStatus))

	utils.OK(c, "Subscription updated", gin.H{
		"id":     sub.ID,
		"status": newStatus,
	})
}