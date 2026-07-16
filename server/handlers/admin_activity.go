package handlers

import (
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/activity ───────────────────────────────────────────────────
// Supports filtering by entity_type, action, and admin_id.
func AdminActivity(c *gin.Context) {
	limit, offset := adminPageParams(c)
	entityType    := c.Query("entity_type")
	action        := c.Query("action")
	adminIDFilter := c.Query("admin_id")

	q := database.DB.Model(&models.AdminActivityLog{})

	if entityType    != "" { q = q.Where("entity_type = ?", entityType)    }
	if action        != "" { q = q.Where("action = ?",      action)        }
	if adminIDFilter != "" { q = q.Where("admin_id = ?",    adminIDFilter) }

	var total int64
	q.Count(&total)

	var logs []models.AdminActivityLog
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&logs)

	utils.OK(c, "Activity fetched", gin.H{"activity": logs, "total": total})
}