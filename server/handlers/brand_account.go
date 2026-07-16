package handlers

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// DELETE /api/user/brand/delete-account
// Brand deletes their own account — archived to audit_log, always restorable by admin
func BrandDeleteOwnAccount(c *gin.Context) {
var userID uint
	for _, key := range []string{"user_id", "userID", "id", "uid"} {
		if raw, exists := c.Get(key); exists {
			if v, ok := raw.(uint); ok && v > 0 {
				userID = v
				break
			}
		}
	}
	if userID == 0 {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	ip := c.ClientIP()
	now := time.Now()

	tx := database.DB.Begin()
	if tx.Error != nil {
		utils.InternalError(c, "Database error")
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get user
	var user models.User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		utils.NotFound(c, "User not found")
		return
	}

	// Get brand
	var brand models.Brand
	if err := tx.Unscoped().Where("user_id = ?", userID).First(&brand).Error; err != nil {
		tx.Rollback()
		utils.NotFound(c, "Brand profile not found")
		return
	}

	// Archive brand to audit_log — always can_restore: true (admin restores)
	brandData, _ := json.Marshal(brand)
	brandAudit := models.AuditLog{
		Table:      "brands",
		RecordID:   int(brand.ID),
		RecordData: string(brandData),
		DeletedBy:  nil, // self-deleted
		DeletedAt:  now,
		IPAddress:  &ip,
		CanRestore: true, // admin can always restore
	}
	if err := tx.Create(&brandAudit).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to archive brand")
		return
	}

	// Archive user to audit_log
	userData, _ := json.Marshal(user)
	userAudit := models.AuditLog{
		Table:      "users",
		RecordID:   int(user.ID),
		RecordData: string(userData),
		DeletedBy:  nil,
		DeletedAt:  now,
		IPAddress:  &ip,
		CanRestore: true,
	}
	if err := tx.Create(&userAudit).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to archive user")
		return
	}

	// Hard delete brand
	if err := tx.Unscoped().Delete(&brand).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to delete brand")
		return
	}

	// Hard delete user
	if err := tx.Unscoped().Delete(&user).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to delete account")
		return
	}

	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, "Failed to commit deletion")
		return
	}

	entityID := userID
	logActivity(c, "user", &entityID, "brand_self_deleted",
		fmt.Sprintf(`{"email":"%s","brand":"%s"}`, user.Email, brand.BrandName))

	utils.OK(c, "Account deleted successfully. Contact support to restore.", nil)
}