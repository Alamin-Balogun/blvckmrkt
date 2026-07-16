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
	"golang.org/x/crypto/bcrypt"
)

// ── GET /api/admin/employees ──────────────────────────────────────────────────
func AdminListEmployees(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search        := strings.TrimSpace(c.Query("search"))
	status        := c.Query("status")

	q := database.DB.Model(&models.Employee{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR role LIKE ?",
			like, like, like, like)
	}
	if status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	var employees []models.Employee
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&employees)

	resp := make([]models.EmployeeResponse, len(employees))
	for i, e := range employees {
		resp[i] = e.ToResponse()
	}

	utils.OK(c, "Employees fetched", gin.H{"employees": resp, "total": total})
}

// ── GET /api/admin/employees/:id ──────────────────────────────────────────────
func AdminGetEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid employee ID", nil)
		return
	}

	var emp models.Employee
	if err := database.DB.First(&emp, id).Error; err != nil {
		utils.NotFound(c, "Employee not found")
		return
	}
	utils.OK(c, "Employee fetched", emp.ToResponse())
}

// ── POST /api/admin/employees ─────────────────────────────────────────────────
func AdminCreateEmployee(c *gin.Context) {
	var req struct {
		FirstName      string  `json:"first_name"      binding:"required"`
		LastName       string  `json:"last_name"       binding:"required"`
		Email          string  `json:"email"           binding:"required,email"`
		Phone          string  `json:"phone"`
		Role           string  `json:"role"            binding:"required"`
		Password       string  `json:"password"        binding:"required,min=8"`
		ReferralCode   string  `json:"referral_code"`
		CommissionType string  `json:"commission_type"`
		CommissionRate float64 `json:"commission_rate"`
		PayoutMethod   string  `json:"payout_method"`
		MinimumPayout  float64 `json:"minimum_payout"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "first_name, last_name, email, role and password are required", nil)
		return
	}

	// Check email uniqueness
	var count int64
	database.DB.Model(&models.Employee{}).Where("email = ?", strings.ToLower(req.Email)).Count(&count)
	if count > 0 {
		utils.Conflict(c, "An employee with this email already exists")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to hash password")
		return
	}

	invitedBy := adminIDFromCtx(c)
	emp := models.Employee{
		FirstName:      strings.TrimSpace(req.FirstName),
		LastName:       strings.TrimSpace(req.LastName),
		Email:          strings.ToLower(strings.TrimSpace(req.Email)),
		Phone:          req.Phone,
		Role:           strings.TrimSpace(req.Role),
		Password:       string(hash),
		Status:         "active",
		InvitedBy:      &invitedBy,
		ReferralCode:   req.ReferralCode,
		CommissionType: req.CommissionType,
		CommissionRate: req.CommissionRate,
		PayoutMethod:   req.PayoutMethod,
	}
	if req.MinimumPayout > 0 {
		emp.MinimumPayout = req.MinimumPayout
	}

	if err := database.DB.Create(&emp).Error; err != nil {
		utils.InternalError(c, "Failed to create employee")
		return
	}

	logActivity(c, "employee", &emp.ID, "created_employee",
		fmt.Sprintf(`{"display_id":"%s","email":"%s","role":"%s"}`,
			emp.DisplayID, emp.Email, emp.Role))

	utils.Created(c, "Employee created", emp.ToResponse())
}

// ── PATCH /api/admin/employees/:id ────────────────────────────────────────────
func AdminUpdateEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid employee ID", nil)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	allowed := map[string]bool{
		"first_name": true, "last_name": true, "email": true,
		"phone": true, "role": true, "status": true,
		"referral_code": true, "commission_type": true, "commission_rate": true,
		"payout_method": true, "payout_details": true, "minimum_payout": true,
		"cookie_days": true,
	}
	updates := map[string]interface{}{}
	for k, v := range body {
		if allowed[k] {
			updates[k] = v
		}
	}

	// Hash new password if provided
	if pw, ok := body["password"].(string); ok && len(pw) >= 8 {
		hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		if err == nil {
			updates["password"] = string(hash)
		}
	}

	if len(updates) == 0 {
		utils.BadRequest(c, "No valid fields provided", nil)
		return
	}

	database.DB.Model(&models.Employee{}).Where("id = ?", id).Updates(updates)

	meta, _ := json.Marshal(updates)
	entityID := uint(id)
	logActivity(c, "employee", &entityID, "updated_employee", string(meta))

	utils.OK(c, "Employee updated", nil)
}

// ── DELETE /api/admin/employees/:id ───────────────────────────────────────────
func AdminDeleteEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid employee ID", nil)
		return
	}

	var emp models.Employee
	if database.DB.First(&emp, id).Error != nil {
		utils.NotFound(c, "Employee not found")
		return
	}

	database.DB.Delete(&models.Employee{}, id)

	entityID := uint(id)
	logActivity(c, "employee", &entityID, "deleted_employee",
		fmt.Sprintf(`{"display_id":"%s","email":"%s"}`, emp.DisplayID, emp.Email))

	utils.OK(c, "Employee deleted", nil)
}

// ── POST /api/admin/employees/:id/suspend ─────────────────────────────────────
func AdminSuspendEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid employee ID", nil)
		return
	}

	database.DB.Model(&models.Employee{}).Where("id = ?", id).Update("status", "suspended")

	entityID := uint(id)
	logActivity(c, "employee", &entityID, "suspended_employee", "")
	utils.OK(c, "Employee suspended", nil)
}

// ── POST /api/admin/employees/:id/reinstate ────────────────────────────────────
func AdminReinstateEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid employee ID", nil)
		return
	}

	database.DB.Model(&models.Employee{}).Where("id = ?", id).Update("status", "active")

	entityID := uint(id)
	logActivity(c, "employee", &entityID, "reinstated_employee", "")
	utils.OK(c, "Employee reinstated", nil)
}

// ── GET /api/admin/employees/:id/referrals ────────────────────────────────────
func AdminGetEmployeeReferrals(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid employee ID", nil)
		return
	}

	limit, offset := adminPageParams(c)

	var logs []models.EmployeeReferralLog
	database.DB.Where("employee_id = ?", id).
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&logs)

	var total int64
	database.DB.Model(&models.EmployeeReferralLog{}).Where("employee_id = ?", id).Count(&total)

	utils.OK(c, "Referral logs fetched", gin.H{"logs": logs, "total": total})
}