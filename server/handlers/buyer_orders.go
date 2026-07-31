package handlers

import (
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// OrderCancelWindow is how long after placing an order a buyer or brand may
// still cancel it — after this it's assumed to be too far into fulfillment.
const OrderCancelWindow = 72 * time.Hour

// canCancelOrder is the single source of truth for cancel eligibility —
// used both to gate the actual cancel action and to tell the frontend
// upfront (via OrderResponse.CanCancel) whether to show the button at all.
func canCancelOrder(o models.Order) bool {
	if o.Status != models.OrderPending && o.Status != models.OrderProcessing {
		return false
	}
	return time.Since(o.CreatedAt) <= OrderCancelWindow
}

// DeliveryStatusInfo is the buyer-facing view of one brand's courier
// shipment within an order — an order can have one of these per brand.
type DeliveryStatusInfo struct {
	BrandID     uint       `json:"brand_id"`
	CompanyName string     `json:"company_name,omitempty"`
	Status      string     `json:"status"` // quoted | booked | picked | delivered | cancelled | failed
	TrackingID  string     `json:"tracking_id,omitempty"`
	PickedUpAt  *time.Time `json:"picked_up_at,omitempty"`
	DeliveredAt *time.Time `json:"delivered_at,omitempty"`
}

func buildDeliveryStatus(rows []models.OrderDellymanDelivery) []DeliveryStatusInfo {
	out := make([]DeliveryStatusInfo, len(rows))
	for i, r := range rows {
		out[i] = DeliveryStatusInfo{
			BrandID: r.BrandID, CompanyName: r.CompanyName, Status: string(r.Status),
			TrackingID: r.TrackingID, PickedUpAt: r.PickedUpAt, DeliveredAt: r.DeliveredAt,
		}
	}
	return out
}

type OrderResponse struct {
	ID             uint                    `json:"id"`
	DisplayID      string                  `json:"display_id"`
	Status         models.OrderStatus      `json:"status"`
	PaymentStatus  models.PaymentStatus    `json:"payment_status"`
	Subtotal       float64                 `json:"subtotal"`
	ShippingFee    float64                 `json:"shipping_fee"`
	Total          float64                 `json:"total"`
	Address        *models.AddressResponse `json:"address,omitempty"`
	Items          []models.OrderItem      `json:"items"`
	DeliveryStatus []DeliveryStatusInfo    `json:"delivery_status,omitempty"`
	CanCancel      bool                    `json:"can_cancel"`
	CreatedAt      string                  `json:"created_at"`
}

// ── GET /api/buyer/orders ─────────────────────────────────────────────────────
func ListOrders(c *gin.Context) {
	userID := c.GetUint("userID")

	var orders []models.Order
	database.DB.
		Where("user_id = ?", userID).
		Preload("Items").
		Preload("DellymanDeliveries").
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
			ID:             o.ID,
			DisplayID:      o.DisplayID,
			Status:         o.Status,
			PaymentStatus:  o.PaymentStatus,
			Subtotal:       o.Subtotal,
			ShippingFee:    o.ShippingFee,
			Total:          o.Total,
			Items:          o.Items,
			DeliveryStatus: buildDeliveryStatus(o.DellymanDeliveries),
			CanCancel:      canCancelOrder(o),
			CreatedAt:      o.CreatedAt.Format("Jan 2, 2006"),
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
		Preload("DellymanDeliveries").
		First(&order); res.Error != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	r := OrderResponse{
		ID: order.ID, DisplayID: order.DisplayID,
		Status: order.Status, PaymentStatus: order.PaymentStatus,
		Subtotal: order.Subtotal, ShippingFee: order.ShippingFee, Total: order.Total,
		Items: order.Items, DeliveryStatus: buildDeliveryStatus(order.DellymanDeliveries),
		CanCancel: canCancelOrder(order), CreatedAt: order.CreatedAt.Format("Jan 2, 2006"),
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

	if !canCancelOrder(order) {
		if order.Status != models.OrderPending && order.Status != models.OrderProcessing {
			utils.BadRequest(c, "Only pending or processing orders can be cancelled", nil)
		} else {
			utils.BadRequest(c, "This order was placed more than 3 days ago and can no longer be cancelled", nil)
		}
		return
	}

	database.DB.Model(&order).Update("status", models.OrderCancelled)
	cancelDellymanDeliveriesForOrder(order.ID)
	utils.OK(c, "Order cancelled", nil)
}
