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

// DELETE /api/buyer/delete-account
// Buyer deletes their own account — archived to audit_log, always restorable by admin
func BuyerDeleteOwnAccount(c *gin.Context) {
	// Try all possible context keys set by middleware
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

	// Get buyer profile
	var buyer models.Buyer
	if err := tx.Unscoped().Where("user_id = ?", userID).First(&buyer).Error; err != nil {
		tx.Rollback()
		utils.NotFound(c, "Buyer profile not found")
		return
	}

	// Archive buyer to audit_log
	buyerData, _ := json.Marshal(buyer)
	buyerAudit := models.AuditLog{
		Table:      "buyers",
		RecordID:   int(buyer.ID),
		RecordData: string(buyerData),
		DeletedBy:  nil, // self-deleted
		DeletedAt:  now,
		IPAddress:  &ip,
		CanRestore: true,
	}
	if err := tx.Create(&buyerAudit).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to archive buyer")
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

	// Hard delete buyer
	if err := tx.Unscoped().Delete(&buyer).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to delete buyer profile")
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
	logActivity(c, "user", &entityID, "buyer_self_deleted",
		fmt.Sprintf(`{"email":"%s"}`, user.Email))

	utils.OK(c, "Account deleted. Contact support to restore.", nil)
}