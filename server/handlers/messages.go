// handlers/messages.go
//
// Buyer <-> brand messaging. A "conversation" is every Message row sharing
// the same (buyer_id, brand_id) pair — no separate Conversation table, since
// this is always a two-party thread.
package handlers

import (
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

type conversationSummary struct {
	BrandID     uint   `json:"brand_id,omitempty"`
	BuyerID     uint   `json:"buyer_id,omitempty"`
	Name        string `json:"name"`
	AvatarURL   string `json:"avatar_url,omitempty"`
	LastMessage string `json:"last_message"`
	LastSender  string `json:"last_sender"`
	LastAt      string `json:"last_at"`
	UnreadCount int64  `json:"unread_count"`
}

// ── GET /api/buyer/messages ───────────────────────────────────────────────────
// One row per brand the buyer has an active conversation with.
func BuyerListConversations(c *gin.Context) {
	buyerID := c.GetUint("userID")

	var brandIDs []uint
	database.DB.Model(&models.Message{}).
		Where("buyer_id = ?", buyerID).
		Distinct("brand_id").
		Pluck("brand_id", &brandIDs)

	if len(brandIDs) == 0 {
		utils.OK(c, "Conversations fetched", []conversationSummary{})
		return
	}

	var brands []models.Brand
	database.DB.Where("id IN ?", brandIDs).Find(&brands)
	brandMap := map[uint]models.Brand{}
	for _, b := range brands {
		brandMap[b.ID] = b
	}

	result := make([]conversationSummary, 0, len(brandIDs))
	for _, brandID := range brandIDs {
		var last models.Message
		database.DB.Where("buyer_id = ? AND brand_id = ?", buyerID, brandID).
			Order("created_at DESC").First(&last)

		var unread int64
		database.DB.Model(&models.Message{}).
			Where("buyer_id = ? AND brand_id = ? AND sender_type = 'brand' AND is_read = false", buyerID, brandID).
			Count(&unread)

		b := brandMap[brandID]
		result = append(result, conversationSummary{
			BrandID:     brandID,
			Name:        b.BrandName,
			AvatarURL:   b.LogoURL,
			LastMessage: last.Body,
			LastSender:  last.SenderType,
			LastAt:      last.CreatedAt.Format("Jan 2, 2006 15:04"),
			UnreadCount: unread,
		})
	}

	utils.OK(c, "Conversations fetched", result)
}

// ── GET /api/buyer/messages/:brandId ──────────────────────────────────────────
func BuyerGetThread(c *gin.Context) {
	buyerID := c.GetUint("userID")
	brandID, err := strconv.ParseUint(c.Param("brandId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, brandID).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var messages []models.Message
	database.DB.Where("buyer_id = ? AND brand_id = ?", buyerID, brandID).
		Order("created_at ASC").Find(&messages)

	// Mark the brand's messages as read now that the buyer's viewing the thread.
	database.DB.Model(&models.Message{}).
		Where("buyer_id = ? AND brand_id = ? AND sender_type = 'brand' AND is_read = false", buyerID, brandID).
		Update("is_read", true)

	utils.OK(c, "Thread fetched", gin.H{
		"brand_name": brand.BrandName,
		"logo_url":   brand.LogoURL,
		"messages":   messages,
	})
}

// ── POST /api/buyer/messages/:brandId ─────────────────────────────────────────
func BuyerSendMessage(c *gin.Context) {
	buyerID := c.GetUint("userID")
	brandID, err := strconv.ParseUint(c.Param("brandId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var req struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Body) == "" {
		utils.BadRequest(c, "Message body is required", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, brandID).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	msg := models.Message{
		BuyerID:    buyerID,
		BrandID:    uint(brandID),
		SenderType: "buyer",
		Body:       strings.TrimSpace(req.Body),
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		utils.InternalError(c, "Failed to send message")
		return
	}

	utils.Created(c, "Message sent", msg)
}

// ── GET /api/brand/messages ───────────────────────────────────────────────────
// One row per buyer the brand has an active conversation with.
func BrandListConversations(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var buyerIDs []uint
	database.DB.Model(&models.Message{}).
		Where("brand_id = ?", brand.ID).
		Distinct("buyer_id").
		Pluck("buyer_id", &buyerIDs)

	if len(buyerIDs) == 0 {
		utils.OK(c, "Conversations fetched", []conversationSummary{})
		return
	}

	var buyers []models.User
	database.DB.Select("id, first_name, last_name, avatar_url").Where("id IN ?", buyerIDs).Find(&buyers)
	buyerMap := map[uint]models.User{}
	for _, u := range buyers {
		buyerMap[u.ID] = u
	}

	result := make([]conversationSummary, 0, len(buyerIDs))
	for _, buyerID := range buyerIDs {
		var last models.Message
		database.DB.Where("buyer_id = ? AND brand_id = ?", buyerID, brand.ID).
			Order("created_at DESC").First(&last)

		var unread int64
		database.DB.Model(&models.Message{}).
			Where("buyer_id = ? AND brand_id = ? AND sender_type = 'buyer' AND is_read = false", buyerID, brand.ID).
			Count(&unread)

		u := buyerMap[buyerID]
		name := strings.TrimSpace(u.FirstName + " " + u.LastName)
		if name == "" {
			name = "Buyer"
		}
		result = append(result, conversationSummary{
			BuyerID:     buyerID,
			Name:        name,
			AvatarURL:   u.AvatarURL,
			LastMessage: last.Body,
			LastSender:  last.SenderType,
			LastAt:      last.CreatedAt.Format("Jan 2, 2006 15:04"),
			UnreadCount: unread,
		})
	}

	utils.OK(c, "Conversations fetched", result)
}

// ── GET /api/brand/messages/:buyerId ──────────────────────────────────────────
func BrandGetThread(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	buyerID, err := strconv.ParseUint(c.Param("buyerId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid buyer ID", nil)
		return
	}

	var buyer models.User
	if database.DB.Select("id, first_name, last_name, avatar_url").First(&buyer, buyerID).Error != nil {
		utils.NotFound(c, "Buyer not found")
		return
	}

	var messages []models.Message
	database.DB.Where("buyer_id = ? AND brand_id = ?", buyerID, brand.ID).
		Order("created_at ASC").Find(&messages)

	database.DB.Model(&models.Message{}).
		Where("buyer_id = ? AND brand_id = ? AND sender_type = 'buyer' AND is_read = false", buyerID, brand.ID).
		Update("is_read", true)

	name := strings.TrimSpace(buyer.FirstName + " " + buyer.LastName)
	if name == "" {
		name = "Buyer"
	}
	utils.OK(c, "Thread fetched", gin.H{
		"buyer_name": name,
		"avatar_url": buyer.AvatarURL,
		"messages":   messages,
	})
}

// ── POST /api/brand/messages/:buyerId ─────────────────────────────────────────
func BrandSendMessage(c *gin.Context) {
	userID := c.GetUint("userID")
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	buyerID, err := strconv.ParseUint(c.Param("buyerId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid buyer ID", nil)
		return
	}

	var req struct {
		Body string `json:"body" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Body) == "" {
		utils.BadRequest(c, "Message body is required", nil)
		return
	}

	var buyer models.User
	if database.DB.First(&buyer, buyerID).Error != nil {
		utils.NotFound(c, "Buyer not found")
		return
	}

	msg := models.Message{
		BuyerID:    uint(buyerID),
		BrandID:    brand.ID,
		SenderType: "brand",
		Body:       strings.TrimSpace(req.Body),
	}
	if err := database.DB.Create(&msg).Error; err != nil {
		utils.InternalError(c, "Failed to send message")
		return
	}

	utils.Created(c, "Message sent", msg)
}
