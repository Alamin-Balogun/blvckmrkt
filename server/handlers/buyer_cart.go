package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

type CartItemResponse struct {
	ID            uint            `json:"id"`
	ProductID     uint            `json:"product_id"`
	ProductSizeID *uint           `json:"product_size_id,omitempty"`
	Quantity      int             `json:"quantity"`
	Product       *ProductSummary `json:"product,omitempty"`
	SelectedSize  string          `json:"selected_size,omitempty"`
	LineTotal     float64         `json:"line_total"`
}

// ── GET /api/buyer/cart ───────────────────────────────────────────────────────
func GetCart(c *gin.Context) {
	userID := c.GetUint("userID")

	var items []models.CartItem
	database.DB.Where("user_id = ?", userID).Find(&items)

	productIDs := make([]uint, len(items))
	for i, item := range items { productIDs[i] = item.ProductID }
	productMap := fetchProductSummaries(productIDs)

	// Fetch size names
	sizeIDs := []uint{}
	for _, item := range items {
		if item.ProductSizeID != nil { sizeIDs = append(sizeIDs, *item.ProductSizeID) }
	}
	sizeMap := map[uint]string{}
	if len(sizeIDs) > 0 {
		var sizes []models.ProductSize
		database.DB.Where("id IN ?", sizeIDs).Find(&sizes)
		for _, s := range sizes { sizeMap[s.ID] = s.Size }
	}

	resp := make([]CartItemResponse, len(items))
	cartTotal := 0.0
	for i, item := range items {
		r := CartItemResponse{
			ID: item.ID, ProductID: item.ProductID,
			ProductSizeID: item.ProductSizeID, Quantity: item.Quantity,
		}
		if p, ok := productMap[item.ProductID]; ok {
			r.Product   = &p
			r.LineTotal  = p.Price * float64(item.Quantity)
			cartTotal   += r.LineTotal
		}
		if item.ProductSizeID != nil {
			if sz, ok := sizeMap[*item.ProductSizeID]; ok { r.SelectedSize = sz }
		}
		resp[i] = r
	}

	utils.OK(c, "Cart fetched", gin.H{"items": resp, "total": cartTotal, "count": len(items)})
}

// ── POST /api/buyer/cart ──────────────────────────────────────────────────────
func AddToCart(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		ProductID     uint  `json:"product_id"      binding:"required"`
		ProductSizeID *uint `json:"product_size_id"`
		Quantity      int   `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "product_id is required", nil)
		return
	}
	if req.Quantity < 1 { req.Quantity = 1 }

	// Validate product exists and is active
	var product models.Product
	if res := database.DB.Where("id = ? AND status = ?", req.ProductID, models.ProductActive).First(&product); res.Error != nil {
		utils.NotFound(c, "Product not found or unavailable")
		return
	}

	// Validate size if provided, and check stock
	if req.ProductSizeID != nil {
		var sz models.ProductSize
		if res := database.DB.Where("id = ? AND product_id = ?", *req.ProductSizeID, req.ProductID).First(&sz); res.Error != nil {
			utils.BadRequest(c, "Invalid size for this product", nil)
			return
		}
		if sz.Stock < req.Quantity {
			utils.BadRequest(c, "Insufficient stock for selected size", nil)
			return
		}
	}

	// If same product+size already in cart, increment quantity
	var existing models.CartItem
	q := database.DB.Where("user_id = ? AND product_id = ?", userID, req.ProductID)
	if req.ProductSizeID != nil {
		q = q.Where("product_size_id = ?", *req.ProductSizeID)
	} else {
		q = q.Where("product_size_id IS NULL")
	}
	if res := q.First(&existing); res.Error == nil {
		newQty := existing.Quantity + req.Quantity
		database.DB.Model(&existing).Update("quantity", newQty)
		utils.OK(c, "Cart updated", existing)
		return
	}

	item := models.CartItem{
		UserID: userID, ProductID: req.ProductID,
		ProductSizeID: req.ProductSizeID, Quantity: req.Quantity,
	}
	database.DB.Create(&item)
	utils.Created(c, "Added to cart", item)
}

// ── PUT /api/buyer/cart/:id ───────────────────────────────────────────────────
func UpdateCartItem(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid cart item ID", nil); return }

	var req struct {
		Quantity int `json:"quantity" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "quantity must be at least 1", nil)
		return
	}

	var item models.CartItem
	if res := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&item); res.Error != nil {
		utils.NotFound(c, "Cart item not found")
		return
	}

	database.DB.Model(&item).Update("quantity", req.Quantity)
	utils.OK(c, "Cart item updated", item)
}

// ── DELETE /api/buyer/cart/:id ────────────────────────────────────────────────
func RemoveFromCart(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid cart item ID", nil); return }

	res := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.CartItem{})
	if res.RowsAffected == 0 { utils.NotFound(c, "Cart item not found"); return }
	utils.OK(c, "Item removed from cart", nil)
}

// ── DELETE /api/buyer/cart ────────────────────────────────────────────────────
func ClearCart(c *gin.Context) {
	userID := c.GetUint("userID")
	database.DB.Where("user_id = ?", userID).Delete(&models.CartItem{})
	utils.OK(c, "Cart cleared", nil)
}