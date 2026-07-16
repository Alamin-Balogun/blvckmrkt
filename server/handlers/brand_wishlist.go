package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/brand/wishlist ───────────────────────────────────────────────────
func BrandListWishlist(c *gin.Context) {
	userID := c.GetUint("userID")

	var items []models.WishlistItem
	database.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&items)

	productIDs := make([]uint, len(items))
	for i, item := range items {
		productIDs[i] = item.ProductID
	}

	productMap := fetchProductSummaries(productIDs)

	resp := make([]WishlistItemResponse, len(items))
	for i, item := range items {
		r := WishlistItemResponse{
			ID:        item.ID,
			ProductID: item.ProductID,
			CreatedAt: item.CreatedAt.Format("Jan 2, 2006"),
		}
		if p, ok := productMap[item.ProductID]; ok {
			r.Product = &p
		}
		resp[i] = r
	}
	utils.OK(c, "Wishlist fetched", resp)
}

// ── POST /api/brand/wishlist ──────────────────────────────────────────────────
func BrandAddToWishlist(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		ProductID uint `json:"product_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "product_id is required", nil)
		return
	}

	// Check product exists
	var product models.Product
	if res := database.DB.First(&product, req.ProductID); res.Error != nil {
		utils.NotFound(c, "Product not found")
		return
	}

	// Check not already wishlisted
	var existing models.WishlistItem
	if res := database.DB.Where("user_id = ? AND product_id = ?", userID, req.ProductID).First(&existing); res.Error == nil {
		utils.Conflict(c, "Product is already in your wishlist")
		return
	}

	item := models.WishlistItem{UserID: userID, ProductID: req.ProductID}
	database.DB.Create(&item)
	utils.Created(c, "Added to wishlist", item)
}

// ── DELETE /api/brand/wishlist/:productId ────────────────────────────────────
func BrandRemoveFromWishlist(c *gin.Context) {
	userID := c.GetUint("userID")
	productID, err := strconv.ParseUint(c.Param("productId"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid product ID", nil)
		return
	}

	res := database.DB.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&models.WishlistItem{})
	if res.RowsAffected == 0 {
		utils.NotFound(c, "Item not found in wishlist")
		return
	}
	utils.OK(c, "Removed from wishlist", nil)
}