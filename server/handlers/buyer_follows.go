package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/buyer/follows ────────────────────────────────────────────────────
func ListFollows(c *gin.Context) {
	userID := c.GetUint("userID")

	var follows []models.BrandFollow
	database.DB.Where("user_id = ?", userID).Find(&follows)

	brandIDs := make([]uint, len(follows))
	for i, f := range follows { brandIDs[i] = f.BrandID }

	var brands []models.Brand
	database.DB.Where("id IN ?", brandIDs).
		Select("id, display_id, brand_name, slug, bio, logo_url").Find(&brands)

	utils.OK(c, "Following fetched", gin.H{
		"brands": brands,
		"count":  len(brands),
	})
}

// ── POST /api/buyer/follows ───────────────────────────────────────────────────
func FollowBrand(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		BrandID uint `json:"brand_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "brand_id is required", nil)
		return
	}

	var brand models.Brand
	if res := database.DB.First(&brand, req.BrandID); res.Error != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var existing models.BrandFollow
	if res := database.DB.Where("user_id = ? AND brand_id = ?", userID, req.BrandID).First(&existing); res.Error == nil {
		utils.Conflict(c, "You are already following this brand")
		return
	}

	follow := models.BrandFollow{UserID: userID, BrandID: req.BrandID}
	database.DB.Create(&follow)
	utils.Created(c, "Now following "+brand.BrandName, follow)
}

// ── DELETE /api/buyer/follows/:brandId ───────────────────────────────────────
func UnfollowBrand(c *gin.Context) {
	userID := c.GetUint("userID")
	brandID, err := strconv.ParseUint(c.Param("brandId"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid brand ID", nil); return }

	res := database.DB.Where("user_id = ? AND brand_id = ?", userID, brandID).Delete(&models.BrandFollow{})
	if res.RowsAffected == 0 { utils.NotFound(c, "Follow not found"); return }
	utils.OK(c, "Unfollowed brand", nil)
}