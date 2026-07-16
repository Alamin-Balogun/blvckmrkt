package handlers

import (
	"encoding/json"
	"strconv"
	"strings"

	"gorm.io/gorm"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
func AdminGetAuditLogs(c *gin.Context) {
	limit, offset := adminPageParams(c)
	tableName := c.Query("table_name")
	search := c.Query("search")

	q := database.DB.Model(&models.AuditLog{})

	if tableName != "" {
		q = q.Where("table_name = ?", tableName)
	}

	if search = strings.TrimSpace(search); search != "" {
		like := "%" + search + "%"
		q = q.Where("table_name LIKE ? OR record_id = ?", like, search)
	}

	var total int64
	q.Count(&total)

	var logs []models.AuditLog
	q.Order("deleted_at DESC").Limit(limit).Offset(offset).Find(&logs)

	utils.OK(c, "Audit logs fetched", gin.H{
		"logs":  logs,
		"total": total,
	})
}

// POST /api/admin/audit-logs/:id/restore
func AdminRestoreAuditLog(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid audit log ID", nil)
		return
	}

	var entry models.AuditLog
	if err := database.DB.First(&entry, id).Error; err != nil {
		utils.NotFound(c, "Audit log entry not found")
		return
	}

	if !entry.CanRestore {
		utils.BadRequest(c, "This record is marked as permanently deleted and cannot be restored", nil)
		return
	}

	if entry.RecordData == "" {
		utils.BadRequest(c, "No record data available to restore", nil)
		return
	}

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

	var restoreErr error

	switch entry.Table {
	case "users":
		var user models.User
		if err := json.Unmarshal([]byte(entry.RecordData), &user); err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to parse user data")
			return
		}
		// Clear soft-delete field so the row is active again
		user.DeletedAt = gorm.DeletedAt{}
		restoreErr = tx.Unscoped().Create(&user).Error

	case "brands":
		var brand models.Brand
		if err := json.Unmarshal([]byte(entry.RecordData), &brand); err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to parse brand data")
			return
		}
		brand.DeletedAt = gorm.DeletedAt{}
		restoreErr = tx.Unscoped().Create(&brand).Error

	case "buyers":
		var buyer models.Buyer
		if err := json.Unmarshal([]byte(entry.RecordData), &buyer); err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to parse buyer data")
			return
		}
		buyer.DeletedAt = gorm.DeletedAt{}
		restoreErr = tx.Unscoped().Create(&buyer).Error

    case "subscription_plans":
		var plan models.SubscriptionPlanConfig
		if err := json.Unmarshal([]byte(entry.RecordData), &plan); err != nil {
			tx.Rollback()
			utils.InternalError(c, "Failed to parse plan data")
			return
		}
		plan.DeletedAt = gorm.DeletedAt{}
		restoreErr = tx.Unscoped().Create(&plan).Error	

	default:
		tx.Rollback()
		utils.BadRequest(c, "Restore not supported for table: "+entry.Table, nil)
		return
	}

	if restoreErr != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to restore record — it may conflict with existing data: "+restoreErr.Error())
		return
	}

	// Mark as no longer restorable (consumed)
	if err := tx.Model(&entry).Update("can_restore", false).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to update audit log status")
		return
	}

	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, "Failed to commit restore")
		return
	}

	utils.OK(c, "Record restored successfully", gin.H{
		"table":     entry.Table,
		"record_id": entry.RecordID,
	})
}