package handlers

import (
	"fmt"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── PUBLIC — POST /api/newsletter/subscribe ───────────────────────────────────
func NewsletterSubscribe(c *gin.Context) {
	var req struct {
		Email  string `json:"email"  binding:"required,email"`
		Name   string `json:"name"`
		Source string `json:"source"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "A valid email is required", nil)
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// ✅ NEW: Try to get name from authenticated user
	subscriberName := strings.TrimSpace(req.Name)
	
	// Check if user is authenticated (optional)
	if userID, exists := c.Get("userID"); exists && subscriberName == "" {
		var user models.User
		if err := database.DB.First(&user, userID).Error; err == nil {
			subscriberName = strings.TrimSpace(user.FirstName + " " + user.LastName)
		}
	}

	// ✅ Fallback: Extract name from email if still empty
	if subscriberName == "" {
		subscriberName = extractNameFromEmail(req.Email)
	}

	// Idempotent — if already subscribed, update name if it was empty
	var existing models.NewsletterSubscriber
	if database.DB.Where("email = ?", req.Email).First(&existing).Error == nil {
		updates := map[string]interface{}{}
		
		// Reactivate if unsubscribed
		if existing.Status == "unsubscribed" {
			updates["status"] = "active"
		}
		
		// Update name if it was empty before
		if existing.Name == "" && subscriberName != "" {
			updates["name"] = subscriberName
		}
		
		if len(updates) > 0 {
			database.DB.Model(&existing).Updates(updates)
		}
		
		utils.OK(c, "You're already subscribed!", gin.H{"subscribed": true})
		return
	}

	source := req.Source
	if source == "" {
		source = "website"
	}

	sub := models.NewsletterSubscriber{
		Email:  req.Email,
		Name:   subscriberName,
		Source: source,
		Status: "active",
	}
	if err := database.DB.Create(&sub).Error; err != nil {
		utils.InternalError(c, "Failed to subscribe")
		return
	}
	utils.Created(c, "Subscribed successfully!", gin.H{"subscribed": true})
}

// ✅ Helper: Extract name from email
// john.doe@example.com → "John Doe"
// alice_smith@example.com → "Alice Smith"
// bob123@example.com → "Bob"
func extractNameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 0 {
		return ""
	}
	
	username := parts[0]
	
	// Remove numbers and common separators
	username = strings.ReplaceAll(username, ".", " ")
	username = strings.ReplaceAll(username, "_", " ")
	username = strings.ReplaceAll(username, "-", " ")
	username = strings.ReplaceAll(username, "+", " ")
	
	// Split into words and capitalize each
	words := strings.Fields(username)
	for i, word := range words {
		// Remove trailing numbers
		word = strings.TrimRight(word, "0123456789")
		if word != "" {
			words[i] = strings.ToUpper(word[:1]) + strings.ToLower(word[1:])
		}
	}
	
	return strings.Join(words, " ")
}

// ── PUBLIC — POST /api/newsletter/unsubscribe ─────────────────────────────────
func NewsletterUnsubscribe(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Email is required", nil)
		return
	}
	database.DB.Model(&models.NewsletterSubscriber{}).
		Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).
		Update("status", "unsubscribed")
	utils.OK(c, "Unsubscribed successfully", gin.H{"unsubscribed": true})
}

// ── ADMIN — GET /api/admin/newsletter ────────────────────────────────────────
// Supports ?search=, ?status=active|unsubscribed, ?source=
func AdminListNewsletterSubscribers(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search := strings.TrimSpace(c.Query("search"))
	status := c.Query("status")
	source := c.Query("source")

	q := database.DB.Model(&models.NewsletterSubscriber{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("email LIKE ? OR name LIKE ?", like, like)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if source != "" {
		q = q.Where("source = ?", source)
	}

	var total int64
	q.Count(&total)

	var subs []models.NewsletterSubscriber
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&subs)

	// Stats
	var activeCount, unsubCount int64
	database.DB.Model(&models.NewsletterSubscriber{}).Where("status = 'active'").Count(&activeCount)
	database.DB.Model(&models.NewsletterSubscriber{}).Where("status = 'unsubscribed'").Count(&unsubCount)

	utils.OK(c, "Newsletter subscribers fetched", gin.H{
		"subscribers":  subs,
		"total":        total,
		"active_count": activeCount,
		"unsub_count":  unsubCount,
	})
}

// ── ADMIN — DELETE /api/admin/newsletter/:id ──────────────────────────────────
func AdminDeleteNewsletterSubscriber(c *gin.Context) {
	id := c.Param("id")
	var sub models.NewsletterSubscriber
	if database.DB.First(&sub, id).Error != nil {
		utils.NotFound(c, "Subscriber not found")
		return
	}
	database.DB.Delete(&sub)
	logActivity(c, "newsletter", nil, "deleted_newsletter_subscriber",
		fmt.Sprintf(`{"email":"%s"}`, sub.Email))
	utils.OK(c, "Subscriber deleted", nil)
}

// ── ADMIN — PATCH /api/admin/newsletter/:id ───────────────────────────────────
// Toggle status: active ↔ unsubscribed
func AdminUpdateNewsletterSubscriber(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		Status string `json:"status"`
	}
	c.ShouldBindJSON(&body)
	if body.Status == "" {
		utils.BadRequest(c, "Provide status: active or unsubscribed", nil)
		return
	}
	database.DB.Model(&models.NewsletterSubscriber{}).Where("id = ?", id).Update("status", body.Status)
	utils.OK(c, "Subscriber updated", nil)
}