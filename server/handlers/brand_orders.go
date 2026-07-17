package handlers

import (
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── BrandOrderResponse ────────────────────────────────────────────────────────
type BrandOrderResponse struct {
	OrderID         uint                 `json:"order_id"`
	DisplayID       string               `json:"display_id"`
	Status          models.OrderStatus   `json:"status"`
	PaymentStatus   models.PaymentStatus `json:"payment_status"`
	CreatedAt       string               `json:"created_at"`
	BuyerName       string               `json:"buyer_name"`
	BuyerEmail      string               `json:"buyer_email"`
	Items           []models.OrderItem   `json:"items"`
	BrandTotal      float64              `json:"brand_total"`
	DeliveryType    string               `json:"delivery_type"`
	DeliveryAddress *DeliveryAddressInfo `json:"delivery_address,omitempty"`
	PickupInfo      *PickupInfo          `json:"pickup_info,omitempty"`
	BuyerPhone      string               `json:"buyer_phone,omitempty"`
	ContactPhone    string               `json:"contact_phone,omitempty"`
	ContactEmail    string               `json:"contact_email,omitempty"`
	PayoutStatus    string               `json:"payout_status,omitempty"`
	PayoutAmount    float64              `json:"payout_amount,omitempty"`
	PayoutRef       string               `json:"payout_ref,omitempty"`
}

type DeliveryAddressInfo struct {
	Country    string `json:"country"`
	State      string `json:"state"`
	City       string `json:"city"`
	MethodName string `json:"method_name"`
	MinDays    *int   `json:"min_days,omitempty"`
	MaxDays    *int   `json:"max_days,omitempty"`
}

type PickupInfo struct {
	Name         string `json:"name"`
	Address      string `json:"address"`
	City         string `json:"city"`
	State        string `json:"state"`
	Country      string `json:"country"`
	Phone        string `json:"phone,omitempty"`
	Instructions string `json:"instructions,omitempty"`
}

// ── MyOrderResponse ───────────────────────────────────────────────────────────
type MyOrderResponse struct {
	ID            uint                    `json:"id"`
	DisplayID     string                  `json:"display_id"`
	Status        models.OrderStatus      `json:"status"`
	PaymentStatus models.PaymentStatus    `json:"payment_status"`
	PaymentMethod string                  `json:"payment_method"`
	Subtotal      float64                 `json:"subtotal"`
	ShippingFee   float64                 `json:"shipping_fee"`
	Total         float64                 `json:"total"`
	ContactEmail  string                  `json:"contact_email"`
	ContactPhone  string                  `json:"contact_phone"`
	Notes         string                  `json:"notes"`
	CreatedAt     string                  `json:"created_at"`
	Items         []models.OrderItem      `json:"items"`
	Address       *models.AddressResponse `json:"address,omitempty"`
	DeliveryType  string                  `json:"delivery_type,omitempty"`
}

// ── GET /api/brand/orders ─────────────────────────────────────────────────────
func BrandListOrders(c *gin.Context) {
	userID := c.GetUint("userID")

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var orderIDs []uint
	q := database.DB.Model(&models.OrderItem{}).
		Select("DISTINCT order_id").
		Where("brand_id = ?", brand.ID)

	if status := c.Query("status"); status != "" {
		q = q.Joins("JOIN orders ON orders.id = order_items.order_id").
			Where("orders.status = ?", status)
	}

	q.Pluck("order_id", &orderIDs)

	if len(orderIDs) == 0 {
		utils.OK(c, "Orders fetched", gin.H{
			"orders": []interface{}{},
			"total":  0,
			"page":   page,
			"limit":  limit,
		})
		return
	}

	total := len(orderIDs)

	start := offset
	end := offset + limit
	if start > len(orderIDs) {
		start = len(orderIDs)
	}
	if end > len(orderIDs) {
		end = len(orderIDs)
	}
	pagedIDs := orderIDs[start:end]

	var orders []models.Order
	database.DB.
		Where("id IN ?", pagedIDs).
		Order("created_at DESC").
		Find(&orders)

	// Force-load delivery_type via raw SQL — GORM enum scanning unreliable on MariaDB
	type RawDelivery struct {
		ID           uint
		DeliveryType string
	}
	var rawDeliveries []RawDelivery
	database.DB.Raw("SELECT id, delivery_type FROM orders WHERE id IN (?)", pagedIDs).Scan(&rawDeliveries)
	deliveryTypeMap := map[uint]string{}
	for _, r := range rawDeliveries {
		deliveryTypeMap[r.ID] = r.DeliveryType
	}

	var allItems []models.OrderItem
	database.DB.
		Where("order_id IN ? AND brand_id = ?", pagedIDs, brand.ID).
		Find(&allItems)

	itemMap := map[uint][]models.OrderItem{}
	for _, item := range allItems {
		itemMap[item.OrderID] = append(itemMap[item.OrderID], item)
	}

	// Fetch delivery details
	var pickups []models.OrderPickup
	database.DB.Where("order_id IN ?", pagedIDs).Find(&pickups)
	pickupMap := map[uint]models.OrderPickup{}
	for _, p := range pickups {
		pickupMap[p.OrderID] = p
	}

	var zoneDeliveries []models.OrderZoneDelivery
	database.DB.Where("order_id IN ?", pagedIDs).Find(&zoneDeliveries)
	zoneMap := map[uint]models.OrderZoneDelivery{}
	for _, z := range zoneDeliveries {
		zoneMap[z.OrderID] = z
	}

	var localDeliveries []models.OrderLocalDelivery
	database.DB.Where("order_id IN ?", pagedIDs).Find(&localDeliveries)
	localMap := map[uint]models.OrderLocalDelivery{}
	for _, l := range localDeliveries {
		localMap[l.OrderID] = l
	}

	var userIDs []uint
	for _, o := range orders {
		if o.UserID != nil {
			userIDs = append(userIDs, *o.UserID)
		}
	}
	var buyers []models.User
	if len(userIDs) > 0 {
		database.DB.Select("id, first_name, last_name, email").
			Where("id IN ?", userIDs).Find(&buyers)
	}
	buyerMap := map[uint]models.User{}
	for _, b := range buyers {
		buyerMap[b.ID] = b
	}

	// Fetch payouts for these orders for this brand
	type PayoutSummary struct {
		OrderID   uint
		Status    string
		Amount    float64
		Reference string
	}
	var payouts []PayoutSummary
	database.DB.Table("brand_payouts").
		Select("order_id, status, amount, reference").
		Where("brand_id = ? AND order_id IN ? AND deleted_at IS NULL", brand.ID, pagedIDs).
		Order("created_at DESC").
		Scan(&payouts)

	payoutMap := map[uint]PayoutSummary{}
	priority := map[string]int{"completed": 4, "processing": 3, "pending": 2, "failed": 1}
	for _, p := range payouts {
		if existing, ok := payoutMap[p.OrderID]; !ok || priority[p.Status] > priority[existing.Status] {
			payoutMap[p.OrderID] = p
		}
	}

	result := make([]BrandOrderResponse, 0, len(orders))
	for _, o := range orders {
		items := itemMap[o.ID]
		var brandTotal float64
		for _, it := range items {
			brandTotal += it.TotalPrice
		}
		buyerName, buyerEmail := "Guest", o.ContactEmail
		if o.UserID != nil {
			if buyer, ok := buyerMap[*o.UserID]; ok {
				buyerName = buyer.FirstName + " " + buyer.LastName
				buyerEmail = buyer.Email
			}
		}

		row := BrandOrderResponse{
			OrderID:       o.ID,
			DisplayID:     o.DisplayID,
			Status:        o.Status,
			PaymentStatus: o.PaymentStatus,
			CreatedAt:     o.CreatedAt.Format("Jan 02, 2006"),
			BuyerName:     buyerName,
			BuyerEmail:    buyerEmail,
			Items:         items,
			BrandTotal:    brandTotal,
			DeliveryType:  deliveryTypeMap[o.ID],
			ContactPhone:  o.ContactPhone,
			ContactEmail:  o.ContactEmail,
		}

		switch deliveryTypeMap[o.ID] {
		case "pickup":
			if p, ok := pickupMap[o.ID]; ok {
				row.PickupInfo = &PickupInfo{
					Name:         p.Name,
					Address:      p.Address,
					City:         p.City,
					State:        p.State,
					Country:      p.Country,
					Phone:        p.Phone,
					Instructions: p.Instructions,
				}
			}
		case "zone":
			if z, ok := zoneMap[o.ID]; ok {
				row.DeliveryAddress = &DeliveryAddressInfo{
					Country:    z.LocationCountry,
					State:      z.LocationState,
					MethodName: z.MethodName,
					MinDays:    z.MinDays,
					MaxDays:    z.MaxDays,
				}
			}
		case "local":
			if l, ok := localMap[o.ID]; ok {
				row.DeliveryAddress = &DeliveryAddressInfo{
					Country: l.Country,
					State:   l.State,
					City:    l.City,
				}
			}
		}

		if p, ok := payoutMap[o.ID]; ok {
			row.PayoutStatus = p.Status
			row.PayoutAmount = p.Amount
			row.PayoutRef = p.Reference
		}
		result = append(result, row)
	}

	utils.OK(c, "Orders fetched", gin.H{
		"orders": result,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// ── GET /api/brand/orders/:id ─────────────────────────────────────────────────
func BrandGetOrder(c *gin.Context) {
	userID := c.GetUint("userID")
	orderID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var count int64
	database.DB.Model(&models.OrderItem{}).
		Where("order_id = ? AND brand_id = ?", orderID, brand.ID).
		Count(&count)
	if count == 0 {
		utils.NotFound(c, "Order not found")
		return
	}

	var order models.Order
	if err := database.DB.First(&order, orderID).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	var items []models.OrderItem
	database.DB.Where("order_id = ? AND brand_id = ?", orderID, brand.ID).Find(&items)

	buyerName, buyerEmail := "Guest", order.ContactEmail
	if order.UserID != nil {
		var buyer models.User
		if database.DB.Select("id, first_name, last_name, email").First(&buyer, *order.UserID).Error == nil {
			buyerName = buyer.FirstName + " " + buyer.LastName
			buyerEmail = buyer.Email
		}
	}

	var address *models.Address
	if order.AddressID != nil {
		var addr models.Address
		if database.DB.First(&addr, *order.AddressID).Error == nil {
			address = &addr
		}
	}

	var brandTotal float64
	for _, it := range items {
		brandTotal += it.TotalPrice
	}

	utils.OK(c, "Order fetched", gin.H{
		"order_id":       order.ID,
		"display_id":     order.DisplayID,
		"status":         order.Status,
		"payment_status": order.PaymentStatus,
		"created_at":     order.CreatedAt.Format("Jan 02, 2006"),
		"buyer_name":     buyerName,
		"buyer_email":    buyerEmail,
		"address":        address,
		"items":          items,
		"brand_total":    brandTotal,
		"notes":          order.Notes,
	})
}

// ── PATCH /api/brand/orders/:id/status ───────────────────────────────────────
func BrandUpdateOrderStatus(c *gin.Context) {
	userID := c.GetUint("userID")
	orderID, _ := strconv.ParseUint(c.Param("id"), 10, 64)

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var count int64
	database.DB.Model(&models.OrderItem{}).
		Where("order_id = ? AND brand_id = ?", orderID, brand.ID).
		Count(&count)
	if count == 0 {
		utils.NotFound(c, "Order not found")
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "status is required", nil)
		return
	}

	allowed := map[string]bool{
		"processing": true,
		"shipped":    true,
		"delivered":  true,
	}
	if !allowed[req.Status] {
		utils.BadRequest(c, "Brands can set status to: processing, shipped, or delivered", nil)
		return
	}

	if err := database.DB.Model(&models.Order{}).
		Where("id = ?", orderID).
		Update("status", req.Status).Error; err != nil {
		utils.InternalError(c, "Failed to update order status")
		return
	}

	utils.OK(c, "Order status updated", gin.H{"order_id": orderID, "status": req.Status})
}

// ── GET /api/brand/my-orders ──────────────────────────────────────────────────
// Orders placed BY the brand account (shopping as a buyer).
func BrandGetMyOrders(c *gin.Context) {
	userID := c.GetUint("userID")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	q := database.DB.Model(&models.Order{}).Where("user_id = ? AND deleted_at IS NULL", userID)

	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	var orders []models.Order
	q.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&orders)

	if len(orders) == 0 {
		utils.OK(c, "Orders fetched", gin.H{
			"orders": []interface{}{},
			"total":  0,
			"page":   page,
			"limit":  limit,
		})
		return
	}

	orderIDs := make([]uint, len(orders))
	for i, o := range orders {
		orderIDs[i] = o.ID
	}

	// Collect address IDs
	addrIDs := map[uint]bool{}
	for _, o := range orders {
		if o.AddressID != nil {
			addrIDs[*o.AddressID] = true
		}
	}
	addrMap := map[uint]models.Address{}
	if len(addrIDs) > 0 {
		ids := make([]uint, 0, len(addrIDs))
		for id := range addrIDs {
			ids = append(ids, id)
		}
		var addrs []models.Address
		database.DB.Where("id IN ?", ids).Find(&addrs)
		for _, a := range addrs {
			addrMap[a.ID] = a
		}
	}

	var allItems []models.OrderItem
	database.DB.Where("order_id IN ?", orderIDs).Find(&allItems)

	itemMap := map[uint][]models.OrderItem{}
	for _, item := range allItems {
		itemMap[item.OrderID] = append(itemMap[item.OrderID], item)
	}

	result := make([]MyOrderResponse, 0, len(orders))
	for _, o := range orders {
		row := MyOrderResponse{
			ID:            o.ID,
			DisplayID:     o.DisplayID,
			Status:        o.Status,
			PaymentStatus: o.PaymentStatus,
			PaymentMethod: string(o.PaymentMethod),
			Subtotal:      o.Subtotal,
			ShippingFee:   o.ShippingFee,
			Total:         o.Total,
			ContactEmail:  o.ContactEmail,
			ContactPhone:  o.ContactPhone,
			Notes:         o.Notes,
			CreatedAt:     o.CreatedAt.Format("Jan 02, 2006"),
			Items:         itemMap[o.ID],
			DeliveryType:  string(o.DeliveryType),
		}
		if o.AddressID != nil {
			if a, ok := addrMap[*o.AddressID]; ok {
				ar := a.ToResponse()
				row.Address = &ar
			}
		}
		result = append(result, row)
	}

	utils.OK(c, "Orders fetched", gin.H{
		"orders": result,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}