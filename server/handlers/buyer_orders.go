package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

type OrderResponse struct {
	ID            uint                  `json:"id"`
	DisplayID     string                `json:"display_id"`
	Status        models.OrderStatus    `json:"status"`
	PaymentStatus models.PaymentStatus  `json:"payment_status"`
	Subtotal      float64               `json:"subtotal"`
	ShippingFee   float64               `json:"shipping_fee"`
	Total         float64               `json:"total"`
	Address       *models.AddressResponse `json:"address,omitempty"`
	Items         []models.OrderItem    `json:"items"`
	CreatedAt     string                `json:"created_at"`
}

// ── GET /api/buyer/orders ─────────────────────────────────────────────────────
func ListOrders(c *gin.Context) {
	userID := c.GetUint("userID")

	var orders []models.Order
	database.DB.
		Where("user_id = ?", userID).
		Preload("Items").
		Order("created_at DESC").
		Find(&orders)

	// Collect address IDs to batch-fetch
	addrIDs := map[uint]bool{}
	for _, o := range orders {
		if o.AddressID != nil { addrIDs[*o.AddressID] = true }
	}
	addrMap := map[uint]models.Address{}
	if len(addrIDs) > 0 {
		ids := make([]uint, 0, len(addrIDs))
		for id := range addrIDs { ids = append(ids, id) }
		var addrs []models.Address
		database.DB.Where("id IN ?", ids).Find(&addrs)
		for _, a := range addrs { addrMap[a.ID] = a }
	}

	resp := make([]OrderResponse, len(orders))
	for i, o := range orders {
		r := OrderResponse{
			ID:            o.ID,
			DisplayID:     o.DisplayID,
			Status:        o.Status,
			PaymentStatus: o.PaymentStatus,
			Subtotal:      o.Subtotal,
			ShippingFee:   o.ShippingFee,
			Total:         o.Total,
			Items:         o.Items,
			CreatedAt:     o.CreatedAt.Format("Jan 2, 2006"),
		}
		if o.AddressID != nil {
			if a, ok := addrMap[*o.AddressID]; ok {
				ar := a.ToResponse()
				r.Address = &ar
			}
		}
		resp[i] = r
	}
	utils.OK(c, "Orders fetched", resp)
}

// ── GET /api/buyer/orders/:id ─────────────────────────────────────────────────
func GetOrder(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid order ID", nil); return }

	var order models.Order
	if res := database.DB.
		Where("id = ? AND user_id = ?", id, userID).
		Preload("Items").
		First(&order); res.Error != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	r := OrderResponse{
		ID: order.ID, DisplayID: order.DisplayID,
		Status: order.Status, PaymentStatus: order.PaymentStatus,
		Subtotal: order.Subtotal, ShippingFee: order.ShippingFee, Total: order.Total,
		Items: order.Items, CreatedAt: order.CreatedAt.Format("Jan 2, 2006"),
	}
	if order.AddressID != nil {
		var addr models.Address
		if res := database.DB.First(&addr, *order.AddressID); res.Error == nil {
			ar := addr.ToResponse()
			r.Address = &ar
		}
	}
	utils.OK(c, "Order fetched", r)
}

// ── POST /api/buyer/orders/:id/cancel ────────────────────────────────────────
func CancelOrder(c *gin.Context) {
	userID := c.GetUint("userID")
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil { utils.BadRequest(c, "Invalid order ID", nil); return }

	var order models.Order
	if res := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&order); res.Error != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	// Only pending orders can be cancelled
	if order.Status != models.OrderPending && order.Status != models.OrderProcessing {
		utils.BadRequest(c, "Only pending or processing orders can be cancelled", nil)
		return
	}

	database.DB.Model(&order).Update("status", models.OrderCancelled)
	utils.OK(c, "Order cancelled", nil)
}