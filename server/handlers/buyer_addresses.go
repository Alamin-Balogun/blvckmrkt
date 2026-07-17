package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/buyer/addresses ──────────────────────────────────────────────────
func ListAddresses(c *gin.Context) {
	userID := c.GetUint("userID")
	var addresses []models.Address
	database.DB.Where("user_id = ?", userID).Order("is_default DESC, created_at ASC").Find(&addresses)

	resp := make([]models.AddressResponse, len(addresses))
	for i, a := range addresses { resp[i] = a.ToResponse() }
	utils.OK(c, "Addresses fetched", resp)
}

// ── POST /api/buyer/addresses ─────────────────────────────────────────────────
func CreateAddress(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		Label     string `json:"label"   binding:"required"`
		Line1     string `json:"line1"   binding:"required"`
		Line2     string `json:"line2"`
		City      string `json:"city"    binding:"required"`
		State     string `json:"state"`
		Postcode  string `json:"postcode"`
		Country   string `json:"country" binding:"required"`
		IsDefault bool   `json:"is_default"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Label, line1, city and country are required", nil)
		return
	}

	// If marking as default, clear existing default first
	if req.IsDefault {
		database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	// If this is the first address, make it default automatically
	var count int64
	database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Count(&count)
	if count == 0 { req.IsDefault = true }

	addr := models.Address{
		UserID:    &userID,
		Label:     req.Label,
		Line1:     req.Line1,
		Line2:     req.Line2,
		City:      req.City,
		State:     req.State,
		Postcode:  req.Postcode,
		Country:   req.Country,
		IsDefault: req.IsDefault,
	}
	if err := database.DB.Create(&addr).Error; err != nil {
		utils.InternalError(c, "Failed to save address")
		return
	}
	utils.Created(c, "Address saved", addr.ToResponse())
}

// ── PUT /api/buyer/addresses/:id ─────────────────────────────────────────────
func UpdateAddress(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid address ID", nil); return }

	var addr models.Address
	if res := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&addr); res.Error != nil {
		utils.NotFound(c, "Address not found")
		return
	}

	var req struct {
		Label     string `json:"label"`
		Line1     string `json:"line1"`
		Line2     string `json:"line2"`
		City      string `json:"city"`
		State     string `json:"state"`
		Postcode  string `json:"postcode"`
		Country   string `json:"country"`
		IsDefault bool   `json:"is_default"`
	}
	c.ShouldBindJSON(&req)

	if req.IsDefault && !addr.IsDefault {
		database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	updates := map[string]interface{}{}
	if req.Label    != "" { updates["label"]    = req.Label    }
	if req.Line1    != "" { updates["line1"]    = req.Line1    }
	updates["line2"]    = req.Line2
	if req.City     != "" { updates["city"]     = req.City     }
	updates["state"]    = req.State
	updates["postcode"] = req.Postcode
	if req.Country  != "" { updates["country"]  = req.Country  }
	updates["is_default"] = req.IsDefault

	database.DB.Model(&addr).Updates(updates)
	utils.OK(c, "Address updated", addr.ToResponse())
}

// ── DELETE /api/buyer/addresses/:id ──────────────────────────────────────────
func DeleteAddress(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid address ID", nil); return }

	var addr models.Address
	if res := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&addr); res.Error != nil {
		utils.NotFound(c, "Address not found")
		return
	}

	database.DB.Delete(&addr)

	// If deleted was default, promote the oldest remaining address
	if addr.IsDefault {
		var next models.Address
		if res := database.DB.Where("user_id = ?", userID).Order("created_at ASC").First(&next); res.Error == nil {
			database.DB.Model(&next).Update("is_default", true)
		}
	}

	utils.OK(c, "Address deleted", nil)
}

// ── PATCH /api/buyer/addresses/:id/default ────────────────────────────────────
func SetDefaultAddress(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid address ID", nil); return }

	var addr models.Address
	if res := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&addr); res.Error != nil {
		utils.NotFound(c, "Address not found")
		return
	}

	database.DB.Model(&models.Address{}).Where("user_id = ?", userID).Update("is_default", false)
	database.DB.Model(&addr).Update("is_default", true)
	utils.OK(c, "Default address updated", addr.ToResponse())
}