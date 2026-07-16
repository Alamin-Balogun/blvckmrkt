package handlers

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// ── STEP 1 — POST /api/admin/auth/login ──────────────────────────────────────
// Verifies email + password, then emails a 6-digit OTP.
// Returns a short-lived "pending" indicator — NOT the final JWT yet.
// The frontend should then call /api/admin/auth/verify-otp.

func AdminLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email"    binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Email and password are required", nil)
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var admin models.Admin
	if err := database.DB.Where("email = ?", req.Email).First(&admin).Error; err != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	if admin.Status == "suspended" {
		utils.Forbidden(c, "This admin account has been suspended")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password)); err != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	// Generate OTP
	plain, hashed, expiresAt, err := utils.GenerateOTP()
	if err != nil {
		utils.InternalError(c, "Failed to generate 2FA code")
		return
	}

	// Store hashed OTP, reset verified flag
	database.DB.Model(&admin).Updates(map[string]interface{}{
		"otp_code":     hashed,
		"otp_expires_at": expiresAt,
		"otp_verified": false,
	})

	// Send OTP via email
	if err := utils.SendAdminOTPEmail(admin.Email, admin.FirstName, plain); err != nil {
		// Dev fallback — log to console so you can still test without email
		log.Printf("[admin 2FA] OTP for %s: %s (email failed: %v)", admin.Email, plain, err)
	}

	utils.OK(c, "Verification code sent to your email", gin.H{
		"admin_id":   admin.ID,
		"otp_sent":   true,
		"expires_in": "15 minutes",
	})
}

// ── STEP 2 — POST /api/admin/auth/verify-otp ─────────────────────────────────
// Verifies the OTP and — if correct — issues the final admin JWT.

func AdminVerifyOTP(c *gin.Context) {
	var req struct {
		AdminID uint   `json:"admin_id" binding:"required"`
		Code    string `json:"code"     binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "admin_id and code are required", nil)
		return
	}

	var admin models.Admin
	if err := database.DB.First(&admin, req.AdminID).Error; err != nil {
		utils.NotFound(c, "Admin not found")
		return
	}

	if !utils.VerifyOTP(req.Code, admin.OTPCode, admin.OTPExpiresAt) {
		utils.Unauthorized(c, "Invalid or expired verification code")
		return
	}

	// Mark OTP as used and record login metadata
	now    := time.Now()
	device := c.Request.UserAgent()
	if len(device) > 255 { device = device[:255] }

	database.DB.Model(&admin).Updates(map[string]interface{}{
		"otp_code":        "",
		"otp_expires_at":  nil,
		"otp_verified":    true,
		"last_login_at":   now,
		"last_login_ip":   c.ClientIP(),
		"last_login_device": device,
	})

	// Issue the dedicated admin JWT (7-day expiry)
	token, err := utils.SignAdminToken(admin.ID, admin.Email)
	if err != nil {
		utils.InternalError(c, "Failed to generate admin token")
		return
	}

	utils.OK(c, "Login successful", gin.H{
		"token": token,
		"admin": admin.ToResponse(),
	})
}

// ── GET /api/admin/auth/me ────────────────────────────────────────────────────

func AdminMe(c *gin.Context) {
	id := adminIDFromCtx(c)

	var admin models.Admin
	if err := database.DB.First(&admin, id).Error; err != nil {
		utils.NotFound(c, "Admin not found")
		return
	}
	utils.OK(c, "Profile fetched", admin.ToResponse())
}

// ── POST /api/admin/auth/bootstrap ───────────────────────────────────────────
// One-time route to create the very first admin. Disable after use.

func AdminBootstrap(c *gin.Context) {
	var req struct {
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name"  binding:"required"`
		Email     string `json:"email"      binding:"required,email"`
		Password  string `json:"password"   binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "All fields are required (password min 8 chars)", nil)
		return
	}

	var count int64
	database.DB.Model(&models.Admin{}).Count(&count)
	if count > 0 {
		utils.Forbidden(c, "An admin already exists — use /api/admin/auth/login")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to hash password")
		return
	}

	admin := models.Admin{
		FirstName: strings.TrimSpace(req.FirstName),
		LastName:  strings.TrimSpace(req.LastName),
		Email:     strings.ToLower(strings.TrimSpace(req.Email)),
		Password:  string(hash),
		Status:    "active",
	}
	if err := database.DB.Create(&admin).Error; err != nil {
		utils.Conflict(c, fmt.Sprintf("Could not create admin: %v", err))
		return
	}

	utils.Created(c, "Admin account created — you can now log in", gin.H{
		"id":         admin.ID,
		"display_id": admin.DisplayID,
		"email":      admin.Email,
	})
}