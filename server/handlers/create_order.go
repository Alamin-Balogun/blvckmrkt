// handlers/create_order.go
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ── Request types ──────────────────────────────────────────────────────────────

type createOrderContact struct {
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Subscribe bool   `json:"subscribe"`
}

type createOrderDelivery struct {
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	Address             string `json:"address"`
	Apt                 string `json:"apt"`
	City                string `json:"city"`
	State               string `json:"state"`
	Zip                 string `json:"zip"`
	Country             string `json:"country"`
	ShippingMethodID    *uint  `json:"shipping_method_id"`
	LocalShippingRateID *uint  `json:"local_shipping_rate_id"`
}

type createOrderPickup struct {
	PickupLocationID uint `json:"pickup_location_id" binding:"required"`
}

type createOrderPayment struct {
	Method     string  `json:"method" binding:"required"`
	Reference  *string `json:"reference,omitempty"`
	ReceiptURL *string `json:"receipt_url,omitempty"`
}

type createOrderItem struct {
	ProductID  uint    `json:"product_id"  binding:"required"`
	CartItemID *uint   `json:"cart_item_id"`
	Quantity   int     `json:"quantity"    binding:"required,min=1"`
	Size       string  `json:"size"`
	UnitPrice  float64 `json:"unit_price"  binding:"required"`
}

type createOrderRequest struct {
	Source       string               `json:"source"`
	Items        []createOrderItem    `json:"items"         binding:"required,min=1"`
	Contact      createOrderContact   `json:"contact"       binding:"required"`
	DeliveryMode string               `json:"delivery_mode" binding:"required"`
	Delivery     *createOrderDelivery `json:"delivery,omitempty"`
	Pickup       *createOrderPickup   `json:"pickup,omitempty"`
	Payment      createOrderPayment   `json:"payment"       binding:"required"`
	Coupon       *string              `json:"coupon"`
	Subtotal     float64              `json:"subtotal"`
	Discount     float64              `json:"discount"`
	ShippingCost float64              `json:"shipping_cost"`
	Total        float64              `json:"total"`
	Currency     string               `json:"currency"      binding:"required"`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

func validatePaymentStatus(status string) bool {
	for _, v := range []string{"unpaid", "pending", "paid", "failed", "refunded"} {
		if v == status {
			return true
		}
	}
	return false
}

func generateOrderReference() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())
	b := make([]byte, 6)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return fmt.Sprintf("BLVCK-%d-%s", time.Now().Unix(), string(b))
}

func getSuccessMessage(method, status string) string {
	if status == "paid" {
		return "Order placed and payment confirmed!"
	}
	if method == "transfer" || method == "manual_transfer" || method == "bank_transfer" {
		return "Order placed! We'll confirm your payment shortly."
	}
	return "Order placed successfully!"
}

func sendOrderConfirmationEmail(order models.Order, firstName, email string) {
	// Build items slice for the email
	emailItems := make([]utils.OrderConfirmationItem, len(order.Items))
	for i, item := range order.Items {
		emailItems[i] = utils.OrderConfirmationItem{
			Name:      item.ProductName,
			Size:      item.Size,
			Quantity:  item.Quantity,
			UnitPrice: item.UnitPrice,
			Total:     item.TotalPrice,
			ImageURL:  item.ImageURL,
		}
	}

	data := utils.OrderConfirmationData{
		FirstName:     firstName,
		Email:         email,
		OrderID:       order.DisplayID,
		PaymentMethod: string(order.PaymentMethod),
		PaymentStatus: string(order.PaymentStatus),
		DeliveryType:  string(order.DeliveryType),
		Subtotal:      order.Subtotal,
		ShippingFee:   order.ShippingFee,
		Total:         order.Total,
		Currency:      order.Currency,
		Items:         emailItems,
	}

	if err := utils.SendOrderConfirmationEmail(data); err != nil {
		log.Printf("⚠️ Order confirmation email failed for %s: %v", order.DisplayID, err)
	} else {
		log.Printf("📧 Order confirmation email sent for %s to %s", order.DisplayID, email)
	}
}

// ── Main handler ───────────────────────────────────────────────────────────────

func CreateOrder(c *gin.Context) {
	log.Printf("🚀 CreateOrder started")

	// ── 1. Auth ────────────────────────────────────────────────────────────
	uid := c.GetUint("userID")
	if uid == 0 {
		log.Printf("❌ userID missing or zero in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	log.Printf("✅ userID=%d", uid)

	// ── 2. Parse body ──────────────────────────────────────────────────────
	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ Bind failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}
	log.Printf("✅ Parsed: %d items, mode=%s, total=%.2f %s", len(req.Items), req.DeliveryMode, req.Total, req.Currency)

	// ── 3. Basic validation ────────────────────────────────────────────────
	if err := validateCreateOrderRequest(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ── 4. ENHANCED Payment Verification with Optional Card Details ────────────
	var paymentStatus, paymentRef, receiptURL string

	// ✅ Variables to store gateway response details
	var paystackChannel, paystackCardType, paystackCardLast4 string
	var paystackResponseJSON []byte
	var flutterwaveChannel, flutterwaveCardType, flutterwaveCardLast4 string
	var flutterwaveResponseJSON []byte

	log.Printf("🔍 Payment method: %s", req.Payment.Method)

	switch req.Payment.Method {
	case "paystack", "card":
		if req.Payment.Reference == nil || *req.Payment.Reference == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment reference required for Paystack"})
			return
		}

		verification, err := utils.VerifyPaystackPayment(*req.Payment.Reference)
		if err != nil {
			log.Printf("❌ Paystack verify failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment verification failed", "details": err.Error()})
			return
		}

		expected := int64(math.Round(req.Total * 100))
		if verification.Data.Amount != expected {
			log.Printf("❌ Amount mismatch: expected=%d got=%d", expected, verification.Data.Amount)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":    "Payment amount mismatch",
				"expected": fmt.Sprintf("%.2f %s", req.Total, req.Currency),
				"received": fmt.Sprintf("%.2f %s", float64(verification.Data.Amount)/100, verification.Data.Currency),
			})
			return
		}

		paymentStatus = "paid"
		paymentRef = verification.Data.Reference

		// ✅ Extract channel (always available)
		paystackChannel = verification.Data.Channel // e.g., "card", "bank_transfer", "ussd"

		// ✅ Extract card details if authorization is present (card payments only)
		if verification.Data.Authorization != nil {
			paystackCardType = verification.Data.Authorization.CardType  // e.g., "visa", "mastercard"
			paystackCardLast4 = verification.Data.Authorization.Last4    // e.g., "4081"
			log.Printf("💳 Card detected: %s ****%s", paystackCardType, paystackCardLast4)
		} else {
			// Non-card payment (bank transfer, USSD, etc.)
			log.Printf("📱 Non-card payment via: %s", paystackChannel)
		}

		// Store full response as JSON
		paystackResponseJSON, _ = json.Marshal(verification.Data)

		log.Printf("✅ Paystack verified: %s (channel: %s)", paymentRef, paystackChannel)

	case "flutterwave":
		if req.Payment.Reference == nil || *req.Payment.Reference == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction ID required for Flutterwave"})
			return
		}

		verification, err := utils.VerifyFlutterwavePayment(*req.Payment.Reference)
		if err != nil {
			log.Printf("❌ Flutterwave verify failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment verification failed", "details": err.Error()})
			return
		}

		// ✅ Compare rounded to the nearest kobo/cent — float64 currency math
		// (currency conversion, JSON round-trips) almost never lands on an
		// exact bit-for-bit match, so a naked `!=` here rejected genuinely
		// successful Flutterwave payments and silently dropped the order.
		if math.Round(verification.Data.Amount*100) != math.Round(req.Total*100) {
			log.Printf("❌ Amount mismatch: expected=%.2f got=%.2f", req.Total, verification.Data.Amount)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":    "Payment amount mismatch",
				"expected": fmt.Sprintf("%.2f %s", req.Total, req.Currency),
				"received": fmt.Sprintf("%.2f %s", verification.Data.Amount, verification.Data.Currency),
			})
			return
		}

		paymentStatus = "paid"
		paymentRef = verification.Data.TxRef

		// ✅ Extract payment type (always available)
		flutterwaveChannel = verification.Data.PaymentType // e.g., "card", "mobilemoney", "banktransfer"

		// ✅ Extract card details if card object is present (card payments only)
		if verification.Data.Card != nil {
			flutterwaveCardType = verification.Data.Card.Type         // e.g., "VISA", "MASTERCARD"
			flutterwaveCardLast4 = verification.Data.Card.Last4Digits // e.g., "5438"
			log.Printf("💳 Card detected: %s ****%s", flutterwaveCardType, flutterwaveCardLast4)
		} else {
			// Non-card payment (mobile money, bank transfer, USSD)
			log.Printf("📱 Non-card payment via: %s", flutterwaveChannel)
		}

		// Store full response as JSON
		flutterwaveResponseJSON, _ = json.Marshal(verification.Data)

		log.Printf("✅ Flutterwave verified: %s (type: %s)", paymentRef, flutterwaveChannel)

	case "transfer", "manual_transfer", "bank_transfer":
		paymentStatus = "pending"
		paymentRef = generateOrderReference()
		if req.Payment.ReceiptURL != nil && *req.Payment.ReceiptURL != "" {
			receiptURL = *req.Payment.ReceiptURL
			log.Printf("📋 Transfer order %s — receipt attached", paymentRef)
		} else {
			log.Printf("📋 Transfer order %s — no receipt", paymentRef)
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported payment method: " + req.Payment.Method})
		return
	}

	if !validatePaymentStatus(paymentStatus) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal payment status error"})
		return
	}

	order, txErr := buildOrder(uid, req, paymentStatus, paymentRef, func(tx *gorm.DB, orderID uint, orderTotal float64) error {
		switch req.Payment.Method {
		case "paystack", "card":
			gatewayDetails := models.OrderPaymentGateway{
				OrderID:         orderID,
				Gateway:         "paystack",
				TransactionID:   paymentRef,
				Reference:       paymentRef,
				Amount:          orderTotal,
				Currency:        req.Currency,
				Status:          "success",
				Channel:         paystackChannel,
				CardType:        paystackCardType,
				CardLast4:       paystackCardLast4,
				CustomerEmail:   req.Contact.Email,
				GatewayResponse: string(paystackResponseJSON),
				VerifiedAt:      time.Now(),
			}
			return tx.Create(&gatewayDetails).Error

		case "flutterwave":
			gatewayDetails := models.OrderPaymentGateway{
				OrderID:         orderID,
				Gateway:         "flutterwave",
				TransactionID:   paymentRef,
				Reference:       paymentRef,
				Amount:          orderTotal,
				Currency:        req.Currency,
				Status:          "success",
				Channel:         flutterwaveChannel,
				CardType:        flutterwaveCardType,
				CardLast4:       flutterwaveCardLast4,
				CustomerEmail:   req.Contact.Email,
				GatewayResponse: string(flutterwaveResponseJSON),
				VerifiedAt:      time.Now(),
			}
			return tx.Create(&gatewayDetails).Error

		case "transfer", "manual_transfer", "bank_transfer":
			transferDetails := models.OrderPaymentTransfer{
				OrderID:   orderID,
				Reference: paymentRef,
			}
			if receiptURL != "" {
				transferDetails.ReceiptURL = receiptURL
			}
			return tx.Create(&transferDetails).Error
		}
		return nil
	})

	if txErr != nil {
		log.Printf("❌ Order build failed: %v", txErr)
		c.JSON(http.StatusBadRequest, gin.H{"error": txErr.Error()})
		return
	}

	log.Printf("✅ Order complete: %s | user=%d | type=%s | total=%.2f %s | payment=%s (%s)",
		order.DisplayID, uid, order.DeliveryType, order.Total, req.Currency, req.Payment.Method, paymentStatus)

	// Confirmation email (async, non-blocking)
	firstName := ""
	if req.DeliveryMode == "delivery" && req.Delivery != nil {
		firstName = strings.TrimSpace(req.Delivery.FirstName)
	}
	if firstName == "" {
		firstName = strings.Split(req.Contact.Email, "@")[0] // fallback
	}
	go sendOrderConfirmationEmail(order, firstName, req.Contact.Email)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": getSuccessMessage(req.Payment.Method, paymentStatus),
		"data": gin.H{
			"order": gin.H{
				"id":                 order.ID,
				"display_id":         order.DisplayID,
				"reference":          order.DisplayID,
				"status":             order.Status,
				"payment_status":     order.PaymentStatus,
				"payment_reference":  order.PaymentRef,
				"payment_method":     order.PaymentMethod,
				"total":              order.Total,
				"currency":           req.Currency,
				"delivery_type":      order.DeliveryType,
				"items_count":        len(order.Items),
				"created_at":         order.CreatedAt,
				"needs_verification": paymentStatus == "pending",
			},
		},
	})
}

// validateCreateOrderRequest checks the fields every order-creation path needs
// regardless of how payment is collected — shared by the synchronous checkout
// (CreateOrder) and the hosted-checkout initiate step (payment_gateway.go).
func validateCreateOrderRequest(req createOrderRequest) error {
	if strings.TrimSpace(req.Contact.Email) == "" {
		return fmt.Errorf("Contact email is required")
	}
	if strings.TrimSpace(req.Contact.Phone) == "" {
		return fmt.Errorf("Contact phone is required")
	}
	if req.DeliveryMode != "delivery" && req.DeliveryMode != "pickup" {
		return fmt.Errorf("delivery_mode must be 'delivery' or 'pickup'")
	}
	if req.DeliveryMode == "delivery" {
		if req.Delivery == nil {
			return fmt.Errorf("Delivery address required")
		}
		d := req.Delivery
		if strings.TrimSpace(d.FirstName) == "" || strings.TrimSpace(d.LastName) == "" ||
			strings.TrimSpace(d.Address) == "" || strings.TrimSpace(d.City) == "" ||
			strings.TrimSpace(d.Zip) == "" {
			return fmt.Errorf("Complete delivery address is required")
		}
	}
	if req.DeliveryMode == "pickup" {
		if req.Pickup == nil || req.Pickup.PickupLocationID == 0 {
			return fmt.Errorf("Pickup location is required")
		}
	}
	if len(req.Items) == 0 {
		return fmt.Errorf("At least one item is required")
	}
	return nil
}

// ── Shared order builder ────────────────────────────────────────────────────────
// buildOrder resolves/creates the delivery address, prices line items from live
// product data, and persists the order + its shipping/payment detail snapshots
// inside a single transaction. Used by the synchronous checkout flow above
// (CreateOrder) and by the redirect-based hosted-checkout callback flow
// (payment_gateway.go) once that gateway's payment has already been verified —
// savePaymentDetails is where each caller writes its own payment-detail snapshot.
func buildOrder(
	uid uint,
	req createOrderRequest,
	paymentStatus, paymentRef string,
	savePaymentDetails func(tx *gorm.DB, orderID uint, orderTotal float64) error,
) (models.Order, error) {
	receiptURL := ""
	if req.Payment.ReceiptURL != nil {
		receiptURL = *req.Payment.ReceiptURL
	}

	// ── Find or create delivery address ────────────────────────────────
	var addressID *uint
	if req.DeliveryMode == "delivery" && req.Delivery != nil {
		line1 := strings.TrimSpace(req.Delivery.Address)
		line2 := strings.TrimSpace(req.Delivery.Apt)
		label := req.Delivery.FirstName + " " + req.Delivery.LastName

		var address models.Address
		err := database.DB.Where(
			"user_id = ? AND line1 = ? AND city = ? AND postcode = ? AND country = ?",
			uid, line1, req.Delivery.City, req.Delivery.Zip, req.Delivery.Country,
		).First(&address).Error

		if err == gorm.ErrRecordNotFound {
			address = models.Address{
				UserID:   uid,
				Label:    label,
				Line1:    line1,
				Line2:    line2,
				City:     req.Delivery.City,
				State:    req.Delivery.State,
				Postcode: req.Delivery.Zip,
				Country:  req.Delivery.Country,
			}
			if err := database.DB.Create(&address).Error; err != nil {
				log.Printf("❌ Address create failed: %v", err)
				return models.Order{}, fmt.Errorf("failed to save delivery address")
			}
			log.Printf("✅ Address created: ID=%d", address.ID)
		} else if err != nil {
			log.Printf("❌ Address lookup failed: %v", err)
			return models.Order{}, fmt.Errorf("failed to look up address")
		} else {
			log.Printf("✅ Reusing address: ID=%d", address.ID)
		}
		addressID = &address.ID
	}

	// ── Transaction: build order + items + shipping + payment details ──
	var order models.Order

	log.Printf("🔄 Starting transaction...")
	txErr := database.DB.Transaction(func(tx *gorm.DB) error {

		var orderItems []models.OrderItem
		var computedSubtotal float64

		for i, it := range req.Items {
			log.Printf("📦 Item %d: product_id=%d qty=%d", i+1, it.ProductID, it.Quantity)

			var product models.Product
			if err := tx.First(&product, it.ProductID).Error; err != nil {
				return fmt.Errorf("product %d not found", it.ProductID)
			}

			unitPrice := product.Price
			if unitPrice <= 0 {
				unitPrice = it.UnitPrice
			}
			lineTotal := unitPrice * float64(it.Quantity)
			computedSubtotal += lineTotal

			// Size & stock
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

			// Image snapshot
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

		// Totals
		shippingFee := req.ShippingCost
		if shippingFee < 0 {
			shippingFee = 0
		}
		discount := req.Discount
		if discount < 0 {
			discount = 0
		}
		orderTotal := computedSubtotal - discount + shippingFee
		if orderTotal < 0 {
			orderTotal = 0
		}

		log.Printf("💰 subtotal=%.2f discount=%.2f shipping=%.2f total=%.2f",
			computedSubtotal, discount, shippingFee, orderTotal)

		// Notes
		var noteParts []string
		if req.DeliveryMode == "pickup" {
			noteParts = append(noteParts, "Pickup order")
		}
		if req.Coupon != nil && *req.Coupon != "" {
			noteParts = append(noteParts, "Coupon: "+*req.Coupon)
		}
		if receiptURL != "" {
			noteParts = append(noteParts, "Receipt uploaded")
		}
		notes := strings.Join(noteParts, " | ")

		orderStatus := models.OrderPending
		if paymentStatus == "paid" {
			orderStatus = models.OrderProcessing
		}

		// ✅ Determine delivery type
		var deliveryType models.DeliveryType
		if req.DeliveryMode == "pickup" {
			deliveryType = models.DeliveryPickup
		} else if req.Delivery != nil {
			if req.Delivery.ShippingMethodID != nil {
				deliveryType = models.DeliveryZone
			} else if req.Delivery.LocalShippingRateID != nil {
				deliveryType = models.DeliveryLocal
			}
		}

		// ✅ Create order (clean, no shipping/payment detail FKs)
		order = models.Order{
			UserID:        uid,
			AddressID:     addressID,
			Subtotal:      computedSubtotal,
			ShippingFee:   shippingFee,
			Total:         orderTotal,
			Currency:      req.Currency,
			DeliveryType:  deliveryType,
			Status:        orderStatus,
			PaymentStatus: models.PaymentStatus(paymentStatus),
			PaymentRef:    paymentRef,
			PaymentMethod: req.Payment.Method,
			ContactEmail:  req.Contact.Email,
			ContactPhone:  req.Contact.Phone,
			Notes:         notes,
		}

		if err := tx.Create(&order).Error; err != nil {
			log.Printf("❌ Order create failed: %v", err)
			return fmt.Errorf("failed to create order: %w", err)
		}
		log.Printf("✅ Order created: %s (ID=%d)", order.DisplayID, order.ID)

		// Attach order ID to items then insert
		for i := range orderItems {
			orderItems[i].OrderID = order.ID
		}
		if err := tx.Create(&orderItems).Error; err != nil {
			log.Printf("❌ Order items create failed: %v", err)
			return fmt.Errorf("failed to create order items: %w", err)
		}
		log.Printf("✅ %d order items created", len(orderItems))
		order.Items = orderItems

		// ✅ Create shipping detail snapshot
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
			log.Printf("✅ Pickup details created for order %s", order.DisplayID)

		} else if req.DeliveryMode == "delivery" && req.Delivery != nil {

			if req.Delivery.ShippingMethodID != nil {
				// ✅ Zone shipping with proper Zone relationship
				var method models.ShippingMethod
				if err := tx.Preload("Zone").First(&method, *req.Delivery.ShippingMethodID).Error; err != nil {
					return fmt.Errorf("shipping method %d not found", *req.Delivery.ShippingMethodID)
				}

				// Check if Zone was loaded
				if method.Zone == nil {
					return fmt.Errorf("shipping method %d has no associated zone", *req.Delivery.ShippingMethodID)
				}

				locationCountry := req.Delivery.Country
				locationState := req.Delivery.State

				var zoneLocationID *uint
				var zoneLoc models.ShippingZoneLocation
				if err := tx.Where("zone_id = ? AND country = ? AND state = ?",
					method.ZoneID, locationCountry, locationState).First(&zoneLoc).Error; err == nil {
					zoneLocationID = &zoneLoc.ID
				}

				zoneDetails := models.OrderZoneDelivery{
					OrderID:           order.ID,
					ShippingMethodID:  method.ID,
					ZoneID:            method.ZoneID,
					ZoneLocationID:    zoneLocationID,
					BrandID:           method.BrandID,
					ZoneName:          method.Zone.Name,
					LocationCountry:   locationCountry,
					LocationState:     locationState,
					MethodName:        method.Name,
					MethodDescription: method.Description,
					PricingType:       string(method.PricingType),
					Rate:              method.FlatRate,
					Currency:          method.Currency,
					CurrencySymbol:    method.CurrencySymbol,
					MinDays:           method.MinDays,
					MaxDays:           method.MaxDays,
				}
				if err := tx.Create(&zoneDetails).Error; err != nil {
					return fmt.Errorf("failed to create zone delivery details: %w", err)
				}
				log.Printf("✅ Zone delivery details created for order %s (zone: %s)", order.DisplayID, method.Zone.Name)

			} else if req.Delivery.LocalShippingRateID != nil {
				// ✅ Local shipping
				var localRate models.LocalShippingRate
				if err := tx.First(&localRate, *req.Delivery.LocalShippingRateID).Error; err != nil {
					return fmt.Errorf("local shipping rate %d not found", *req.Delivery.LocalShippingRateID)
				}

				// ✅ Dereference optional *string for City
				localCity := ""
				if localRate.City != nil {
					localCity = *localRate.City
				}

				// ✅ Serialize AreaOverrides ([]AreaOverride) → JSON string for storage
				areaOverridesJSON := "[]"
				if len(localRate.AreaOverrides) > 0 {
					if b, err := json.Marshal(localRate.AreaOverrides); err == nil {
						areaOverridesJSON = string(b)
					}
				}

				localDetails := models.OrderLocalDelivery{
					OrderID:             order.ID,
					LocalShippingRateID: localRate.ID,
					BrandID:             localRate.BrandID,
					Country:             localRate.Country,
					CountryCode:         localRate.CountryCode,
					State:               localRate.State,
					StateCode:           localRate.StateCode,
					City:                localCity,
					BasePrice:           localRate.BasePrice,
					Currency:            localRate.Currency,
					CurrencySymbol:      localRate.CurrencySymbol,
					AreaOverrides:       areaOverridesJSON,
				}
				if err := tx.Create(&localDetails).Error; err != nil {
					return fmt.Errorf("failed to create local delivery details: %w", err)
				}
				log.Printf("✅ Local delivery details created for order %s (%s, %s)",
					order.DisplayID, localCity, localRate.State)
			}
		}

		// ✅ Payment detail snapshot — caller-specific (gateway/method varies)
		if err := savePaymentDetails(tx, order.ID, orderTotal); err != nil {
			return fmt.Errorf("failed to create payment details: %w", err)
		}

		// Clear cart (unless buy-now)
		if req.Source != "buyNow" {
			if err := tx.Where("user_id = ?", uid).Delete(&models.CartItem{}).Error; err != nil {
				log.Printf("⚠️ Cart clear failed (non-fatal): %v", err)
			} else {
				log.Printf("✅ Cart cleared for user %d", uid)
			}
		}

		return nil
	})

	if txErr != nil {
		return models.Order{}, txErr
	}
	return order, nil
}