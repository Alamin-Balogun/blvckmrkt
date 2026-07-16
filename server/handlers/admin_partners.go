package handlers

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/partners ───────────────────────────────────────────────────
func AdminListPartners(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search        := strings.TrimSpace(c.Query("search"))
	partnerType   := c.Query("type")
	stage         := c.Query("stage")

	q := database.DB.Model(&models.Partner{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("company_name LIKE ? OR contact_email LIKE ? OR country LIKE ?",
			like, like, like)
	}
	if partnerType != "" { q = q.Where("type = ?", partnerType) }
	if stage       != "" { q = q.Where("stage = ?", stage)      }

	var total int64
	q.Count(&total)

	var partners []models.Partner
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&partners)

	utils.OK(c, "Partners fetched", gin.H{"partners": partners, "total": total})
}

// ── GET /api/admin/partners/:id ───────────────────────────────────────────────
func AdminGetPartner(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid partner ID", nil)
		return
	}

	var partner models.Partner
	if err := database.DB.First(&partner, id).Error; err != nil {
		utils.NotFound(c, "Partner not found")
		return
	}
	utils.OK(c, "Partner fetched", partner)
}

// ── POST /api/admin/partners ──────────────────────────────────────────────────
func AdminCreatePartner(c *gin.Context) {
	var req struct {
		CompanyName      string   `json:"company_name"       binding:"required"`
		ContactFirstName string   `json:"contact_first_name" binding:"required"`
		ContactLastName  string   `json:"contact_last_name"  binding:"required"`
		ContactEmail     string   `json:"contact_email"      binding:"required,email"`
		ContactPhone     string   `json:"contact_phone"`
		Website          string   `json:"website"`
		Country          string   `json:"country"`
		Type             string   `json:"type"               binding:"required,oneof=investor agency technology logistics media other"`
		Stage            string   `json:"stage"`
		DealValue        *float64 `json:"deal_value"`
		EquityPct        *float64 `json:"equity_pct"`
		ContractURL      string   `json:"contract_url"`
		LogoURL          string   `json:"logo_url"`
		Notes            string   `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "company_name, contact details, and type are required", nil)
		return
	}

	stage := req.Stage
	if stage == "" { stage = "prospect" }

	partner := models.Partner{
		CompanyName:      strings.TrimSpace(req.CompanyName),
		ContactFirstName: strings.TrimSpace(req.ContactFirstName),
		ContactLastName:  strings.TrimSpace(req.ContactLastName),
		ContactEmail:     strings.ToLower(strings.TrimSpace(req.ContactEmail)),
		ContactPhone:     req.ContactPhone,
		Website:          req.Website,
		Country:          req.Country,
		Type:             req.Type,
		Stage:            stage,
		DealValue:        req.DealValue,
		EquityPct:        req.EquityPct,
		ContractURL:      req.ContractURL,
		LogoURL:          req.LogoURL,
		Notes:            req.Notes,
	}

	if err := database.DB.Create(&partner).Error; err != nil {
		utils.InternalError(c, "Failed to create partner")
		return
	}

	logActivity(c, "partner", &partner.ID, "created_partner",
		fmt.Sprintf(`{"display_id":"%s","company":"%s","type":"%s"}`,
			partner.DisplayID, partner.CompanyName, partner.Type))

	utils.Created(c, "Partner created", partner)
}

// ── PATCH /api/admin/partners/:id ─────────────────────────────────────────────
func AdminUpdatePartner(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid partner ID", nil)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	allowed := map[string]bool{
		"company_name": true, "contact_first_name": true, "contact_last_name": true,
		"contact_email": true, "contact_phone": true, "website": true,
		"country": true, "type": true, "stage": true,
		"deal_value": true, "equity_pct": true,
		"contract_start": true, "contract_end": true,
		"contract_url": true, "logo_url": true, "notes": true,
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

	database.DB.Model(&models.Partner{}).Where("id = ?", id).Updates(updates)

	meta, _ := json.Marshal(updates)
	entityID := uint(id)
	logActivity(c, "partner", &entityID, "updated_partner", string(meta))

	utils.OK(c, "Partner updated", nil)
}

// ── DELETE /api/admin/partners/:id ────────────────────────────────────────────
func AdminDeletePartner(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid partner ID", nil)
		return
	}

	var partner models.Partner
	if database.DB.First(&partner, id).Error != nil {
		utils.NotFound(c, "Partner not found")
		return
	}

	database.DB.Delete(&models.Partner{}, id)

	entityID := uint(id)
	logActivity(c, "partner", &entityID, "deleted_partner",
		fmt.Sprintf(`{"display_id":"%s","company":"%s"}`,
			partner.DisplayID, partner.CompanyName))

	utils.OK(c, "Partner deleted", nil)
}