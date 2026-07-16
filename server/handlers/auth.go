package handlers

import (
        "log"
        "strings"
        "time"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ── Request bodies ────────────────────────────────────────────────────────────

type RegisterRequest struct {
	FirstName        string `json:"first_name"         binding:"required,min=2,max=80"`
	LastName         string `json:"last_name"          binding:"required,min=2,max=80"`
	Email            string `json:"email"              binding:"required,email"`
	Password         string `json:"password"           binding:"required,min=8"`
	AccountType      string `json:"account_type"       binding:"required,oneof=user brand"`
	BrandName        string `json:"brand_name"`
	VerificationCode string `json:"verification_code"  binding:"required"` // 6-digit OTP
}

type LoginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token     string              `json:"token"`
	User      models.UserResponse `json:"user"`
	Dashboard string              `json:"dashboard"`
	HasPlan   bool                `json:"has_plan"`
}

// ── POST /api/auth/send-verification ─────────────────────────────────────────
//
// Step 1 of signup: validate the email isn't taken, generate an OTP,
// store it in email_verifications, and email it to the user.
// Called BEFORE the account is created.

func SendVerification(c *gin.Context) {
	var req struct {
		Email     string `json:"email"      binding:"required,email"`
		FirstName string `json:"first_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "A valid email and first name are required", nil)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Check email isn't already registered
	var existing models.User
	if result := database.DB.Where("email = ?", req.Email).First(&existing); result.Error == nil {
		utils.Conflict(c, "An account with that email already exists. Please sign in instead.")
		return
	}

	// Generate OTP
	otp, hashedOTP, expiresAt, err := utils.GenerateOTP()
	if err != nil {
		utils.InternalError(c, "Failed to generate verification code")
		return
	}

// Delete any existing code for this email, then insert a fresh one
database.DB.Where("email = ?", req.Email).Delete(&models.EmailVerification{})

verification := models.EmailVerification{
    Email:     req.Email,
    HashedOTP: hashedOTP,
    ExpiresAt: expiresAt,
}
if err := database.DB.Create(&verification).Error; err != nil {
    utils.InternalError(c, "Failed to save verification code")
    return
}

	// Send email
	emailErr := utils.SendVerificationEmail(req.Email, req.FirstName, otp)
	if emailErr != nil {
		println("[DEV] Verification email failed:", emailErr.Error())
		println("[DEV] OTP for", req.Email, "→", otp)
	}

	resp := gin.H{}
	if emailErr != nil || config.App.EmailFrom == "" {
		resp["dev_otp"] = otp
	}

	utils.OK(c, "Verification code sent! Check your inbox.", resp)
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
//
// Step 2 of signup: verify the OTP from email_verifications, then create
// the user account + brand/buyer profile in a single transaction.

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Validation failed", parseBindErrors(err))
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	if req.AccountType == "brand" && strings.TrimSpace(req.BrandName) == "" {
		utils.BadRequest(c, "Validation failed", map[string]string{
			"brand_name": "Brand name is required for brand accounts",
		})
		return
	}

	// Check email not already taken (race condition guard)
	var existing models.User
	if result := database.DB.Where("email = ?", req.Email).First(&existing); result.Error == nil {
		utils.Conflict(c, "An account with that email already exists")
		return
	}

	// Verify the OTP
	var verification models.EmailVerification
	if result := database.DB.Where("email = ?", req.Email).First(&verification); result.Error != nil {
		utils.BadRequest(c, "No verification code found for this email. Please request a new one.", nil)
		return
	}

	if !utils.VerifyOTP(req.VerificationCode, verification.HashedOTP, &verification.ExpiresAt) {
		utils.BadRequest(c, "Invalid or expired verification code. Please request a new one.", map[string]string{
			"verification_code": "Invalid or expired code.",
		})
		return
	}

	// OTP is valid — delete it so it can't be reused
	database.DB.Delete(&verification)

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to process password")
		return
	}

	var user models.User

	txErr := database.DB.Transaction(func(tx *gorm.DB) error {
		user = models.User{
			FirstName:   strings.TrimSpace(req.FirstName),
			LastName:    strings.TrimSpace(req.LastName),
			Email:       req.Email,
			Password:    string(hashed),
			AccountType: models.AccountType(req.AccountType),
		}
		if err := tx.Create(&user).Error; err != nil {
			return err
		}

		if req.AccountType == "brand" {
			brandName := strings.TrimSpace(req.BrandName)
			brand := models.Brand{
				UserID:           user.ID,
				BrandName:        brandName,
				Slug:             utils.Slugify(brandName),
				SubscriptionPlan: "none", // ✅ Changed from models.PlanNone
			}
			if err := tx.Create(&brand).Error; err != nil {
				return err
			}
		} else {
			buyer := models.Buyer{UserID: user.ID}
			if err := tx.Create(&buyer).Error; err != nil {
				return err
			}
		}
		return nil
	})

if txErr != nil {
        log.Printf("[register] transaction failed: %v", txErr)
        utils.InternalError(c, "Failed to create account. Please try again.")
        return
}

	token, err := utils.SignToken(user.ID, user.Email, string(user.AccountType))
	if err != nil {
		utils.InternalError(c, "Account created but failed to generate token")
		return
	}

// ✅ Fetch brand name if brand account so frontend can save it
brandName := ""
if req.AccountType == "brand" {
    var brand models.Brand
    if err := database.DB.
        Where("user_id = ?", user.ID).
        Select("brand_name").
        First(&brand).Error; err == nil {
        brandName = brand.BrandName
    }
}

utils.Created(c, "Account created successfully", gin.H{
    "token":      token,
    "user":       user.ToResponse(),
    "brand_name": brandName, // ✅ now available to frontend
})
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Validation failed", parseBindErrors(err))
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	token, err := utils.SignToken(user.ID, user.Email, string(user.AccountType))
	if err != nil {
		utils.InternalError(c, "Failed to generate token")
		return
	}

	dashboard := "/dashboard/buyer"
	hasPlan   := true

	if user.AccountType == models.AccountBrand {
		var brand models.Brand
		brandResult := database.DB.Where("user_id = ?", user.ID).First(&brand)

		if brandResult.Error != nil {
			dashboard = "/subscribe"
			hasPlan   = false
		} else {
			// ✅ Changed to string comparison
			noSub := brand.SubscriptionPlan == "none" ||
				brand.SubscriptionStatus == models.SubStatusNone ||
				brand.SubscriptionStatus == models.SubStatusExpired ||
				brand.SubscriptionStatus == models.SubStatusCancelled

			if noSub {
				dashboard = "/subscribe"
				hasPlan   = false
			} else {
				dashboard = "/dashboard/brand"
				hasPlan   = true
			}
		}
	}

	utils.OK(c, "Login successful", LoginResponse{
		Token:     token,
		User:      user.ToResponse(),
		Dashboard: dashboard,
		HasPlan:   hasPlan,
	})
}

// ── GET /api/auth/me  (protected) ─────────────────────────────────────────────

func Me(c *gin.Context) {
	userID := c.GetUint("userID")
	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		utils.NotFound(c, "User not found")
		return
	}
	utils.OK(c, "Profile fetched", user.ToResponse())
}

// ── POST /api/auth/logout  (protected) ────────────────────────────────────────
// Blacklists the current JWT token to prevent reuse.
// Frontend should also clear localStorage/sessionStorage.
func Logout(c *gin.Context) {
	userID := c.GetUint("userID")
	
	// Get token from context (set by Auth middleware)
	tokenString, exists := c.Get("token")
	if !exists || tokenString == "" {
		// Fallback: try to extract from header
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 {
				tokenString = parts[1]
			}
		}
	}

	// If we have a token, blacklist it
	if tokenString != "" && tokenString != nil {
		token, ok := tokenString.(string)
		if ok && token != "" {
			// Blacklist the token with 24h expiration (match your JWT expiry)
			blacklistedToken := models.BlacklistedToken{
				UserID:    userID,
				Token:     token,
				ExpiresAt: time.Now().Add(24 * time.Hour), // Adjust to match your JWT expiry
			}

			// Ignore errors - logout should succeed even if blacklist fails
			database.DB.Create(&blacklistedToken)
		}
	}

	utils.OK(c, "Logged out successfully", nil)
}

// ── POST /api/auth/forgot-password ────────────────────────────────────────────

func ForgotPassword(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "A valid email address is required", nil)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	result := database.DB.Where("email = ?", req.Email).First(&user)

	if result.Error != nil {
		utils.BadRequest(c, "No account found with that email address. Please check and try again.", nil)
		return
	}

	otp, hashedOTP, expiresAt, err := utils.GenerateOTP()
	if err != nil {
		utils.InternalError(c, "Failed to generate reset code")
		return
	}

	if err := database.DB.Model(&user).Updates(map[string]interface{}{
		"reset_token":            hashedOTP,
		"reset_token_expires_at": expiresAt,
	}).Error; err != nil {
		utils.InternalError(c, "Failed to save reset code")
		return
	}

	emailErr := utils.SendOTPEmail(user.Email, user.FirstName, otp)
	if emailErr != nil {
		println("[DEV] Email send failed:", emailErr.Error())
		println("[DEV] OTP for", user.Email, "→", otp)
	}

	resp := gin.H{}
	if emailErr != nil || config.App.EmailFrom == "" {
		resp["dev_otp"] = otp
	}
	utils.OK(c, "Reset code sent! Check your inbox — it expires in 15 minutes.", resp)
}

// ── POST /api/auth/reset-password ─────────────────────────────────────────────

func ResetPassword(c *gin.Context) {
	var req struct {
		Email       string `json:"email"        binding:"required,email"`
		Code        string `json:"code"         binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Validation failed", nil)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		utils.BadRequest(c, "Invalid or expired reset code", nil)
		return
	}

	if !utils.VerifyOTP(req.Code, user.ResetToken, user.ResetTokenExpiresAt) {
		utils.BadRequest(c, "Invalid or expired reset code. Please request a new one.", nil)
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to process new password")
		return
	}

	if err := database.DB.Model(&user).Updates(map[string]interface{}{
		"password":               string(hashed),
		"reset_token":            "",
		"reset_token_expires_at": nil,
	}).Error; err != nil {
		utils.InternalError(c, "Failed to update password")
		return
	}

	token, _ := utils.SignToken(user.ID, user.Email, string(user.AccountType))
	utils.OK(c, "Password updated successfully", gin.H{
		"token": token,
		"user":  user.ToResponse(),
	})
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func parseBindErrors(err error) map[string]string {
	errs := make(map[string]string)
	s := err.Error()
	if strings.Contains(s, "first_name")         { errs["first_name"]         = "First name is required (2–80 characters)" }
	if strings.Contains(s, "last_name")          { errs["last_name"]          = "Last name is required (2–80 characters)" }
	if strings.Contains(s, "email")              { errs["email"]              = "A valid email address is required" }
	if strings.Contains(s, "password")           { errs["password"]           = "Password must be at least 8 characters" }
	if strings.Contains(s, "account_type")       { errs["account_type"]       = "Account type must be 'user' or 'brand'" }
	if strings.Contains(s, "verification_code")  { errs["verification_code"]  = "Verification code is required" }
	if len(errs) == 0                            { errs["_"] = s }
	return errs
}
