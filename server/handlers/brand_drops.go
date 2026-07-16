package handlers

import (
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

const maxDropProducts = 8

// dropStatusForProduct derives the DropProduct status from the product's status:
//   - active or sold_out → "live"
//   - draft or archived  → "scheduled"
func dropStatusForProduct(productStatus models.ProductStatus) models.DropStatus {
	switch productStatus {
	case models.ProductStatus("draft"), models.ProductStatus("archived"):
		return models.DropScheduled
	default:
		return models.DropLive
	}
}

// ── GET /api/brand/drop ───────────────────────────────────────────────────────
func BrandGetActiveDrop(c *gin.Context) {
	userID := c.GetUint("userID")

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var drop models.Drop
	if err := database.DB.
		Where("brand_id = ? AND deleted_at IS NULL", brand.ID).
		Order("created_at DESC").
		First(&drop).Error; err != nil {
		utils.OK(c, "No active drop", nil)
		return
	}

	// Only return non-ended products
	var dropProducts []models.DropProduct
	database.DB.
		Where("drop_id = ? AND status != ?", drop.ID, models.DropEnded).
		Find(&dropProducts)

	utils.OK(c, "Drop fetched", gin.H{
		"id":       drop.ID,
		"name":     drop.Name,
		"drop_at":  drop.DropAt,
		"ends_at":  drop.EndsAt,
		"products": dropProducts,
	})
}

// ── POST /api/brand/drop/products ─────────────────────────────────────────────
func BrandAddProductToDrop(c *gin.Context) {
	userID := c.GetUint("userID")

	// ── Check enable_drops admin setting ──────────────────────────────────────
	// getAdminSettingBool lives in brand_platform_settings.go
	if !getAdminSettingBool("enable_drops", true) {
		utils.BadRequest(c, "Drops are currently disabled by the platform administrator", nil)
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		ProductID uint `json:"product_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "product_id is required", nil)
		return
	}

	// Verify the product belongs to this brand
	var product models.Product
	if err := database.DB.
		Where("id = ? AND brand_id = ?", req.ProductID, brand.ID).
		First(&product).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	// Derive drop status from product's current publish status
	dpStatus := dropStatusForProduct(product.Status)

	// ── Get or auto-create the active drop ───────────────────────────────────
	var drop models.Drop
	if err := database.DB.
		Where("brand_id = ? AND deleted_at IS NULL", brand.ID).
		Order("created_at DESC").
		First(&drop).Error; err != nil {
		now := time.Now()
		drop = models.Drop{
			BrandID: brand.ID,
			UserID:  userID,
			Name:    brand.BrandName + " Drop",
			Slug:    utils.Slugify(brand.BrandName) + "-drop-" + strconv.FormatInt(now.Unix(), 36),
			DropAt:  &now,
		}
		if err2 := database.DB.Create(&drop).Error; err2 != nil {
			utils.InternalError(c, "Failed to create drop")
			return
		}
	}

	// ── Enforce 8-product cap (exclude ended rows) ────────────────────────────
	var count int64
	database.DB.Model(&models.DropProduct{}).
		Where("drop_id = ? AND status != ?", drop.ID, models.DropEnded).
		Count(&count)

	if count >= maxDropProducts {
		utils.BadRequest(c, "Drop is full — maximum 8 products allowed. Remove one first.", nil)
		return
	}

	// ── Guard against duplicates ──────────────────────────────────────────────
	var existing models.DropProduct
	if err := database.DB.
		Where("drop_id = ? AND product_id = ? AND status != ?", drop.ID, req.ProductID, models.DropEnded).
		First(&existing).Error; err == nil {
		utils.OK(c, "Product already in drop", gin.H{
			"drop_id":    drop.ID,
			"product_id": req.ProductID,
			"status":     existing.Status,
		})
		return
	}

	// ── Calculate ends_at from drop_duration_days admin setting ──────────────
	// If admin set e.g. 5 → ends_at = now + 5 days.
	// The expiry job (drop_expiry_job.go, runs hourly) then marks it "ended".
	// If admin left it at 0 (default) → ends_at stays nil, no auto-expiry.
	// getAdminSettingFloat lives in brand_platform_settings.go
	var endsAt *time.Time
	if durationDays := getAdminSettingFloat("drop_duration_days", 0); durationDays > 0 {
		t := time.Now().Add(time.Duration(durationDays) * 24 * time.Hour)
		endsAt = &t
	}

	// ── Insert — pointer for Status so GORM always writes it in INSERT ────────
	dp := models.DropProduct{
		DropID:    drop.ID,
		ProductID: req.ProductID,
		Status:    &dpStatus,
		EndsAt:    endsAt,
	}
	if err := database.DB.Create(&dp).Error; err != nil {
		utils.InternalError(c, "Failed to add product to drop")
		return
	}

	utils.Created(c, "Product added to drop", gin.H{
		"drop_id":    drop.ID,
		"product_id": req.ProductID,
		"status":     dpStatus,
		"ends_at":    endsAt,
	})
}

// ── DELETE /api/brand/drop/:dropId/products/:productId ───────────────────────
// Soft-removes a product by setting status = "ended" and recording ends_at.
func BrandRemoveProductFromDrop(c *gin.Context) {
	userID := c.GetUint("userID")

	dropID, err := strconv.ParseUint(c.Param("dropId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid drop ID", nil)
		return
	}
	productID, err := strconv.ParseUint(c.Param("productId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid product ID", nil)
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	// Confirm the drop belongs to this brand
	var drop models.Drop
	if err := database.DB.
		Where("id = ? AND brand_id = ? AND deleted_at IS NULL", dropID, brand.ID).
		First(&drop).Error; err != nil {
		utils.NotFound(c, "Drop not found")
		return
	}

	// Find the active drop_products row
	var dp models.DropProduct
	if err := database.DB.
		Where("drop_id = ? AND product_id = ? AND status != ?", dropID, productID, models.DropEnded).
		First(&dp).Error; err != nil {
		utils.NotFound(c, "Product not in drop")
		return
	}

	// Soft-remove: set status = ended, record ends_at
	now := time.Now()
	ended := models.DropEnded
	database.DB.Model(&dp).Updates(map[string]interface{}{
		"status":  &ended,
		"ends_at": now,
	})

	utils.OK(c, "Product removed from drop", gin.H{
		"drop_id":    dropID,
		"product_id": productID,
		"status":     models.DropEnded,
		"ends_at":    now,
	})
}