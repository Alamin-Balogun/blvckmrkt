package handlers

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
)

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PLAN DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/plans
func AdminListPlans(c *gin.Context) {
	var plans []models.PlanDefinition
	database.DB.Where("deleted_at IS NULL").Order("sort_order ASC, id ASC").Find(&plans)
	utils.OK(c, "Plans fetched", gin.H{"plans": plans})
}

// GET /api/admin/plans/:id
func AdminGetPlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid plan ID", nil)
		return
	}
	var plan models.PlanDefinition
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&plan).Error; err != nil {
		c.JSON(404, gin.H{"message": "Plan not found"})
		return
	}
	utils.OK(c, "Plan fetched", gin.H{"plan": plan})
}

// POST /api/admin/plans
func AdminCreatePlan(c *gin.Context) {
	var body struct {
		Slug         string   `json:"slug"          binding:"required"`
		Name         string   `json:"name"          binding:"required"`
		Description  string   `json:"description"`
		MonthlyPrice float64  `json:"monthly_price"`
		AnnualPrice  float64  `json:"annual_price"`
		Features     []string `json:"features"`
		IsActive     *bool    `json:"is_active"`
		SortOrder    int      `json:"sort_order"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid body: "+err.Error(), nil)
		return
	}

	featuresJSON, _ := json.Marshal(body.Features)
	isActive := true
	if body.IsActive != nil {
		isActive = *body.IsActive
	}

	plan := models.PlanDefinition{
		Slug:         body.Slug,
		Name:         body.Name,
		Description:  body.Description,
		MonthlyPrice: body.MonthlyPrice,
		AnnualPrice:  body.AnnualPrice,
		FeaturesJSON: string(featuresJSON),
		IsActive:     isActive,
		SortOrder:    body.SortOrder,
	}

	if err := database.DB.Create(&plan).Error; err != nil {
		utils.InternalError(c, "Failed to create plan: "+err.Error())
		return
	}

	logActivity(c, "system", nil, "create_plan",
		fmt.Sprintf(`{"plan_id":%d,"slug":"%s"}`, plan.ID, plan.Slug))
	utils.OK(c, "Plan created", gin.H{"plan": plan})
}

// PATCH /api/admin/plans/:id
func AdminUpdatePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid plan ID", nil)
		return
	}

	var plan models.PlanDefinition
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&plan).Error; err != nil {
		c.JSON(404, gin.H{"message": "Plan not found"})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid body", nil)
		return
	}

	if v, ok := body["name"].(string); ok {
		plan.Name = v
	}
	if v, ok := body["description"].(string); ok {
		plan.Description = v
	}
	if v, ok := body["monthly_price"].(float64); ok {
		plan.MonthlyPrice = v
	}
	if v, ok := body["annual_price"].(float64); ok {
		plan.AnnualPrice = v
	}
	if v, ok := body["features"].([]interface{}); ok {
		b, _ := json.Marshal(v)
		plan.FeaturesJSON = string(b)
	}
	if v, ok := body["is_active"].(bool); ok {
		plan.IsActive = v
	}
	if v, ok := body["sort_order"].(float64); ok {
		plan.SortOrder = int(v)
	}

	database.DB.Save(&plan)
	logActivity(c, "system", nil, "update_plan",
		fmt.Sprintf(`{"plan_id":%d}`, plan.ID))
	utils.OK(c, "Plan updated", gin.H{"plan": plan})
}

// DELETE /api/admin/plans/:id  (soft-delete)
func AdminDeletePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid plan ID", nil)
		return
	}

	now := time.Now()
	if err := database.DB.Model(&models.PlanDefinition{}).
		Where("id = ?", id).
		Update("deleted_at", now).Error; err != nil {
		utils.InternalError(c, "Failed to delete plan")
		return
	}

	logActivity(c, "system", nil, "delete_plan",
		fmt.Sprintf(`{"plan_id":%d}`, id))
	utils.OK(c, "Plan deleted", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// NEWSLETTERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/newsletters?limit=20&offset=0&status=draft
func AdminListNewsletters(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.Query("status")

	q := database.DB.Model(&models.Newsletter{}).Where("deleted_at IS NULL")
	if status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	var newsletters []models.Newsletter
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&newsletters)

	utils.OK(c, "Newsletters fetched", gin.H{
		"newsletters": newsletters,
		"total":       total,
	})
}

// GET /api/admin/newsletters/:id
func AdminGetNewsletter(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid ID", nil)
		return
	}
	var nl models.Newsletter
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&nl).Error; err != nil {
		c.JSON(404, gin.H{"message": "Newsletter not found"})
		return
	}
	utils.OK(c, "Newsletter fetched", gin.H{"newsletter": nl})
}

// POST /api/admin/newsletters
func AdminCreateNewsletter(c *gin.Context) {
	var body struct {
		Subject     string `json:"subject"   binding:"required"`
		PreviewText string `json:"preview_text"`
		BodyHTML    string `json:"body_html" binding:"required"`
		BodyText    string `json:"body_text"`
		Audience    string `json:"audience"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid body: "+err.Error(), nil)
		return
	}

	audience := body.Audience
	if audience == "" {
		audience = "active"
	}

	nl := models.Newsletter{
		Subject:     body.Subject,
		PreviewText: body.PreviewText,
		BodyHTML:    body.BodyHTML,
		BodyText:    body.BodyText,
		Status:      "draft",
		Audience:    audience,
	}

	if err := database.DB.Create(&nl).Error; err != nil {
		utils.InternalError(c, "Failed to create newsletter")
		return
	}

	logActivity(c, "system", nil, "create_newsletter",
		fmt.Sprintf(`{"newsletter_id":%d}`, nl.ID))
	utils.OK(c, "Newsletter created", gin.H{"newsletter": nl})
}

// PATCH /api/admin/newsletters/:id
func AdminUpdateNewsletter(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid ID", nil)
		return
	}

	var nl models.Newsletter
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&nl).Error; err != nil {
		c.JSON(404, gin.H{"message": "Newsletter not found"})
		return
	}
	if nl.Status == "sent" {
		utils.BadRequest(c, "Cannot edit a sent newsletter", nil)
		return
	}

	var body map[string]interface{}
	c.ShouldBindJSON(&body)

	if v, ok := body["subject"].(string); ok {
		nl.Subject = v
	}
	if v, ok := body["preview_text"].(string); ok {
		nl.PreviewText = v
	}
	if v, ok := body["body_html"].(string); ok {
		nl.BodyHTML = v
	}
	if v, ok := body["body_text"].(string); ok {
		nl.BodyText = v
	}
	if v, ok := body["audience"].(string); ok {
		nl.Audience = v
	}

	database.DB.Save(&nl)
	utils.OK(c, "Newsletter updated", gin.H{"newsletter": nl})
}

// ── POST /api/admin/newsletters/:id/send
func AdminSendNewsletter(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid ID", nil)
		return
	}

	var nl models.Newsletter
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&nl).Error; err != nil {
		c.JSON(404, gin.H{"message": "Newsletter not found"})
		return
	}
	if nl.Status == "sent" || nl.Status == "sending" {
		utils.BadRequest(c, "Newsletter already sent or currently sending", nil)
		return
	}

	// Fetch recipients based on audience setting
	var subs []models.NewsletterSubscriber // ✅ Changed from []NewsletterSubscriber
	q := database.DB.Where("deleted_at IS NULL")
	switch nl.Audience {
	case "active":
		q = q.Where("status = 'active'")
	case "unsubscribed":
		q = q.Where("status = 'unsubscribed'")
	// "all" — no extra filter
	}
	q.Find(&subs)

	if len(subs) == 0 {
		utils.BadRequest(c, "No recipients found for this audience", nil)
		return
	}

	// Mark as sending
	now := time.Now()
	database.DB.Model(&nl).Updates(map[string]interface{}{
		"status":     "sending",
		"updated_at": now,
	})

	sentCount := 0
	for _, sub := range subs {
		send := models.NewsletterSend{
			NewsletterID: uint64(nl.ID),
			SubscriberID: uint64(sub.ID), // ✅ This should now work
			Status:       "pending",
		}

		// ── Wire your email provider here ────────────────────────────────────
		// err := mailer.Send(sub.Email, nl.Subject, nl.PreviewText, nl.BodyHTML, nl.BodyText)
		// if err != nil {
		//     send.Status = "failed"
		//     send.Error  = err.Error()
		// } else {
		//     send.Status = "sent"
		//     send.SentAt = &now
		//     sentCount++
		// }
		// ─────────────────────────────────────────────────────────────────────

		// Placeholder: mark sent immediately (remove once mailer is wired)
		send.Status = "sent"
		send.SentAt = &now
		sentCount++

		database.DB.Clauses(clause.OnConflict{DoNothing: true}).Create(&send)
	}

	// Mark newsletter as fully sent
	database.DB.Model(&nl).Updates(map[string]interface{}{
		"status":     "sent",
		"sent_at":    now,
		"sent_count": sentCount,
		"updated_at": now,
	})

	logActivity(c, "system", nil, "send_newsletter",
		fmt.Sprintf(`{"newsletter_id":%d,"sent_count":%d}`, nl.ID, sentCount))

	utils.OK(c, fmt.Sprintf("Newsletter sent to %d recipients", sentCount), gin.H{
		"sent_count": sentCount,
	})
}

// DELETE /api/admin/newsletters/:id  (soft-delete, drafts only)
func AdminDeleteNewsletter(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid ID", nil)
		return
	}

	var nl models.Newsletter
	if err := database.DB.Where("id = ? AND deleted_at IS NULL", id).First(&nl).Error; err != nil {
		c.JSON(404, gin.H{"message": "Newsletter not found"})
		return
	}
	if nl.Status == "sent" {
		utils.BadRequest(c, "Cannot delete a sent newsletter", nil)
		return
	}

	now := time.Now()
	database.DB.Model(&nl).Update("deleted_at", now)
	logActivity(c, "system", nil, "delete_newsletter",
		fmt.Sprintf(`{"newsletter_id":%d}`, id))
	utils.OK(c, "Newsletter deleted", nil)
}