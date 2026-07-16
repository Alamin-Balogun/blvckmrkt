package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"golang.org/x/crypto/bcrypt"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/users ──────────────────────────────────────────────────────
func AdminListUsers(c *gin.Context) {
	limit, offset := adminPageParams(c)
	accountType := c.Query("account_type")
	search := c.Query("search")

	q := database.DB.Model(&models.User{}).Where("account_type != 'admin'")
	if accountType != "" {
		q = q.Where("account_type = ?", accountType)
	}
	if search = strings.TrimSpace(search); search != "" {
		like := "%" + search + "%"
		q = q.Where("email LIKE ? OR first_name LIKE ? OR last_name LIKE ?", like, like, like)
	}

	var total int64
	q.Count(&total)

	var users []models.User
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users)

	resp := make([]models.UserResponse, len(users))
	for i, u := range users {
		resp[i] = u.ToResponse()
	}

	utils.OK(c, "Users fetched", gin.H{
		"users": resp,
		"total": total,
	})
}

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
func AdminGetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	extra := gin.H{}
	if user.AccountType == models.AccountUser {
		var buyer models.Buyer
		if database.DB.Where("user_id = ?", user.ID).First(&buyer).Error == nil {
			extra["buyer"] = buyer.ToResponse()
		}
	} else if user.AccountType == models.AccountBrand {
		var brand models.Brand
		if database.DB.Where("user_id = ?", user.ID).First(&brand).Error == nil {
			extra["brand"] = brand.ToResponse()
		}
	}

	utils.OK(c, "User fetched", gin.H{
		"user":  user.ToResponse(),
		"extra": extra,
	})
}

// ── PATCH /api/admin/users/:id ────────────────────────────────────────────────
func AdminUpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	allowed := map[string]bool{
		"first_name": true,
		"last_name":  true,
		"email":      true,
		"avatar_url": true,
	}
	updates := map[string]interface{}{}
	for k, v := range body {
		if allowed[k] {
			updates[k] = v
		}
	}
	if len(updates) == 0 {
		utils.BadRequest(c, "No valid fields provided", nil)
		return
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to update user")
		return
	}
	utils.OK(c, "User updated", nil)
}

// ── PATCH /api/admin/buyers/:id ───────────────────────────────────────────────
func AdminUpdateBuyer(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid buyer ID", nil)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	allowed := map[string]bool{
		"phone": true,
	}
	updates := map[string]interface{}{}
	for k, v := range body {
		if allowed[k] {
			updates[k] = v
		}
	}
	if len(updates) == 0 {
		utils.BadRequest(c, "No valid fields provided", nil)
		return
	}

	if err := database.DB.Model(&models.Buyer{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to update buyer")
		return
	}
	utils.OK(c, "Buyer updated", nil)
}

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
func AdminDeleteUser(c *gin.Context) {
	// ✅ Debug: log all context keys to find correct admin ID key
	for k, v := range c.Keys {
		log.Printf("[DEBUG] context key: %q = %v", k, v)
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var adminUserID *int
	for _, key := range []string{"admin_id", "adminID", "user_id", "userID"} {
		if raw, exists := c.Get(key); exists {
			if id, ok := raw.(uint); ok {
				v := int(id)
				adminUserID = &v
				break
			}
			if id, ok := raw.(int); ok {
				adminUserID = &id
				break
			}
		}
	}

	ipAddress := c.ClientIP()

	var deleteBody struct {
		Permanent bool `json:"permanent"`
	}
	_ = c.ShouldBindJSON(&deleteBody)
	canRestore := !deleteBody.Permanent

	tx := database.DB.Begin()
	if tx.Error != nil {
		utils.InternalError(c, "Database transaction error")
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var user models.User
	if err := tx.First(&user, id).Error; err != nil {
		tx.Rollback()
		utils.NotFound(c, "User not found")
		return
	}

	userData, err := json.Marshal(user)
	if err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to serialize user data")
		return
	}

	userDataStr := string(userData)
	auditUser := models.AuditLog{
		Table:      "users",
		RecordID:   int(user.ID),
		RecordData: userDataStr,
		DeletedBy:  adminUserID,
		IPAddress:  &ipAddress,
		CanRestore: canRestore,
	}
	if err := tx.Create(&auditUser).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to archive user")
		return
	}

	var brand models.Brand
	if tx.Unscoped().Where("user_id = ?", id).First(&brand).Error == nil {
		brandData, _ := json.Marshal(brand)
		brandDataStr := string(brandData)
		auditBrand := models.AuditLog{
			Table:      "brands",
			RecordID:   int(brand.ID),
			RecordData: brandDataStr,
			DeletedBy:  adminUserID,
			IPAddress:  &ipAddress,
			CanRestore: canRestore,
		}
		if err := tx.Create(&auditBrand).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to archive brand")
			return
		}
		if err := tx.Unscoped().Delete(&brand).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to delete brand")
			return
		}
	}

	var buyer models.Buyer
	if tx.Unscoped().Where("user_id = ?", id).First(&buyer).Error == nil {
		buyerData, _ := json.Marshal(buyer)
		buyerDataStr := string(buyerData)
		auditBuyer := models.AuditLog{
			Table:      "buyers",
			RecordID:   int(buyer.ID),
			RecordData: buyerDataStr,
			DeletedBy:  adminUserID,
			IPAddress:  &ipAddress,
			CanRestore: canRestore,
		}
		if err := tx.Create(&auditBuyer).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to archive buyer")
			return
		}
		if err := tx.Unscoped().Delete(&buyer).Error; err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to delete buyer")
			return
		}
	}

	if err := tx.Unscoped().Delete(&user).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to delete user")
		return
	}

	entityID := uint(id)
	logActivity(c, "user", &entityID, "deleted_user",
		fmt.Sprintf(`{"email":"%s","account_type":"%s"}`, user.Email, user.AccountType))

	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, "Failed to commit deletion")
		return
	}

	utils.OK(c, "User deleted successfully", gin.H{
		"archived":        true,
		"email_available": true,
		"message":         "User can now register with the same email",
	})
}

// ── POST /api/admin/users/:id/ban ─────────────────────────────────────────────
func AdminBanUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var user models.User
	if database.DB.First(&user, id).Error != nil {
		utils.NotFound(c, "User not found")
		return
	}

	database.DB.Model(&models.User{}).Where("id = ?", id).
		Update("account_type", "banned")

	entityID := uint(id)
	logActivity(c, "user", &entityID, "banned_user",
		fmt.Sprintf(`{"email":"%s"}`, user.Email))

	utils.OK(c, "User banned", nil)
}

// ── POST /api/admin/users/:id/unban ──────────────────────────────────────────
func AdminUnbanUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var brand models.Brand
	var buyer models.Buyer
	originalType := "user"
	if database.DB.Where("user_id = ?", id).First(&brand).Error == nil {
		originalType = "brand"
	} else if database.DB.Where("user_id = ?", id).First(&buyer).Error == nil {
		originalType = "user"
	}

	database.DB.Model(&models.User{}).Where("id = ?", id).
		Update("account_type", originalType)

	entityID := uint(id)
	logActivity(c, "user", &entityID, "unbanned_user", "")

	utils.OK(c, "User unbanned", nil)
}

// ── POST /api/admin/users/:id/verify ─────────────────────────────────────────
func AdminVerifyUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	database.DB.Model(&models.Brand{}).Where("user_id = ?", id).
		Update("verification_status", models.VerificationVerified)

	entityID := uint(id)
	logActivity(c, "user", &entityID, "verified_user", "")

	utils.OK(c, "User verified", nil)
}

// ── POST /api/admin/users/create ─────────────────────────────────────────────
func AdminCreateUser(c *gin.Context) {
	var req struct {
		AccountType string `json:"account_type"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		Phone       string `json:"phone"`
		BrandName   string `json:"brand_name"`
		Description string `json:"description"`
		LogoURL     string `json:"logo_url"`
		Website     string `json:"website"`
		Instagram   string `json:"instagram"`
		Facebook    string `json:"facebook"`
		Twitter     string `json:"twitter"`
		TikTok      string `json:"tiktok"`
		Category    string `json:"category"`
		AutoVerify  bool   `json:"auto_verify"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}
	if req.FirstName == "" || req.LastName == "" || req.Email == "" || req.Password == "" {
		utils.BadRequest(c, "First name, last name, email and password are required", nil)
		return
	}

	// Check email not taken
	var clash models.User
	if database.DB.Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).First(&clash).Error == nil {
		utils.Conflict(c, "Email already in use")
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to process password")
		return
	}

	accountType := models.AccountUser
	if req.AccountType == "brand" {
		accountType = models.AccountBrand
	}

	user := models.User{
		FirstName:   strings.TrimSpace(req.FirstName),
		LastName:    strings.TrimSpace(req.LastName),
		Email:       strings.ToLower(strings.TrimSpace(req.Email)),
		Password:    string(hashed),
		AccountType: accountType,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		utils.InternalError(c, "Failed to create user")
		return
	}

	if accountType == models.AccountUser {
		buyer := models.Buyer{UserID: user.ID, Phone: req.Phone}
		database.DB.Create(&buyer)
	} else if accountType == models.AccountBrand {
		brandName := req.BrandName
		if brandName == "" {
			brandName = req.FirstName + " " + req.LastName
		}
		verStatus := models.VerificationPending
		if req.AutoVerify {
			verStatus = models.VerificationVerified
		}
		brand := models.Brand{
			UserID:             user.ID,
			BrandName:          brandName,
			Slug:               utils.Slugify(brandName),
			Description:        req.Description,
			LogoURL:            req.LogoURL,
			Website:            req.Website,
			Instagram:          req.Instagram,
			Facebook:           req.Facebook,
			Twitter:            req.Twitter,
			TikTok:             req.TikTok,
			Category:           req.Category,
			Phone:              req.Phone,
			VerificationStatus: verStatus,
		}
		database.DB.Create(&brand)
	}

	utils.OK(c, "Account created successfully", gin.H{"user_id": user.ID})
}