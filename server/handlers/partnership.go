package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

type SignPartnershipRequest struct {
	BrandName string `json:"brand_name" binding:"required"`
}

// POST /api/brand/partnership/sign
// Protected — brand only.
// Validates the brand name matches, marks agreement as signed,
// and sends the welcome email.
func SignPartnershipAgreement(c *gin.Context) {
	userID := c.GetUint("userID")

	var req SignPartnershipRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Brand name is required", nil)
		return
	}

	// Load brand
	var brand models.Brand
	if err := database.DB.Where("user_id = ?", userID).First(&brand).Error; err != nil {
		utils.NotFound(c, "Brand profile not found")
		return
	}

	// Load user
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// ── Validate brand name matches exactly (case-insensitive) ───────────────
	if !strings.EqualFold(strings.TrimSpace(req.BrandName), strings.TrimSpace(brand.BrandName)) {
		utils.BadRequest(c, fmt.Sprintf(
			"Brand name does not match. Please type your exact registered brand name: \"%s\"",
			brand.BrandName,
		), map[string]string{
			"brand_name": fmt.Sprintf("Expected \"%s\"", brand.BrandName),
		})
		return
	}

	// ── Mark agreement as signed ─────────────────────────────────────────────
	now := time.Now()
	if err := database.DB.Model(&brand).Updates(map[string]interface{}{
		"partnership_signed":    true,
		"partnership_signed_at": now,
	}).Error; err != nil {
		utils.InternalError(c, "Failed to record agreement")
		return
	}

	// ── Send welcome / screening email in background ──────────────────────────
	emailData := utils.PartnershipWelcomeData{
		BrandName: brand.BrandName,
		FirstName: user.FirstName,
		Email:     user.Email,
		SignedAt:  now.Format("2 January 2006, 15:04 UTC"),
	}

	go func() {
		if err := utils.SendPartnershipWelcomeEmail(emailData); err != nil {
			fmt.Printf("[partnership] email failed for %s: %v\n", user.Email, err)
		}
	}()

	utils.OK(c, "Partnership agreement signed successfully", gin.H{
		"brand_name": brand.BrandName,
		"signed_at":  now.Format(time.RFC3339),
	})
}