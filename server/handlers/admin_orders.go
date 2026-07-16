package handlers

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ── GET /api/admin/orders ─────────────────────────────────────────────────────
func AdminListOrders(c *gin.Context) {
	limit, offset := adminPageParams(c)
	status        := c.Query("status")
	paymentStatus := c.Query("payment_status")
	search        := c.Query("search")

	type OrderRow struct {
		ID            uint                 `json:"id"`
		DisplayID     string               `json:"display_id"`
		Status        models.OrderStatus   `json:"status"`
		PaymentStatus models.PaymentStatus `json:"payment_status"`
		PaymentMethod string               `json:"payment_method"`
		PaymentRef    string               `json:"payment_ref"`
		ReceiptURL    string               `json:"receipt_url"`
		Subtotal      float64              `json:"subtotal"`
		ShippingFee   float64              `json:"shipping_fee"`
		Total         float64              `json:"total"`
		Currency      string               `json:"currency"`
		DeliveryType  string               `json:"delivery_type"`
		BuyerName     string               `json:"buyer_name"`
		BuyerEmail    string               `json:"buyer_email"`
		ContactEmail  string               `json:"contact_email"`
		ContactPhone  string               `json:"contact_phone"`
		ItemCount     int                  `json:"item_count"`
		CreatedAt     string               `json:"created_at"`
		UpdatedAt     string               `json:"updated_at"`
	}

	// ✅ JOIN payment tables to get receipt_url and other payment details
	q := database.DB.Table("orders o").
		Select(`
			o.id, o.display_id, o.status, o.payment_status, o.payment_method, o.payment_ref,
			o.subtotal, o.shipping_fee, o.total, o.currency, o.delivery_type,
			CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) AS buyer_name,
			u.email AS buyer_email,
			o.contact_email, o.contact_phone,
			COALESCE(opt.receipt_url, '') AS receipt_url,
			(SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
			o.created_at, o.updated_at
		`).
		Joins("LEFT JOIN users u ON u.id = o.user_id").
		Joins("LEFT JOIN order_payment_transfers opt ON opt.order_id = o.id").
		Where("o.deleted_at IS NULL")

	if status != "" {
		q = q.Where("o.status = ?", status)
	}
	if paymentStatus != "" {
		q = q.Where("o.payment_status = ?", paymentStatus)
	}
	if search != "" {
		like := "%" + search + "%"
		q = q.Where(`
			o.display_id LIKE ? OR 
			u.email LIKE ? OR 
			u.first_name LIKE ? OR 
			u.last_name LIKE ? OR
			o.contact_email LIKE ? OR
			o.contact_phone LIKE ?
		`, like, like, like, like, like, like)
	}

	var total int64
	countQuery := database.DB.Table("orders").Where("deleted_at IS NULL")
	if status != "" {
		countQuery = countQuery.Where("status = ?", status)
	}
	if paymentStatus != "" {
		countQuery = countQuery.Where("payment_status = ?", paymentStatus)
	}
	countQuery.Count(&total)

	var rows []OrderRow
	q.Order("o.created_at DESC").Limit(limit).Offset(offset).Scan(&rows)

	utils.OK(c, "Orders fetched", gin.H{"orders": rows, "total": total})
}

// ── POST /api/admin/orders ────────────────────────────────────────────────────
// Lets an admin manually place an order on a buyer's behalf — e.g. to finish
// a purchase for a customer whose checkout failed or who ordered via support.
// Skips gateway verification entirely; payment is recorded as a manual/admin
// transfer with whatever status the admin confirms.

type adminCreateOrderRequest struct {
	UserID        uint                 `json:"user_id"        binding:"required"`
	Items         []createOrderItem    `json:"items"          binding:"required,min=1"`
	ContactEmail  string               `json:"contact_email"  binding:"required"`
	ContactPhone  string               `json:"contact_phone"  binding:"required"`
	DeliveryMode  string               `json:"delivery_mode"  binding:"required"` // "delivery" | "pickup"
	Delivery      *createOrderDelivery `json:"delivery,omitempty"`
	Pickup        *createOrderPickup   `json:"pickup,omitempty"`
	PaymentMethod string               `json:"payment_method" binding:"required"` // e.g. manual_transfer, cash
	PaymentStatus string               `json:"payment_status" binding:"required"` // paid | pending
	ShippingFee   float64              `json:"shipping_fee"`
	Notes         string               `json:"notes"`
	Currency      string               `json:"currency"`
}

func AdminCreateOrder(c *gin.Context) {
	var req adminCreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}

	if req.DeliveryMode != "delivery" && req.DeliveryMode != "pickup" {
		utils.BadRequest(c, "delivery_mode must be 'delivery' or 'pickup'", nil)
		return
	}
	if req.DeliveryMode == "delivery" {
		if req.Delivery == nil || strings.TrimSpace(req.Delivery.Address) == "" || strings.TrimSpace(req.Delivery.City) == "" {
			utils.BadRequest(c, "Delivery address is required", nil)
			return
		}
	}
	if req.DeliveryMode == "pickup" && (req.Pickup == nil || req.Pickup.PickupLocationID == 0) {
		utils.BadRequest(c, "Pickup location is required", nil)
		return
	}
	if req.PaymentStatus != "paid" && req.PaymentStatus != "pending" {
		utils.BadRequest(c, "payment_status must be 'paid' or 'pending'", nil)
		return
	}

	var buyer models.User
	if err := database.DB.First(&buyer, req.UserID).Error; err != nil {
		utils.NotFound(c, "Buyer not found")
		return
	}

	currency := req.Currency
	if currency == "" {
		currency = "NGN"
	}

	// ── Delivery address (find-or-create, same rule as buyer checkout) ─────
	var addressID *uint
	if req.DeliveryMode == "delivery" && req.Delivery != nil {
		d := req.Delivery
		line1 := strings.TrimSpace(d.Address)
		line2 := strings.TrimSpace(d.Apt)
		label := strings.TrimSpace(d.FirstName + " " + d.LastName)
		if label == "" {
			label = strings.TrimSpace(buyer.FirstName + " " + buyer.LastName)
		}

		var address models.Address
		err := database.DB.Where(
			"user_id = ? AND line1 = ? AND city = ? AND postcode = ? AND country = ?",
			req.UserID, line1, d.City, d.Zip, d.Country,
		).First(&address).Error

		if err == gorm.ErrRecordNotFound {
			address = models.Address{
				UserID:   req.UserID,
				Label:    label,
				Line1:    line1,
				Line2:    line2,
				City:     d.City,
				State:    d.State,
				Postcode: d.Zip,
				Country:  d.Country,
			}
			if err := database.DB.Create(&address).Error; err != nil {
				utils.InternalError(c, "Failed to save delivery address")
				return
			}
		} else if err != nil {
			utils.InternalError(c, "Failed to look up address")
			return
		}
		addressID = &address.ID
	}

	shippingFee := req.ShippingFee
	if shippingFee < 0 {
		shippingFee = 0
	}

	var order models.Order
	txErr := database.DB.Transaction(func(tx *gorm.DB) error {
		var orderItems []models.OrderItem
		var subtotal float64

		for _, it := range req.Items {
			var product models.Product
			if err := tx.First(&product, it.ProductID).Error; err != nil {
				return fmt.Errorf("product %d not found", it.ProductID)
			}

			unitPrice := product.Price
			if unitPrice <= 0 {
				unitPrice = it.UnitPrice
			}
			lineTotal := unitPrice * float64(it.Quantity)
			subtotal += lineTotal

			var productSizeID *uint
			sizeName := it.Size
			if sizeName != "" && sizeName != "—" {
				var ps models.ProductSize
				if err := tx.Where("product_id = ? AND size = ?", product.ID, sizeName).First(&ps).Error; err == nil {
					productSizeID = &ps.ID
					if ps.Stock < it.Quantity {
						return fmt.Errorf("%s (size %s) only has %d in stock", product.Name, sizeName, ps.Stock)
					}
					if err := tx.Model(&ps).Update("stock", gorm.Expr("stock - ?", it.Quantity)).Error; err != nil {
						return fmt.Errorf("failed to update stock for %s %s", product.Name, sizeName)
					}
				}
			}

			imageURL := ""
			var img models.ProductImage
			if tx.Where("product_id = ? AND position = 0", product.ID).First(&img).Error == nil {
				imageURL = img.URL
			} else if tx.Where("product_id = ?", product.ID).Order("position ASC").First(&img).Error == nil {
				imageURL = img.URL
			}

			orderItems = append(orderItems, models.OrderItem{
				ProductID:     product.ID,
				ProductSizeID: productSizeID,
				BrandID:       product.BrandID,
				ProductName:   product.Name,
				Size:          sizeName,
				Quantity:      it.Quantity,
				UnitPrice:     unitPrice,
				TotalPrice:    lineTotal,
				ImageURL:      imageURL,
				CreatedAt:     time.Now(),
			})
		}

		notes := "Order created by admin"
		if strings.TrimSpace(req.Notes) != "" {
			notes += ": " + strings.TrimSpace(req.Notes)
		}

		deliveryType := models.DeliveryLocal
		if req.DeliveryMode == "pickup" {
			deliveryType = models.DeliveryPickup
		}

		orderStatus := models.OrderPending
		if req.PaymentStatus == "paid" {
			orderStatus = models.OrderProcessing
		}

		order = models.Order{
			UserID:        req.UserID,
			AddressID:     addressID,
			Subtotal:      subtotal,
			ShippingFee:   shippingFee,
			Total:         subtotal + shippingFee,
			Currency:      currency,
			DeliveryType:  deliveryType,
			Status:        orderStatus,
			PaymentStatus: models.PaymentStatus(req.PaymentStatus),
			PaymentRef:    generateOrderReference(),
			PaymentMethod: req.PaymentMethod,
			ContactEmail:  req.ContactEmail,
			ContactPhone:  req.ContactPhone,
			Notes:         notes,
		}

		if err := tx.Create(&order).Error; err != nil {
			return fmt.Errorf("failed to create order: %w", err)
		}

		for i := range orderItems {
			orderItems[i].OrderID = order.ID
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			return fmt.Errorf("failed to create order items: %w", err)
		}
		order.Items = orderItems

		if req.DeliveryMode == "pickup" && req.Pickup != nil {
			var pickupLoc models.PickupLocation
			if err := tx.First(&pickupLoc, req.Pickup.PickupLocationID).Error; err != nil {
				return fmt.Errorf("pickup location %d not found", req.Pickup.PickupLocationID)
			}
			pickupDetails := models.OrderPickup{
				OrderID:          order.ID,
				PickupLocationID: pickupLoc.ID,
				BrandID:          pickupLoc.BrandID,
				Name:             pickupLoc.Name,
				Address:          pickupLoc.Address,
				City:             pickupLoc.City,
				State:            pickupLoc.State,
				StateCode:        pickupLoc.StateCode,
				Country:          pickupLoc.Country,
				CountryCode:      pickupLoc.CountryCode,
				Phone:            pickupLoc.Phone,
				Instructions:     pickupLoc.Instructions,
			}
			if err := tx.Create(&pickupDetails).Error; err != nil {
				return fmt.Errorf("failed to create pickup details: %w", err)
			}
		}

		transferDetails := models.OrderPaymentTransfer{
			OrderID:   order.ID,
			Reference: order.PaymentRef,
			Notes:     "Recorded by admin",
		}
		if req.PaymentStatus == "paid" {
			adminID := adminIDFromCtx(c)
			now := time.Now()
			transferDetails.VerifiedAt = &now
			transferDetails.VerifiedBy = &adminID
		}
		if err := tx.Create(&transferDetails).Error; err != nil {
			return fmt.Errorf("failed to create payment details: %w", err)
		}

		return nil
	})

	if txErr != nil {
		utils.BadRequest(c, txErr.Error(), nil)
		return
	}

	entityID := order.ID
	logActivity(c, "order", &entityID, "admin_created_order",
		fmt.Sprintf(`{"display_id":"%s","user_id":%d,"total":%v}`, order.DisplayID, req.UserID, order.Total))

	log.Printf("✅ Admin created order %s for user %d", order.DisplayID, req.UserID)

	utils.OK(c, "Order created", gin.H{"order": order})
}

// ── GET /api/admin/orders/:id ─────────────────────────────────────────────────
func AdminGetOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	var order models.Order
	if err := database.DB.
		Preload("Items").
		Preload("PickupDetails").
		Preload("ZoneDelivery").
		Preload("LocalDelivery").
		Preload("PaymentTransfer").
		Preload("PaymentGateway").
		First(&order, id).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	var buyer models.User
	database.DB.Select("id, first_name, last_name, email").First(&buyer, order.UserID)

	var address *models.Address
	if order.AddressID != nil {
		var addr models.Address
		if database.DB.First(&addr, *order.AddressID).Error == nil {
			address = &addr
		}
	}

	// Build comprehensive response
	response := gin.H{
		"order":       order,
		"buyer_name":  buyer.FirstName + " " + buyer.LastName,
		"buyer_email": buyer.Email,
		"address":     address,
	}

	// Add delivery details based on type
	switch order.DeliveryType {
	case models.DeliveryPickup:
		if order.PickupDetails != nil {
			response["delivery_details"] = order.PickupDetails
		}
	case models.DeliveryZone:
		if order.ZoneDelivery != nil {
			response["delivery_details"] = order.ZoneDelivery
		}
	case models.DeliveryLocal:
		if order.LocalDelivery != nil {
			response["delivery_details"] = order.LocalDelivery
		}
	}

	// Add payment details based on method
	if order.PaymentMethod == "transfer" || order.PaymentMethod == "manual_transfer" {
		if order.PaymentTransfer != nil {
			response["payment_details"] = order.PaymentTransfer
		}
	} else if order.PaymentMethod == "paystack" || order.PaymentMethod == "flutterwave" {
		if order.PaymentGateway != nil {
			response["payment_details"] = order.PaymentGateway
		}
	}

	utils.OK(c, "Order fetched", response)
}

// ── PATCH /api/admin/orders/:id ───────────────────────────────────────────────
func AdminUpdateOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	var body struct {
		Status        string `json:"status"`
		PaymentStatus string `json:"payment_status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}
	if body.Status        != "" { updates["status"]         = body.Status        }
	if body.PaymentStatus != "" { updates["payment_status"] = body.PaymentStatus }

	if len(updates) == 0 {
		utils.BadRequest(c, "Provide status or payment_status", nil)
		return
	}

	database.DB.Model(&models.Order{}).Where("id = ?", id).Updates(updates)

	entityID := uint(id)
	logActivity(c, "order", &entityID, "updated_order",
		fmt.Sprintf(`{"status":"%s","payment_status":"%s"}`, body.Status, body.PaymentStatus))

	utils.OK(c, "Order updated", nil)
}

// ── POST /api/admin/orders/:id/confirm-payment ────────────────────────────────
// Admin confirms a bank transfer receipt → payment_status: paid, status: processing
func AdminConfirmPayment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	if order.PaymentStatus == models.PaymentPaid {
		utils.Conflict(c, "Payment is already confirmed for this order")
		return
	}
	if order.PaymentStatus == models.PaymentFailed {
		utils.Conflict(c, "Cannot confirm a failed/rejected payment")
		return
	}
	if order.PaymentStatus != models.PaymentPending {
		utils.Conflict(c, "Order is not awaiting payment verification")
		return
	}

	if err := database.DB.Model(&order).Updates(map[string]interface{}{
		"payment_status": models.PaymentPaid,
		"status":         models.OrderProcessing,
		"updated_at":     time.Now(),
	}).Error; err != nil {
		log.Printf("❌ AdminConfirmPayment failed for order %d: %v", id, err)
		utils.InternalError(c, "Failed to confirm payment")
		return
	}

	log.Printf("✅ Admin confirmed payment for order %s (ID=%d)", order.DisplayID, order.ID)

	entityID := uint(id)
	logActivity(c, "order", &entityID, "confirmed_payment",
		fmt.Sprintf(`{"display_id":"%s","method":"%s"}`, order.DisplayID, order.PaymentMethod))

	// TODO: send "payment confirmed" email to order.ContactEmail

	utils.OK(c, "Payment confirmed. Order is now processing.", gin.H{
		"order_id":       order.ID,
		"display_id":     order.DisplayID,
		"payment_status": "paid",
		"status":         "processing",
	})
}

// ── POST /api/admin/orders/:id/reject-payment ─────────────────────────────────
// Admin rejects a bank transfer → payment_status: failed, status: cancelled
func AdminRejectPayment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	var req struct {
		Reason string `json:"reason"`
	}
	c.ShouldBindJSON(&req)

	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	if order.PaymentStatus != models.PaymentPending {
		utils.Conflict(c, "Order is not awaiting payment verification")
		return
	}

	notes := order.Notes
	if req.Reason != "" {
		if notes != "" {
			notes += " | "
		}
		notes += "Payment rejected: " + req.Reason
	}

	if err := database.DB.Model(&order).Updates(map[string]interface{}{
		"payment_status": models.PaymentFailed,
		"status":         models.OrderCancelled,
		"notes":          notes,
		"updated_at":     time.Now(),
	}).Error; err != nil {
		log.Printf("❌ AdminRejectPayment failed for order %d: %v", id, err)
		utils.InternalError(c, "Failed to reject payment")
		return
	}

	log.Printf("❌ Admin rejected payment for order %s (ID=%d): %s", order.DisplayID, order.ID, req.Reason)

	entityID := uint(id)
	logActivity(c, "order", &entityID, "rejected_payment",
		fmt.Sprintf(`{"display_id":"%s","reason":"%s"}`, order.DisplayID, req.Reason))

	// TODO: send "payment rejected" email to order.ContactEmail

	utils.OK(c, "Payment rejected. Order has been cancelled.", gin.H{
		"order_id":       order.ID,
		"display_id":     order.DisplayID,
		"payment_status": "failed",
		"status":         "cancelled",
	})
}

// ── DELETE /api/admin/orders/:id ──────────────────────────────────────────────
func AdminDeleteOrder(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	var order models.Order
	database.DB.First(&order, id)

	database.DB.Where("order_id = ?", id).Delete(&models.OrderItem{})
	database.DB.Delete(&models.Order{}, id)

	entityID := uint(id)
	logActivity(c, "order", &entityID, "deleted_order",
		fmt.Sprintf(`{"display_id":"%s","total":%v}`, order.DisplayID, order.Total))

	utils.OK(c, "Order deleted", nil)
}