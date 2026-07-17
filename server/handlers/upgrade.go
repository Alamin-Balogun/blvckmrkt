package handlers

import (
	"fmt"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /api/buyer/upgrade-to-brand
// Protected — buyer only.
// Changes account_type to brand, deletes buyer row, creates brand row.
// Account is fully converted immediately — subscription comes after.
func UpgradeToBrand(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		BrandName   string `json:"brand_name"   binding:"required,min=2,max=150"`
		Phone       string `json:"phone"        binding:"required"`
		Description string `json:"description"  binding:"required,min=20"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Validation failed", map[string]string{
			"brand_name":  "Brand name is required (min 2 characters)",
			"phone":       "Phone number is required",
			"description": "Description is required (min 20 characters)",
		})
		return
	}

	// ── Load user ─────────────────────────────────────────────────────────────
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	// ── Must be a buyer account ───────────────────────────────────────────────
	if user.AccountType != models.AccountUser {
		utils.BadRequest(c, "Only buyer accounts can upgrade to brand", nil)
		return
	}

	// ── Check no brand already exists for this user ───────────────────────────
	var existingBrand models.Brand
	if err := database.DB.Where("user_id = ?", userID).First(&existingBrand).Error; err == nil {
		utils.Conflict(c, "A brand profile already exists for this account")
		return
	}

	brandName := strings.TrimSpace(req.BrandName)
	phone     := strings.TrimSpace(req.Phone)
	desc      := strings.TrimSpace(req.Description)

	// ── Run in transaction ────────────────────────────────────────────────────
	txErr := database.DB.Transaction(func(tx *gorm.DB) error {

		// 1. Update account_type to brand on users table
		if err := tx.Model(&models.User{}).
			Where("id = ?", userID).
			Update("account_type", models.AccountBrand).Error; err != nil {
			return fmt.Errorf("failed to update account type: %w", err)
		}

		// 2. Delete buyer profile
		if err := tx.Where("user_id = ?", userID).
			Delete(&models.Buyer{}).Error; err != nil {
			return fmt.Errorf("failed to delete buyer profile: %w", err)
		}

		// 3. Create brand profile
		brand := models.Brand{
			UserID:             userID,
			BrandName:          brandName,
			Slug:               utils.Slugify(brandName),
			Phone:              phone,
			Description:        desc,
			SubscriptionPlan:   "none",
			SubscriptionStatus: models.SubStatusNone,
		}
		// Slug has a unique index — a buyer picking a name that collides with
		// an existing brand's slug (easy to hit: "Supreme", "Palace", etc. are
		// already-seeded demo brands) previously failed the whole upgrade with
		// a generic "please try again" and no way forward. Retry once with the
		// user's own ID appended, which is guaranteed unique.
		if err := tx.Create(&brand).Error; err != nil {
			brand.Slug = fmt.Sprintf("%s-%d", utils.Slugify(brandName), userID)
			if err2 := tx.Create(&brand).Error; err2 != nil {
				return fmt.Errorf("failed to create brand profile: %w", err2)
			}
		}

		return nil
	})

	if txErr != nil {
		utils.InternalError(c, "Failed to upgrade account. Please try again.")
		return
	}

	// ── Generate new token with updated account_type ──────────────────────────
	newToken, err := utils.SignToken(userID, user.Email, string(models.AccountBrand))
	if err != nil {
		utils.InternalError(c, "Account upgraded but failed to generate new token. Please log in again.")
		return
	}

	utils.OK(c, "Account upgraded to brand successfully", gin.H{
		"token":      newToken,
		"brand_name": brandName,
		"message":    "Your account has been upgraded. Please select a subscription plan.",
	})
}