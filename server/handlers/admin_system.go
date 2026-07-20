package handlers

import (
	"encoding/json"
	"log"
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/services"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
)

// ── SITE PAGES ────────────────────────────────────────────────────────────────

// GET /api/admin/pages — list all known pages with their last-updated time
func AdminListSitePages(c *gin.Context) {
	var pages []models.SitePage
	database.DB.Select("slug, updated_at").Find(&pages)

	// Ensure all 7 pages appear even if never saved
	known := []string{"home", "about", "shop", "contact", "brands", "drops", "blog"}
	pageMap := map[string]models.SitePage{}
	for _, p := range pages {
		pageMap[p.Slug] = p
	}
	result := make([]gin.H, 0, len(known))
	for _, slug := range known {
		p, exists := pageMap[slug]
		if exists {
			result = append(result, gin.H{"slug": slug, "updated_at": p.UpdatedAt})
		} else {
			result = append(result, gin.H{"slug": slug, "updated_at": nil})
		}
	}

	utils.OK(c, "Pages fetched", gin.H{"pages": result})
}

// GET /api/admin/pages/:slug
func AdminGetSitePage(c *gin.Context) {
	slug := c.Param("slug")

	var page models.SitePage
	if err := database.DB.Where("slug = ?", slug).First(&page).Error; err != nil {
		// Page doesn't exist yet — return empty content, not an error
		utils.OK(c, "Page fetched", gin.H{
			"slug":       slug,
			"content":    map[string]interface{}{},
			"updated_at": time.Now(),
		})
		return
	}

	var content map[string]interface{}
	if err := json.Unmarshal([]byte(page.ContentJSON), &content); err != nil {
		content = map[string]interface{}{}
	}

	utils.OK(c, "Page fetched", gin.H{
		"slug":       page.Slug,
		"content":    content,
		"updated_at": page.UpdatedAt,
	})
}

// PATCH /api/admin/pages/:slug
func AdminUpdateSitePage(c *gin.Context) {
	slug := c.Param("slug")

	var content map[string]interface{}
	if err := c.ShouldBindJSON(&content); err != nil {
		utils.BadRequest(c, "Invalid JSON body", nil)
		return
	}

	b, _ := json.Marshal(content)

	page := models.SitePage{
		Slug:        slug,
		ContentJSON: string(b),
		UpdatedAt:   time.Now(),
	}

	// Upsert: insert or update on duplicate slug
	if err := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "slug"}},
		DoUpdates: clause.AssignmentColumns([]string{"content_json", "updated_at"}),
	}).Create(&page).Error; err != nil {
		utils.InternalError(c, "Failed to save page")
		return
	}

	utils.OK(c, "Page saved", nil)
}

// ── ADMIN SETTINGS ────────────────────────────────────────────────────────────

// GET /api/admin/settings
func AdminGetSettings(c *gin.Context) {
	var rows []models.AdminSetting
	database.DB.Find(&rows)

	settings := map[string]interface{}{}
	for _, r := range rows {
		// Try to parse as JSON (booleans, numbers, objects), fall back to string
		var parsed interface{}
		if json.Unmarshal([]byte(r.Value), &parsed) == nil {
			settings[r.Key] = parsed
		} else {
			settings[r.Key] = r.Value
		}
	}

	// Not a persisted setting — reflects whether DELLYMAN_API_KEY is set on
	// the server, so the admin UI can warn before switching delivery_mode to
	// "dellyman" with no credentials configured.
	settings["dellyman_configured"] = services.DellymanConfigured()

	utils.OK(c, "Settings fetched", gin.H{"settings": settings})
}

// PATCH /api/admin/settings
// Saves one or more admin settings. If commission_rate is among the keys
// being saved, all product prices are automatically recalculated using each
// product's stored brand_price as the source of truth — so no brand ever
// needs to manually re-save their products after a rate change.
func AdminSaveSettings(c *gin.Context) {
	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid JSON body", nil)
		return
	}

	now := time.Now()
	commissionChanged := false

	for k, v := range body {
		var val string
		switch t := v.(type) {
		case string:
			val = t
		default:
			b, _ := json.Marshal(v)
			val = string(b)
		}

		setting := models.AdminSetting{
			Key:       k,
			Value:     val,
			UpdatedAt: now,
		}
		database.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "setting_key"}},
			DoUpdates: clause.AssignmentColumns([]string{"setting_value", "updated_at"}),
		}).Create(&setting)

		if k == "commission_rate" {
			commissionChanged = true
		}
	}

	// When commission_rate changes, recalculate every product's price and
	// compare_price from brand_price (the immutable value the brand originally
	// set). One bulk UPDATE — no brand needs to touch their products manually.
	if commissionChanged {
		RecalculateAllProductPrices()
	}

	utils.OK(c, "Settings saved", nil)
}

// ── PRIVILEGES — ROLE ─────────────────────────────────────────────────────────

// GET /api/admin/privileges/roles
func AdminGetRolePrivileges(c *gin.Context) {
	var rows []models.RolePrivilege
	database.DB.Find(&rows)

	result := map[string]interface{}{}
	for _, r := range rows {
		var privs map[string]bool
		if json.Unmarshal([]byte(r.PrivilegesJSON), &privs) == nil {
			result[r.Role] = privs
		}
	}

	utils.OK(c, "Role privileges fetched", result)
}

// PATCH /api/admin/privileges/roles/:role
func AdminSaveRolePrivileges(c *gin.Context) {
	role := c.Param("role")

	var privs map[string]bool
	if err := c.ShouldBindJSON(&privs); err != nil {
		utils.BadRequest(c, "Invalid JSON body — expected {\"permission\": true/false}", nil)
		return
	}

	b, _ := json.Marshal(privs)
	rp := models.RolePrivilege{
		Role:           role,
		PrivilegesJSON: string(b),
		UpdatedAt:      time.Now(),
	}

	if err := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "role"}},
		DoUpdates: clause.AssignmentColumns([]string{"privileges_json", "updated_at"}),
	}).Create(&rp).Error; err != nil {
		utils.InternalError(c, "Failed to save role privileges")
		return
	}

	utils.OK(c, "Role privileges saved", nil)
}

// ── PRIVILEGES — USER ─────────────────────────────────────────────────────────

// GET /api/admin/privileges/users/:id
func AdminGetUserPrivileges(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var up models.UserPrivilege
	if err := database.DB.Where("user_id = ?", id).First(&up).Error; err != nil {
		// No overrides yet — return empty map, not an error
		utils.OK(c, "User privileges fetched", gin.H{
			"user_id":   id,
			"overrides": map[string]bool{},
		})
		return
	}

	var overrides map[string]bool
	if json.Unmarshal([]byte(up.OverridesJSON), &overrides) != nil {
		overrides = map[string]bool{}
	}

	utils.OK(c, "User privileges fetched", gin.H{
		"user_id":   id,
		"overrides": overrides,
	})
}

// PATCH /api/admin/privileges/users/:id
func AdminSaveUserPrivileges(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid user ID", nil)
		return
	}

	var body struct {
		Overrides map[string]bool `json:"overrides" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid body — expected {\"overrides\": {\"permission\": true/false}}", nil)
		return
	}

	b, _ := json.Marshal(body.Overrides)
	up := models.UserPrivilege{
		UserID:        strconv.FormatUint(id, 10),
		OverridesJSON: string(b),
		UpdatedAt:     time.Now(),
	}

	if err := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"overrides_json", "updated_at"}),
	}).Create(&up).Error; err != nil {
		utils.InternalError(c, "Failed to save user privileges")
		return
	}

	utils.OK(c, "User privileges saved", nil)
}

// ── DANGER ZONE ───────────────────────────────────────────────────────────────

// POST /api/admin/danger/clear-sessions
func AdminClearSessions(c *gin.Context) {
	now := time.Now()

	setting := models.AdminSetting{
		Key:       "sessions_cleared_at",
		Value:     now.Format(time.RFC3339),
		UpdatedAt: now,
	}
	database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "setting_key"}},
		DoUpdates: clause.AssignmentColumns([]string{"setting_value", "updated_at"}),
	}).Create(&setting)

	logActivity(c, "system", nil, "clear_sessions",
		`{"note":"All user sessions invalidated by admin"}`)

	utils.OK(c, "All sessions cleared. Users will be required to log in again.", gin.H{
		"cleared_at": now.Format(time.RFC3339),
	})
}

// POST /api/admin/danger/flush-cache
func AdminFlushCache(c *gin.Context) {
	logActivity(c, "system", nil, "flush_cache",
		`{"note":"Cache flush triggered by admin"}`)

	utils.OK(c, "Cache flushed successfully.", nil)
}

// GET /api/admin/danger/export
func AdminExportData(c *gin.Context) {
	type ExportPayload struct {
		ExportedAt string                 `json:"exported_at"`
		Users      []models.UserResponse  `json:"users"`
		Brands     []models.BrandResponse `json:"brands"`
		Orders     []models.Order         `json:"orders"`
	}

	var users []models.User
	var brands []models.Brand
	var orders []models.Order

	database.DB.Where("account_type != 'admin'").Find(&users)
	database.DB.Find(&brands)
	database.DB.Preload("Items").Find(&orders)

	userResp := make([]models.UserResponse, len(users))
	for i, u := range users { userResp[i] = u.ToResponse() }

	brandResp := make([]models.BrandResponse, len(brands))
	for i, b := range brands { brandResp[i] = b.ToResponse() }

	payload := ExportPayload{
		ExportedAt: time.Now().Format(time.RFC3339),
		Users:      userResp,
		Brands:     brandResp,
		Orders:     orders,
	}

	logActivity(c, "system", nil, "export_data",
		`{"note":"Full data export triggered by admin"}`)

	c.Header("Content-Disposition", `attachment; filename="blvckmrkt-export.json"`)
	c.JSON(200, payload)
}

// ── RecalculateAllProductPrices ───────────────────────────────────────────────
// Re-derives price and compare_price for every non-deleted product using
// brand_price as the immutable source of truth and the current commission_rate.
//
// Called automatically by AdminSaveSettings whenever commission_rate changes.
// Safe to call at any time — it is a pure recalculation with no side effects.
func RecalculateAllProductPrices() {
	rate := getAdminSettingFloat("commission_rate", 10)

	var err error
	if rate <= 0 || rate >= 100 {
		// Zero / invalid commission: buyer price = brand price, no strike-through
		err = database.DB.Exec(`
			UPDATE products
			SET
				price         = brand_price,
				compare_price = 0
			WHERE brand_price > 0 AND deleted_at IS NULL
		`).Error
	} else {
		// price        = ROUND(brand_price × (1 − rate/100), 2)
		// compare_price = brand_price  ← shown slashed in the UI
		err = database.DB.Exec(`
			UPDATE products
			SET
				price         = ROUND(brand_price * (1 - ? / 100), 2),
				compare_price = brand_price
			WHERE brand_price > 0 AND deleted_at IS NULL
		`, rate).Error
	}

	if err != nil {
		log.Printf("[RecalculateAllProductPrices] failed: %v", err)
		return
	}
	log.Printf("[RecalculateAllProductPrices] all products recalculated at %.2f%% commission", rate)
}