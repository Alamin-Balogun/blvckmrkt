package handlers

import (
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type VerifyBillingRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name"  binding:"required"`
	Email     string `json:"email"      binding:"required,email"`
}

type PaymentInfo struct {
	Method     string  `json:"method"      binding:"required"`
	Reference  string  `json:"reference"`
	ReceiptURL *string `json:"receipt_url"`
}

type ActivateSubscriptionRequest struct {
	Plan    string       `json:"plan"    binding:"required"`
	Billing string       `json:"billing" binding:"required,oneof=monthly annual"`
	Payment *PaymentInfo `json:"payment"`
}

// ── POST /api/subscription/verify-billing ────────────────────────────────────
func VerifyBilling(c *gin.Context) {
	var req VerifyBillingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Please fill in all billing fields correctly", map[string]string{
			"email": "A valid email address is required",
		})
		return
	}

	userID := c.GetUint("userID")
	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		utils.NotFound(c, "User not found")
		return
	}

	enteredFirst := strings.TrimSpace(strings.ToLower(req.FirstName))
	enteredLast  := strings.TrimSpace(strings.ToLower(req.LastName))
	enteredEmail := strings.TrimSpace(strings.ToLower(req.Email))

	firstMatch := enteredFirst == strings.ToLower(user.FirstName)
	lastMatch  := enteredLast  == strings.ToLower(user.LastName)
	emailMatch := enteredEmail == strings.ToLower(user.Email)

	if firstMatch && lastMatch && emailMatch {
		utils.OK(c, "Billing details verified", gin.H{"user_id": user.ID, "verified": true})
		return
	}

	fieldErrors := map[string]string{}
	if !emailMatch && firstMatch && lastMatch {
		fieldErrors["email"] = "This email doesn't match your account."
	} else if emailMatch && (!firstMatch || !lastMatch) {
		if !firstMatch && !lastMatch {
			fieldErrors["firstName"] = "Your first name doesn't match your account."
			fieldErrors["lastName"]  = "Your last name doesn't match your account."
		} else if !firstMatch {
			fieldErrors["firstName"] = "Your first name doesn't match your account."
		} else {
			fieldErrors["lastName"] = "Your last name doesn't match your account."
		}
	} else {
		if !firstMatch { fieldErrors["firstName"] = "First name doesn't match your account." }
		if !lastMatch  { fieldErrors["lastName"]  = "Last name doesn't match your account." }
		if !emailMatch { fieldErrors["email"]     = "Email doesn't match your account." }
	}
	utils.BadRequest(c, "Some details don't match your account. Please correct the highlighted fields.", fieldErrors)
}

// ── POST /api/subscription/activate ──────────────────────────────────────────
func ActivateSubscription(c *gin.Context) {
	var req ActivateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request", map[string]string{
			"plan": "Plan is required", "billing": "Must be either monthly or annual",
		})
		return
	}

	userID := c.GetUint("userID")

	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		utils.NotFound(c, "User not found")
		return
	}
	if user.AccountType != models.AccountBrand {
		utils.Forbidden(c, "Only brand accounts can activate a subscription")
		return
	}

	var brand models.Brand
	if result := database.DB.Where("user_id = ?", userID).First(&brand); result.Error != nil {
		utils.NotFound(c, "Brand profile not found")
		return
	}

	var dbPlan models.SubscriptionPlanConfig
	if result := database.DB.Where("slug = ? AND is_active = ?", req.Plan, true).First(&dbPlan); result.Error != nil {
		utils.NotFound(c, "Subscription plan not found or is inactive")
		return
	}

	now := time.Now()
	var (
		pricePaid   float64
		trialEndsAt *time.Time
		periodEnd   time.Time
		status      models.SubscriptionStatus
	)

	// ── Trial / free period logic ─────────────────────────────────────────────
	//
	//  isFree   → both prices are 0  → perpetually free, always trial status
	//  hasTrial → admin set trial_days > 0 → first N days free, then paid
	//             e.g. trial_days=7   → 1 week free
	//                  trial_days=30  → 1 month free
	//                  trial_days=365 → 1 year free
	//
	isFree   := dbPlan.MonthlyPrice == 0 && dbPlan.AnnualPrice == 0
	hasTrial := dbPlan.TrialDays > 0

	switch {
	case isFree:
		// Perpetually free plan
		status    = models.SubStatusTrial
		pricePaid = 0.00
		end       := now.AddDate(0, 1, 0)
		trialEndsAt = &end
		periodEnd   = end

	case hasTrial:
		// Paid plan with admin-configured free trial period
		// User gets TrialDays days free, then paid billing applies
		status    = models.SubStatusTrial
		pricePaid = 0.00
		end       := now.AddDate(0, 0, dbPlan.TrialDays)
		trialEndsAt = &end
		periodEnd   = end

	default:
		// Paid plan, no trial
		status = models.SubStatusActive
		if req.Billing == "annual" {
			pricePaid = dbPlan.AnnualPrice * 12
			periodEnd = now.AddDate(1, 0, 0)
		} else {
			pricePaid = dbPlan.MonthlyPrice
			periodEnd = now.AddDate(0, 1, 0)
		}
	}

	// Payment only required for paid plans outside any trial period
	var paymentReference, paymentMethod, receiptURL string
	if !isFree && !hasTrial && pricePaid > 0 {
		if req.Payment == nil {
			utils.BadRequest(c, "Payment information is required for paid plans", nil)
			return
		}
		if req.Payment.Reference == "" && req.Payment.Method != "transfer" {
			utils.BadRequest(c, "Payment reference is required", nil)
			return
		}
		paymentReference = req.Payment.Reference
		paymentMethod    = req.Payment.Method
		if req.Payment.ReceiptURL != nil {
			receiptURL = *req.Payment.ReceiptURL
		}
	}

	// ✅ ADD THIS: Bank transfer stays pending until admin manually verifies
    if req.Payment != nil && req.Payment.Method == "transfer" {
        status    = models.SubStatusNone  // admin must flip to active after verification
        pricePaid = 0.00
    }

	ref := models.GenerateUniqueRef(database.DB)
	var subscription models.Subscription

	txErr := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&brand).Updates(map[string]interface{}{
			"subscription_plan":    dbPlan.Slug,
			"subscription_status":  string(status),
			"subscription_billing": req.Billing,
			"trial_ends_at":        trialEndsAt,
			"current_period_end":   &periodEnd,
		}).Error; err != nil {
			return err
		}

		subscription = models.Subscription{
			Reference:        ref,
			UserID:           userID,
			BrandID:          brand.ID,
			PlanSlug:         dbPlan.Slug,
			PlanName:         dbPlan.Name,
			Billing:          req.Billing,
			Status:           status,
			PricePaid:        pricePaid,
			TrialEndsAt:      trialEndsAt,
			PeriodStart:      now,
			PeriodEnd:        periodEnd,
			PaymentMethod:    paymentMethod,
			PaymentReference: paymentReference,
			ReceiptURL:       receiptURL,
		}
		return tx.Create(&subscription).Error
	})

	if txErr != nil {
		utils.InternalError(c, "Failed to activate subscription. Please try again.")
		return
	}

	database.DB.Where("user_id = ?", userID).First(&brand)
	utils.OK(c, "Subscription activated successfully", gin.H{
		"subscription": subscription.ToResponse(),
		"brand":        brand.ToResponse(),
	})
}

// ── GET /api/subscription/status ─────────────────────────────────────────────
func GetSubscriptionStatus(c *gin.Context) {
	userID := c.GetUint("userID")

	var brand models.Brand
	if result := database.DB.Where("user_id = ?", userID).First(&brand); result.Error != nil {
		utils.NotFound(c, "Brand profile not found")
		return
	}

	var subscription models.Subscription
	database.DB.Where("brand_id = ?", brand.ID).Order("created_at DESC").First(&subscription)

	utils.OK(c, "Subscription status fetched", gin.H{
		"subscription": subscription.ToResponse(),
		"brand":        brand.ToResponse(),
	})
}