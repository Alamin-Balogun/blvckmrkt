package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// vaultToken is a stateless proof that a given product was unlocked with the
// right access code — an HMAC over the product ID keyed by the app's
// existing JWT secret, so no new secret or DB table is needed to track
// unlocks. Anyone holding the token can prove they unlocked that exact
// product (and only that product); it never expires, matching "real" access
// once granted rather than a one-time reveal.
func vaultToken(productID uint) string {
	mac := hmac.New(sha256.New, []byte(config.App.JWTSecret))
	mac.Write([]byte("vault:" + strconv.FormatUint(uint64(productID), 10)))
	return hex.EncodeToString(mac.Sum(nil))
}

func vaultTokenValid(productID uint, token string) bool {
	if token == "" {
		return false
	}
	return hmac.Equal([]byte(token), []byte(vaultToken(productID)))
}

// ── POST /api/shop/vault/unlock ───────────────────────────────────────────────
// Checks the submitted code against the product's stored bcrypt hash. On
// success returns an unlock token the client stores and resubmits (as
// ?vault_token=) whenever it needs the real product detail — GetProduct
// enforces the same check server-side, so this isn't just a UI gate.
func VaultUnlock(c *gin.Context) {
	var req struct {
		ProductID uint   `json:"product_id" binding:"required"`
		Code      string `json:"code"       binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "product_id and code are required", nil)
		return
	}

	var product models.Product
	if err := database.DB.
		Where("id = ? AND status = ? AND deleted_at IS NULL", req.ProductID, models.ProductActive).
		First(&product).Error; err != nil {
		utils.NotFound(c, "Product not found")
		return
	}
	if !product.IsVault || product.VaultCodeHash == "" {
		utils.BadRequest(c, "This item isn't a Vault item", nil)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(product.VaultCodeHash), []byte(req.Code)) != nil {
		utils.BadRequest(c, "Incorrect access code", nil)
		return
	}

	utils.OK(c, "Vault unlocked", gin.H{
		"unlock_token": vaultToken(product.ID),
		"product_id":   product.ID,
		"slug":         product.Slug,
	})
}
