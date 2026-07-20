// handlers/dellyman.go
//
// Orchestration around the Dellyman courier client in services/dellyman.go:
// live checkout quoting, persisting per-brand delivery snapshots on an
// order, booking with the courier once payment is confirmed, and the
// inbound status webhook.
package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/services"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// getAdminSettingString reads one admin setting as a raw string. Returns
// fallback if missing or the stored value isn't a JSON string.
func getAdminSettingString(key, fallback string) string {
	var row models.AdminSetting
	if err := database.DB.Where("setting_key = ?", key).First(&row).Error; err != nil {
		return fallback
	}
	var v string
	if err := json.Unmarshal([]byte(row.Value), &v); err != nil {
		return fallback
	}
	return v
}

// dellymanDeliveryModeEnabled reports whether the platform-wide delivery
// mode is currently set to Dellyman (vs. brand-handled shipping).
func dellymanDeliveryModeEnabled() bool {
	return getAdminSettingString("delivery_mode", "brand") == "dellyman"
}

func formatDellymanAddress(line, city, state, country string) string {
	parts := make([]string, 0, 4)
	for _, p := range []string{line, city, state, country} {
		if p = strings.TrimSpace(p); p != "" {
			parts = append(parts, p)
		}
	}
	return strings.Join(parts, ", ")
}

func intPtr(v int) *int { return &v }

type dellymanQuote struct {
	Pickup  models.PickupLocation
	Company services.QuoteCompany
}

// quoteDellymanForBrands fetches a live Dellyman quote per brand — each
// brand ships from its own pickup location — and picks the cheapest courier
// for each. brandTotals is the product subtotal per brand (used as
// ProductAmount); brandOrder gives a stable iteration order. Returns an
// error naming the first brand that can't be quoted, e.g. because it has no
// active pickup location yet.
func quoteDellymanForBrands(tx *gorm.DB, brandTotals map[uint]float64, brandOrder []uint, deliveryAddress string) (map[uint]dellymanQuote, float64, error) {
	quotes := make(map[uint]dellymanQuote, len(brandOrder))
	var total float64
	pickupDate := time.Now().Format("2006/01/02")

	for _, brandID := range brandOrder {
		var pickup models.PickupLocation
		if err := tx.Where("brand_id = ? AND active = ?", brandID, true).
			Order("created_at ASC").First(&pickup).Error; err != nil {

			name := fmt.Sprintf("Brand #%d", brandID)
			var brand models.Brand
			if tx.Select("brand_name").First(&brand, brandID).Error == nil && brand.BrandName != "" {
				name = brand.BrandName
			}
			return nil, 0, fmt.Errorf("%s hasn't set up a pickup location yet, so courier delivery isn't available for their items right now — please remove those items or try again once the brand has set one up", name)
		}

		resp, err := services.GetQuotes(services.QuoteRequest{
			PaymentMode:         config.App.DellymanDefaultPaymentMode,
			Vehicle:             config.App.DellymanDefaultVehicle,
			PickupRequestedDate: pickupDate,
			PickupRequestedTime: config.App.DellymanPickupWindow,
			PickupAddress:       formatDellymanAddress(pickup.Address, pickup.City, pickup.State, pickup.Country),
			DeliveryAddress:     []string{deliveryAddress},
			IsProductOrder:      intPtr(1),
			ProductAmount:       brandTotals[brandID],
		})
		if err != nil {
			log.Printf("⚠️ Dellyman quote failed for brand %d: %v", brandID, err)
			return nil, 0, fmt.Errorf("delivery pricing is temporarily unavailable, please try again shortly")
		}
		if len(resp.Companies) == 0 {
			return nil, 0, fmt.Errorf("no courier is currently available for this delivery address")
		}

		cheapest := resp.Companies[0]
		for _, comp := range resp.Companies[1:] {
			if comp.TotalPrice < cheapest.TotalPrice {
				cheapest = comp
			}
		}

		quotes[brandID] = dellymanQuote{Pickup: pickup, Company: cheapest}
		total += cheapest.TotalPrice
	}

	return quotes, total, nil
}

// createDellymanDeliveryRows persists one OrderDellymanDelivery snapshot per
// brand for an already-created order, status "quoted" — booking with the
// courier itself happens later, once payment is confirmed (see
// bookDellymanShipmentsForOrder).
func createDellymanDeliveryRows(tx *gorm.DB, orderID uint, quotes map[uint]dellymanQuote, brandOrder []uint, deliveryAddress, deliveryLandmark, contactName, contactPhone string) error {
	for _, brandID := range brandOrder {
		q, ok := quotes[brandID]
		if !ok {
			continue
		}
		row := models.OrderDellymanDelivery{
			OrderID:              orderID,
			BrandID:              brandID,
			PickupLocationID:     q.Pickup.ID,
			DeliveryContactName:  contactName,
			DeliveryContactPhone: contactPhone,
			DeliveryAddress:      deliveryAddress,
			DeliveryLandmark:     deliveryLandmark,
			CompanyID:            q.Company.CompanyID,
			CompanyName:          q.Company.Name,
			Vehicle:              config.App.DellymanDefaultVehicle,
			Price:                q.Company.TotalPrice,
			Currency:             "NGN",
			OrderRef:             uuid.NewString(),
			Status:               models.DellymanQuoted,
		}
		if err := tx.Create(&row).Error; err != nil {
			return fmt.Errorf("failed to save delivery booking for brand %d: %w", brandID, err)
		}
	}
	return nil
}

// bookDellymanShipmentsForOrder books an actual courier pickup with Dellyman
// for every "quoted" delivery row on a now-paid order. Meant to run async
// (fired via `go` right after the order transaction commits for
// paid-at-checkout orders, or from AdminConfirmPayment once a bank-transfer
// order is later approved) so a slow/flaky courier API never blocks the
// checkout response.
func bookDellymanShipmentsForOrder(order models.Order) {
	if !services.DellymanConfigured() {
		log.Printf("⚠️ Dellyman booking skipped for order %s — DELLYMAN_API_KEY not set", order.DisplayID)
		return
	}

	var rows []models.OrderDellymanDelivery
	if err := database.DB.Where("order_id = ? AND status = ?", order.ID, models.DellymanQuoted).Find(&rows).Error; err != nil {
		log.Printf("⚠️ Dellyman booking lookup failed for order %s: %v", order.DisplayID, err)
		return
	}

	items := order.Items
	if len(items) == 0 {
		database.DB.Where("order_id = ?", order.ID).Find(&items)
	}
	itemsByBrand := map[uint][]models.OrderItem{}
	for _, it := range items {
		itemsByBrand[it.BrandID] = append(itemsByBrand[it.BrandID], it)
	}

	pickupDate := time.Now().Format("2006/01/02")

	for _, row := range rows {
		var pickup models.PickupLocation
		if err := database.DB.First(&pickup, row.PickupLocationID).Error; err != nil {
			log.Printf("❌ Dellyman booking failed for order %s brand %d: pickup location %d not found", order.DisplayID, row.BrandID, row.PickupLocationID)
			database.DB.Model(&row).Updates(map[string]interface{}{
				"status":       models.DellymanFailed,
				"raw_response": "pickup location not found at booking time",
			})
			continue
		}

		var packages []services.BookPackage
		for _, it := range itemsByBrand[row.BrandID] {
			packages = append(packages, services.BookPackage{
				PackageDescription:         fmt.Sprintf("%s x%d", it.ProductName, it.Quantity),
				DeliveryContactName:        row.DeliveryContactName,
				DeliveryContactNumber:      row.DeliveryContactPhone,
				DeliveryGooglePlaceAddress: row.DeliveryAddress,
				DeliveryLandmark:           row.DeliveryLandmark,
				ProductAmount:              it.TotalPrice,
			})
		}
		if len(packages) == 0 {
			packages = []services.BookPackage{{
				PackageDescription:         fmt.Sprintf("Order %s", order.DisplayID),
				DeliveryContactName:        row.DeliveryContactName,
				DeliveryContactNumber:      row.DeliveryContactPhone,
				DeliveryGooglePlaceAddress: row.DeliveryAddress,
				DeliveryLandmark:           row.DeliveryLandmark,
				ProductAmount:              row.Price,
			}}
		}

		resp, err := services.BookOrder(services.BookOrderRequest{
			OrderRef:                 row.OrderRef,
			CompanyID:                row.CompanyID,
			PaymentMode:              config.App.DellymanDefaultPaymentMode,
			Vehicle:                  row.Vehicle,
			PickUpContactName:        pickup.Name,
			PickUpContactNumber:      pickup.Phone,
			PickUpGooglePlaceAddress: formatDellymanAddress(pickup.Address, pickup.City, pickup.State, pickup.Country),
			PickUpRequestedDate:      pickupDate,
			PickUpRequestedTime:      config.App.DellymanPickupWindow,
			DeliveryRequestedTime:    config.App.DellymanPickupWindow,
			DeliveryTimeline:         "sameDay",
			Packages:                 packages,
		})
		if err != nil {
			log.Printf("❌ Dellyman booking failed for order %s brand %d: %v", order.DisplayID, row.BrandID, err)
			database.DB.Model(&row).Updates(map[string]interface{}{
				"status":       models.DellymanFailed,
				"raw_response": err.Error(),
			})
			continue
		}

		log.Printf("✅ Dellyman booked for order %s brand %d — tracking %s", order.DisplayID, row.BrandID, resp.TrackingID)
		database.DB.Model(&row).Updates(map[string]interface{}{
			"status":            models.DellymanBooked,
			"dellyman_order_id": fmt.Sprintf("%d", resp.OrderID),
			"order_code":        resp.OrderCode,
			"tracking_id":       resp.TrackingID,
		})
	}
}

// CheckoutDeliveryMode is GET /api/checkout/delivery-mode — public, so the
// checkout page (buyers and guests alike) knows whether to show brand
// shipping-zone/local-rate pickers or fetch a live Dellyman quote instead.
func CheckoutDeliveryMode(c *gin.Context) {
	utils.OK(c, "Delivery mode fetched", gin.H{
		"delivery_mode": getAdminSettingString("delivery_mode", "brand"),
	})
}

// ── Checkout price preview ────────────────────────────────────────────────

type checkoutDellymanQuoteItem struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity"   binding:"required,min=1"`
}

type checkoutDellymanQuoteRequest struct {
	Items   []checkoutDellymanQuoteItem `json:"items" binding:"required,min=1"`
	Address string                      `json:"address"`
	City    string                      `json:"city"    binding:"required"`
	State   string                      `json:"state"`
	Country string                      `json:"country" binding:"required"`
}

type checkoutDellymanBrandQuote struct {
	BrandID   uint    `json:"brand_id"`
	BrandName string  `json:"brand_name"`
	Price     float64 `json:"price"`
	Company   string  `json:"company"`
}

// CheckoutDellymanQuote is POST /api/checkout/dellyman-quote — a live
// delivery-price preview shown at checkout while the platform is in
// Dellyman mode. Nothing is persisted here: the same quoting logic runs
// again, fresh, inside buildOrder when the order is actually placed, since
// prices and pickup locations can change between preview and submit.
func CheckoutDellymanQuote(c *gin.Context) {
	if !dellymanDeliveryModeEnabled() {
		utils.BadRequest(c, "Courier delivery pricing is not active on this platform", nil)
		return
	}

	var req checkoutDellymanQuoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}

	brandTotals := map[uint]float64{}
	brandNames := map[uint]string{}
	var brandOrder []uint

	for _, it := range req.Items {
		var product models.Product
		if err := database.DB.First(&product, it.ProductID).Error; err != nil {
			utils.BadRequest(c, fmt.Sprintf("product %d not found", it.ProductID), nil)
			return
		}
		if _, seen := brandTotals[product.BrandID]; !seen {
			brandOrder = append(brandOrder, product.BrandID)
			var brand models.Brand
			if database.DB.Select("brand_name").First(&brand, product.BrandID).Error == nil {
				brandNames[product.BrandID] = brand.BrandName
			}
		}
		brandTotals[product.BrandID] += product.Price * float64(it.Quantity)
	}

	deliveryAddress := formatDellymanAddress(req.Address, req.City, req.State, req.Country)
	quotes, total, err := quoteDellymanForBrands(database.DB, brandTotals, brandOrder, deliveryAddress)
	if err != nil {
		utils.BadRequest(c, err.Error(), nil)
		return
	}

	breakdown := make([]checkoutDellymanBrandQuote, 0, len(brandOrder))
	for _, brandID := range brandOrder {
		q := quotes[brandID]
		breakdown = append(breakdown, checkoutDellymanBrandQuote{
			BrandID:   brandID,
			BrandName: brandNames[brandID],
			Price:     q.Company.TotalPrice,
			Company:   q.Company.Name,
		})
	}

	utils.OK(c, "Delivery quote fetched", gin.H{
		"total":     total,
		"breakdown": breakdown,
	})
}

// ── Webhook ────────────────────────────────────────────────────────────────

// DellymanWebhook is POST /api/webhooks/dellyman — public, signature-
// verified. Dellyman posts Order.created/picked/delivered/cancelled events
// here as a courier booking progresses; we just update our own snapshot row
// so brand/buyer order views reflect live status.
func DellymanWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false})
		return
	}

	if !services.VerifyDellymanWebhookSignature(body, c.GetHeader("X-Dellyman-Signature")) {
		log.Printf("⚠️ Dellyman webhook rejected — bad signature")
		c.JSON(http.StatusUnauthorized, gin.H{"success": false})
		return
	}

	var payload services.WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false})
		return
	}

	var row models.OrderDellymanDelivery
	if err := database.DB.Where("dellyman_order_id = ?", fmt.Sprintf("%d", payload.Order.OrderID)).First(&row).Error; err != nil {
		log.Printf("⚠️ Dellyman webhook — no matching delivery for Dellyman order %d", payload.Order.OrderID)
		c.JSON(http.StatusOK, gin.H{"success": true}) // ack anyway, nothing to retry
		return
	}

	updates := map[string]interface{}{"raw_response": string(body)}
	switch strings.ToLower(payload.Order.OrderStatus) {
	case "picked", "picked_up", "in transit", "in_transit":
		updates["status"] = models.DellymanPicked
		now := time.Now()
		updates["picked_up_at"] = &now
	case "delivered":
		updates["status"] = models.DellymanDelivered
		now := time.Now()
		updates["delivered_at"] = &now
	case "cancelled", "canceled":
		updates["status"] = models.DellymanCancelled
	}

	database.DB.Model(&row).Updates(updates)
	c.JSON(http.StatusOK, gin.H{"success": true})
}
