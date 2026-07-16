package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── POST /api/user/reviews ────────────────────────────────────────────────────
// Available to ALL logged-in users (buyer OR brand)
func CreateReview(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		ProductID uint   `json:"product_id" binding:"required"`
		OrderID   *uint  `json:"order_id"`
		Rating    int    `json:"rating"     binding:"required,min=1,max=5"`
		Title     string `json:"title"`
		Body      string `json:"body"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "product_id and rating (1-5) are required", nil)
		return
	}

	// Verify product exists
	var product models.Product
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", req.ProductID).First(&product).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	// Can't review twice
	var existing models.Review
	if res := database.DB.Where("user_id = ? AND product_id = ?", userID, req.ProductID).First(&existing); res.Error == nil {
		utils.Conflict(c, "You have already reviewed this product")
		return
	}

	review := models.Review{
		UserID:    userID,
		ProductID: req.ProductID,
		OrderID:   req.OrderID,
		Rating:    req.Rating,
		Title:     req.Title,
		Body:      req.Body,
	}
	if err := database.DB.Create(&review).Error; err != nil {
		utils.InternalError(c, "Failed to create review")
		return
	}

	utils.Created(c, "Review submitted", review)
}

// ── PUT /api/user/reviews/:id ─────────────────────────────────────────────────
func UpdateReview(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}

	var review models.Review
	if err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&review).Error; err != nil {
		utils.NotFound(c, "Review not found")
		return
	}

	var req struct {
		Rating int    `json:"rating" binding:"omitempty,min=1,max=5"`
		Title  string `json:"title"`
		Body   string `json:"body"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.Rating >= 1 && req.Rating <= 5 {
		updates["rating"] = req.Rating
	}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Body != "" {
		updates["body"] = req.Body
	}

	if len(updates) > 0 {
		database.DB.Model(&review).Updates(updates)
	}

	database.DB.First(&review, review.ID)
	utils.OK(c, "Review updated", review)
}

// ── DELETE /api/user/reviews/:id ──────────────────────────────────────────────
func DeleteReview(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid review ID", nil)
		return
	}

	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Review{})
	if result.RowsAffected == 0 {
		utils.NotFound(c, "Review not found")
		return
	}

	utils.OK(c, "Review deleted", nil)
}

// ── GET /api/user/reviews ─────────────────────────────────────────────────────
// Get all reviews by the logged-in user (buyer or brand)
func ListMyReviews(c *gin.Context) {
	userID := c.GetUint("userID")

	var reviews []models.Review
	database.DB.
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&reviews)

	// Fetch product names
	productIDs := make([]uint, len(reviews))
	for i, r := range reviews {
		productIDs[i] = r.ProductID
	}

	var products []models.Product
	if len(productIDs) > 0 {
		database.DB.Where("id IN ?", productIDs).Select("id, name, slug").Find(&products)
	}

	productMap := map[uint]models.Product{}
	for _, p := range products {
		productMap[p.ID] = p
	}

	result := make([]gin.H, len(reviews))
	for i, r := range reviews {
		productName := ""
		productSlug := ""
		if p, ok := productMap[r.ProductID]; ok {
			productName = p.Name
			productSlug = p.Slug
		}

		result[i] = gin.H{
			"id":           r.ID,
			"product_id":   r.ProductID,
			"product_name": productName,
			"product_slug": productSlug,
			"rating":       r.Rating,
			"title":        r.Title,
			"body":         r.Body,
			"created_at":   r.CreatedAt,
			"updated_at":   r.UpdatedAt,
		}
	}

	utils.OK(c, "Reviews fetched", gin.H{
		"reviews": result,
		"total":   len(result),
	})
}