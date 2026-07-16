package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── ReviewComment model (inline — add to models package or keep here as local) ──
// If you have a models/review_comment.go, remove this and import from there.
type ReviewComment struct {
	ID        uint           `gorm:"primaryKey"             json:"id"`
	ReviewID  uint           `gorm:"not null;index"         json:"review_id"`
	AdminID   uint           `gorm:"not null"               json:"admin_id"`
	AdminName string         `gorm:"size:120;default:Admin" json:"admin_name"`
	Body      string         `gorm:"type:text;not null"     json:"body"`
	CreatedAt time.Time                                     `json:"created_at"`
	UpdatedAt time.Time                                     `json:"updated_at"`
	DeletedAt *time.Time     `gorm:"index"                  json:"deleted_at,omitempty"`
}

func (ReviewComment) TableName() string { return "review_comments" }

// ── GET /api/admin/reviews ────────────────────────────────────────────────────
func AdminListReviews(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search        := strings.TrimSpace(c.Query("search"))
	ratingStr     := c.Query("rating")
	flaggedOnly   := c.Query("flagged") == "true"

	type ReviewRow struct {
		ID            uint    `json:"id"`
		UserID        uint    `json:"user_id"`
		ProductID     uint    `json:"product_id"`
		ReviewerName  string  `json:"reviewer_name"`
		ReviewerEmail string  `json:"reviewer_email"`
		ProductName   string  `json:"product_name"`
		BrandName     string  `json:"brand_name"`
		Rating        int     `json:"rating"`
		Title         string  `json:"title"`
		Body          string  `json:"body"`
		Flagged       bool    `json:"flagged"`
		CommentCount  int64   `json:"comment_count"`
		CreatedAt     string  `json:"created_at"`
	}

	q := database.DB.Table("reviews r").
		Select(`r.id, r.user_id, r.product_id,
		        CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name,
		        u.email AS reviewer_email,
		        p.name AS product_name,
		        b.brand_name,
		        r.rating, r.title, r.body, r.flagged, r.created_at`).
		Joins("LEFT JOIN users u ON u.id = r.user_id").
		Joins("LEFT JOIN products p ON p.id = r.product_id").
		Joins("LEFT JOIN brands b ON b.id = p.brand_id").
		Where("r.deleted_at IS NULL")

	if search != "" {
		like := "%" + search + "%"
		q = q.Where("p.name LIKE ? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR u.email LIKE ? OR r.body LIKE ? OR r.title LIKE ?",
			like, like, like, like, like)
	}
	if ratingStr != "" {
		if rating, err := strconv.Atoi(ratingStr); err == nil {
			q = q.Where("r.rating = ?", rating)
		}
	}
	if flaggedOnly {
		q = q.Where("r.flagged = TRUE")
	}

	var total int64
	q.Count(&total)

	var rows []ReviewRow
	q.Order("r.created_at DESC").Limit(limit).Offset(offset).Scan(&rows)

	// Attach comment counts
	if len(rows) > 0 {
		reviewIDs := make([]uint, len(rows))
		for i, r := range rows {
			reviewIDs[i] = r.ID
		}
		type countRow struct {
			ReviewID uint  `gorm:"column:review_id"`
			Count    int64 `gorm:"column:cnt"`
		}
		var counts []countRow
		database.DB.Raw(`
			SELECT review_id, COUNT(*) AS cnt
			FROM review_comments
			WHERE review_id IN ? AND deleted_at IS NULL
			GROUP BY review_id
		`, reviewIDs).Scan(&counts)
		countMap := map[uint]int64{}
		for _, c := range counts {
			countMap[c.ReviewID] = c.Count
		}
		for i := range rows {
			rows[i].CommentCount = countMap[rows[i].ID]
		}
	}

	utils.OK(c, "Reviews fetched", gin.H{"reviews": rows, "total": total})
}

// ── GET /api/admin/reviews/:id ────────────────────────────────────────────────
func AdminGetReview(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}

	type ReviewDetail struct {
		ID            uint   `json:"id"`
		UserID        uint   `json:"user_id"`
		ProductID     uint   `json:"product_id"`
		OrderID       uint   `json:"order_id"`
		ReviewerName  string `json:"reviewer_name"`
		ReviewerEmail string `json:"reviewer_email"`
		ProductName   string `json:"product_name"`
		BrandName     string `json:"brand_name"`
		Rating        int    `json:"rating"`
		Title         string `json:"title"`
		Body          string `json:"body"`
		Flagged       bool   `json:"flagged"`
		CreatedAt     string `json:"created_at"`
	}

	var review ReviewDetail
	if err := database.DB.Table("reviews r").
		Select(`r.id, r.user_id, r.product_id, r.order_id,
		        CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name,
		        u.email AS reviewer_email,
		        p.name AS product_name,
		        b.brand_name,
		        r.rating, r.title, r.body, r.flagged, r.created_at`).
		Joins("LEFT JOIN users u ON u.id = r.user_id").
		Joins("LEFT JOIN products p ON p.id = r.product_id").
		Joins("LEFT JOIN brands b ON b.id = p.brand_id").
		Where("r.id = ? AND r.deleted_at IS NULL", id).
		Scan(&review).Error; err != nil || review.ID == 0 {
		utils.NotFound(c, "Review not found")
		return
	}

	// Fetch comments
	var comments []ReviewComment
	database.DB.Where("review_id = ? AND deleted_at IS NULL", id).
		Order("created_at ASC").
		Find(&comments)

	utils.OK(c, "Review fetched", gin.H{
		"review":   review,
		"comments": comments,
	})
}

// ── DELETE /api/admin/reviews/:id ─────────────────────────────────────────────
func AdminDeleteReview(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}
	// Also soft-delete comments
	now := time.Now()
	database.DB.Model(&ReviewComment{}).
		Where("review_id = ? AND deleted_at IS NULL", id).
		Update("deleted_at", now)
	database.DB.Delete(&models.Review{}, id)
	reviewID := uint(id)
	logActivity(c, "review", &reviewID, "delete", "Review deleted by admin")
	utils.OK(c, "Review deleted", nil)
}

// ── POST /api/admin/reviews/:id/flag ─────────────────────────────────────────
// Toggles the flagged boolean on the review (column added by migration).
func AdminFlagReview(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}

	// Read current flagged value via raw query (safe even if model struct lacks the field)
	var flagged bool
	if err := database.DB.Raw("SELECT flagged FROM reviews WHERE id = ? AND deleted_at IS NULL", id).
		Scan(&flagged).Error; err != nil {
		utils.NotFound(c, "Review not found")
		return
	}

	newFlagged := !flagged
	database.DB.Exec("UPDATE reviews SET flagged = ?, updated_at = NOW() WHERE id = ?", newFlagged, id)

	action := "flagged"
	if !newFlagged { action = "unflagged" }
	reviewID2 := uint(id)
	logActivity(c, "review", &reviewID2, action, "Review "+action+" by admin")

	utils.OK(c, "Review "+action, gin.H{"flagged": newFlagged})
}

// ── GET /api/admin/reviews/:id/comments ──────────────────────────────────────
func AdminListReviewComments(c *gin.Context) {
	reviewID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}

	var comments []ReviewComment
	database.DB.Where("review_id = ? AND deleted_at IS NULL", reviewID).
		Order("created_at ASC").
		Find(&comments)

	utils.OK(c, "Comments fetched", gin.H{"comments": comments})
}

// ── POST /api/admin/reviews/:id/comments ─────────────────────────────────────
func AdminAddReviewComment(c *gin.Context) {
	reviewID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}

	var req struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Body) == "" {
		utils.BadRequest(c, "Comment body is required", nil)
		return
	}

	// Get admin info from JWT context
	adminID := c.GetUint("userID")
	adminName := "Admin"
	var admin models.User
	if database.DB.First(&admin, adminID).Error == nil {
		adminName = strings.TrimSpace(admin.FirstName + " " + admin.LastName)
		if adminName == " " || adminName == "" {
			adminName = admin.Email
		}
	}

	comment := ReviewComment{
		ReviewID:  uint(reviewID),
		AdminID:   adminID,
		AdminName: adminName,
		Body:      strings.TrimSpace(req.Body),
	}
	if err := database.DB.Create(&comment).Error; err != nil {
		utils.InternalError(c, "Failed to save comment")
		return
	}

	utils.Created(c, "Comment added", comment)
}

// ── DELETE /api/admin/reviews/:id/comments/:commentId ────────────────────────
func AdminDeleteReviewComment(c *gin.Context) {
	commentID, err := strconv.ParseUint(c.Param("commentId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid comment ID", nil)
		return
	}

	result := database.DB.Delete(&ReviewComment{}, commentID)
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Comment not found")
		return
	}

	utils.OK(c, "Comment deleted", nil)
}