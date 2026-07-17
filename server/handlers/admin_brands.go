package handlers

import (
	"fmt"
	"log"
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/brands ─────────────────────────────────────────────────────
func AdminListBrands(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search := c.Query("search")
	status := c.Query("verification_status")

	q := database.DB.Model(&models.Brand{})
	if search != "" {
		like := "%" + search + "%"
		q = q.Where("brand_name LIKE ? OR slug LIKE ? OR category LIKE ?", like, like, like)
	}
	if status != "" {
		q = q.Where("verification_status = ?", status)
	}

	var total int64
	q.Count(&total)

	var brands []models.Brand
	q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&brands)

	resp := make([]models.BrandResponse, len(brands))
	for i, b := range brands {
		resp[i] = b.ToResponse()
	}

	// Get verification stats
	var pending, verified, suspended int64
	database.DB.Model(&models.Brand{}).Where("verification_status = 'pending'").Count(&pending)
	database.DB.Model(&models.Brand{}).Where("verification_status = 'verified'").Count(&verified)
	database.DB.Model(&models.Brand{}).Where("verification_status = 'suspended'").Count(&suspended)

	utils.OK(c, "Brands fetched", gin.H{
		"brands":    resp,
		"total":     total,
		"pending":   pending,
		"verified":  verified,
		"suspended": suspended,
	})
}

// ── GET /api/admin/brands/:id ─────────────────────────────────────────────────
func AdminGetBrand(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var brand models.Brand
	if err := database.DB.First(&brand, id).Error; err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	// Get user info
	var user models.User
	database.DB.First(&user, brand.UserID)

	// Get product count
	var productCount int64
	database.DB.Model(&models.Product{}).Where("brand_id = ?", brand.ID).Count(&productCount)

	// Get order count
	var orderCount int64
	database.DB.Raw(`
		SELECT COUNT(DISTINCT o.id)
		FROM orders o
		JOIN order_items oi ON oi.order_id = o.id
		JOIN products p ON p.id = oi.product_id
		WHERE p.brand_id = ?
	`, brand.ID).Scan(&orderCount)

	utils.OK(c, "Brand fetched", gin.H{
		"brand":         brand.ToResponse(),
		"user":          user.ToResponse(),
		"product_count": productCount,
		"order_count":   orderCount,
	})
}

// ── PATCH /api/admin/brands/:id ───────────────────────────────────────────────
func AdminUpdateBrand(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	allowed := map[string]bool{
		"brand_name":          true,
		"description":         true,
		"logo_url":            true,
		"banner_url":          true,
		"website":             true,
		"category":            true,
		"instagram":           true,
		"facebook":            true,
		"twitter":             true,
		"tiktok":              true,
		"phone":               true,
		"verification_status": true,
		"commission_rate":     true, // ✅ now allowed
		"is_exclusive":        true,
		"featured_rank":       true,
	}

	updates := map[string]interface{}{}
	commissionChanged := false

	for k, v := range body {
		if !allowed[k] {
			continue
		}

		// Special handling for commission_rate: accept null, number, or empty string
		if k == "commission_rate" {
			commissionChanged = true
			if v == nil || v == "" {
				updates["commission_rate"] = nil // reset to platform default
				continue
			}
			// Coerce to float64 (JSON numbers come in as float64 already)
			switch n := v.(type) {
			case float64:
				if n < 0 || n >= 100 {
					utils.BadRequest(c, "Commission rate must be between 0 and 100", nil)
					return
				}
				updates["commission_rate"] = n
			default:
				utils.BadRequest(c, "Invalid commission_rate value", nil)
				return
			}
			continue
		}

		// featured_rank: accept null (unpin) or a whole number — JSON numbers
		// arrive as float64 via map[string]interface{}, so this needs the same
		// explicit coercion commission_rate does above.
		if k == "featured_rank" {
			if v == nil || v == "" {
				updates["featured_rank"] = nil
				continue
			}
			switch n := v.(type) {
			case float64:
				updates["featured_rank"] = int(n)
			default:
				utils.BadRequest(c, "Invalid featured_rank value", nil)
				return
			}
			continue
		}

		updates[k] = v
	}

	if len(updates) == 0 {
		utils.BadRequest(c, "No valid fields provided", nil)
		return
	}

	if err := database.DB.Model(&models.Brand{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to update brand")
		return
	}

	// ✅ If commission rate changed, recalculate all of this brand's product prices
	if commissionChanged {
		recalculateBrandProductPrices(uint(id))
	}

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "update_brand", "")
	utils.OK(c, "Brand updated", nil)
}

// ── PATCH /api/admin/brands/:id/verification ──────────────────────────────────
func AdminUpdateBrandVerification(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var req struct {
		Status string `json:"verification_status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "verification_status is required", nil)
		return
	}

	valid := map[string]bool{
		"pending":   true,
		"verified":  true,
		"suspended": true,
	}
	if !valid[req.Status] {
		utils.BadRequest(c, "Invalid verification status", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, id).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	database.DB.Model(&brand).Update("verification_status", req.Status)

	// Update user verification status too
	var userStatus models.VerificationStatus
	switch req.Status {
	case "verified":
		userStatus = models.VerificationVerified
	case "suspended":
		userStatus = models.VerificationSuspended
	default:
		userStatus = models.VerificationPending
	}
	database.DB.Model(&models.User{}).Where("id = ?", brand.UserID).Update("verification_status", userStatus)

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "update_verification",
		fmt.Sprintf(`{"status":"%s"}`, req.Status))

	utils.OK(c, "Verification status updated", gin.H{"verification_status": req.Status})
}

// ── PATCH /api/admin/brands/:id/subscription ──────────────────────────────────
func AdminUpdateBrandSubscription(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var req struct {
		Plan    string `json:"subscription_plan"`
		Status  string `json:"subscription_status"`
		Billing string `json:"subscription_billing"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, id).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	updates := map[string]interface{}{}
	if req.Plan != "" {
		updates["subscription_plan"] = req.Plan
	}
	if req.Status != "" {
		updates["subscription_status"] = req.Status
	}
	if req.Billing != "" {
		updates["subscription_billing"] = req.Billing
	}

	database.DB.Model(&brand).Updates(updates)

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "update_subscription",
		fmt.Sprintf(`{"plan":"%s","status":"%s"}`, req.Plan, req.Status))

	utils.OK(c, "Subscription updated", nil)
}

// ── POST /api/admin/brands/:id/approve ────────────────────────────────────────
func AdminApproveBrand(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, id).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	database.DB.Model(&brand).Update("verification_status", models.VerificationVerified)

	// Update user verification status too
	database.DB.Model(&models.User{}).Where("id = ?", brand.UserID).
		Update("verification_status", models.VerificationVerified)

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "approve_brand",
		fmt.Sprintf(`{"brand_name":"%s"}`, brand.BrandName))

	utils.OK(c, "Brand approved", gin.H{"verification_status": "verified"})
}

// ── POST /api/admin/brands/:id/suspend ────────────────────────────────────────
func AdminSuspendBrand(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, id).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	database.DB.Model(&brand).Update("verification_status", models.VerificationSuspended)

	// Update user verification status too
	database.DB.Model(&models.User{}).Where("id = ?", brand.UserID).
		Update("verification_status", models.VerificationSuspended)

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "suspend_brand",
		fmt.Sprintf(`{"brand_name":"%s"}`, brand.BrandName))

	utils.OK(c, "Brand suspended", gin.H{"verification_status": "suspended"})
}

// ── PATCH /api/admin/brands/:id/commission ────────────────────────────────────
// Set or clear a custom commission rate for a specific brand.
// NULL commission_rate = use platform default.
// When changed, all products for this brand are automatically recalculated.
func AdminUpdateBrandCommission(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var req struct {
		CommissionRate *float64 `json:"commission_rate"` // NULL to use platform default
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	// Validate rate if provided
	if req.CommissionRate != nil {
		rate := *req.CommissionRate
		if rate < 0 || rate >= 100 {
			utils.BadRequest(c, "Commission rate must be between 0 and 100", nil)
			return
		}
	}

	var brand models.Brand
	if err := database.DB.First(&brand, id).Error; err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	// Update brand commission
	if err := database.DB.Model(&brand).Update("commission_rate", req.CommissionRate).Error; err != nil {
		utils.InternalError(c, "Failed to update commission rate")
		return
	}

	// Recalculate all products for this brand
	recalculateBrandProductPrices(uint(id))

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "update_commission",
		fmt.Sprintf(`{"brand_id":%d,"commission_rate":%v}`, id, req.CommissionRate))

	utils.OK(c, "Commission rate updated and products recalculated", gin.H{
		"commission_rate": req.CommissionRate,
	})
}

// ── DELETE /api/admin/brands/:id ──────────────────────────────────────────────
func AdminDeleteBrand(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var brand models.Brand
	if database.DB.First(&brand, id).Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	// Check if brand has products
	var productCount int64
	database.DB.Model(&models.Product{}).Where("brand_id = ?", id).Count(&productCount)
	if productCount > 0 {
		utils.BadRequest(c, fmt.Sprintf("Cannot delete brand with %d products. Delete products first.", productCount), nil)
		return
	}

	database.DB.Delete(&brand)

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "delete_brand",
		fmt.Sprintf(`{"brand_name":"%s"}`, brand.BrandName))

	utils.OK(c, "Brand deleted", nil)
}

// ── POST /api/admin/brands/:id/featured ───────────────────────────────────────
func AdminToggleFeaturedBrand(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var req struct {
		IsFeatured bool `json:"is_featured"`
	}
	c.ShouldBindJSON(&req)

	database.DB.Model(&models.Brand{}).Where("id = ?", id).Update("is_featured", req.IsFeatured)

	entityID := uint(id)
	logActivity(c, "brand", &entityID, "toggle_featured",
		fmt.Sprintf(`{"is_featured":%v}`, req.IsFeatured))

	utils.OK(c, "Featured status updated", gin.H{"is_featured": req.IsFeatured})
}

// ── recalculateBrandProductPrices ─────────────────────────────────────────────
// Recalculate prices for all products of a specific brand.
// Uses the brand's custom commission rate if set, otherwise platform default.
func recalculateBrandProductPrices(brandID uint) {
	var brand models.Brand
	database.DB.Select("commission_rate").First(&brand, brandID)

	var rate float64
	if brand.CommissionRate != nil {
		// Brand has custom commission rate
		rate = *brand.CommissionRate
	} else {
		// Use platform default
		rate = getAdminSettingFloat("commission_rate", 10)
	}

	if rate <= 0 || rate >= 100 {
		// Zero / invalid commission: buyer price = brand price, no strike-through
		database.DB.Exec(`
			UPDATE products
			SET
				price         = brand_price,
				compare_price = 0
			WHERE brand_id = ? AND brand_price > 0 AND deleted_at IS NULL
		`, brandID)
	} else {
		// price        = ROUND(brand_price × (1 − rate/100), 2)
		// compare_price = brand_price  ← shown slashed in the UI
		database.DB.Exec(`
			UPDATE products
			SET
				price         = ROUND(brand_price * (1 - ? / 100), 2),
				compare_price = brand_price
			WHERE brand_id = ? AND brand_price > 0 AND deleted_at IS NULL
		`, rate, brandID)
	}

	log.Printf("[recalculateBrandProductPrices] Brand %d products recalculated at %.2f%% commission", brandID, rate)
}