package handlers

import (
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// POST /api/admin/drops
func AdminCreateDrop(c *gin.Context) {
	var req struct {
		BrandID     uint       `json:"brand_id"    binding:"required"`
		Name        string     `json:"name"        binding:"required"`
		DropAt      *time.Time `json:"drop_at"`
		EndsAt      *time.Time `json:"ends_at"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "brand_id and name are required", nil)
		return
	}

	// Look up the brand to get the UserID
	var brand models.Brand
	if err := database.DB.First(&brand, req.BrandID).Error; err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	slug := utils.Slugify(req.Name)
	// Ensure slug uniqueness
	var count int64
	base := slug
	for i := 1; ; i++ {
		database.DB.Model(&models.Drop{}).Where("slug = ?", slug).Count(&count)
		if count == 0 {
			break
		}
		slug = base + "-" + strings.Repeat("x", i) // increment suffix
	}

	drop := models.Drop{
		BrandID: req.BrandID,
		UserID:  brand.UserID,
		Name:    req.Name,
		Slug:    slug,
		DropAt:  req.DropAt,
		EndsAt:  req.EndsAt,
	}

	if err := database.DB.Create(&drop).Error; err != nil {
		utils.InternalError(c, "Failed to create drop")
		return
	}

	utils.Created(c, "Drop created", drop)
}