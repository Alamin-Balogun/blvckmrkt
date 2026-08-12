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
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
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
// fallback if missing. AdminSaveSettings stores string values unquoted
// (not JSON-encoded), so try a JSON-string unmarshal first for values that
// happen to be JSON-encoded, then fall back to the raw column value.
func getAdminSettingString(key, fallback string) string {
	var row models.AdminSetting
	if err := database.DB.Where("setting_key = ?", key).First(&row).Error; err != nil {
		return fallback
	}
	var v string
	if err := json.Unmarshal([]byte(row.Value), &v); err == nil {
		return v
	}
	return row.Value
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

// dellymanPhone strips everything but digits — Dellyman rejects contact
// numbers with a leading "+" ("should contain only numbers"), but phone
// numbers are stored in E.164 (e.g. "+2348012345678") everywhere else in the
// app (see components/phoneinput.jsx), so every number must be reformatted
// right before it's sent to Dellyman.
func dellymanPhone(v string) string {
	var digits strings.Builder
	for _, r := range v {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	return digits.String()
}

// dellymanLandmark falls back to "N/A" — matching Dellyman's own documented
// convention — since PickUpLandmark/DeliveryLandmark are marked Required on
// BookOrder but we don't always have a real landmark to send.
func dellymanLandmark(v string) string {
	if v = strings.TrimSpace(v); v == "" {
		return "N/A"
	}
	return v
}

type dellymanQuote struct {
	Pickup  models.Address
	Brand   models.Brand
	Company services.QuoteCompany
	// Pending is true when Dellyman had no rate for this route at all (see
	// DellymanPendingQuote) — Company is zero-valued in that case.
	Pending bool
}

// dellymanPickupAddress finds the brand's designated Dellyman pickup address
// — the one Address row (from the brand's own Addresses page) flagged
// IsDellymanPickup. This is deliberately independent of PickupLocation,
// which is the buyer-facing self-collect option: a brand doesn't need to
// offer buyer pickup for Dellyman courier delivery to work, and vice versa.
func dellymanPickupAddress(tx *gorm.DB, brandID uint) (models.Brand, models.Address, error) {
	var brand models.Brand
	if err := tx.First(&brand, brandID).Error; err != nil {
		return brand, models.Address{}, fmt.Errorf("brand #%d not found", brandID)
	}

	var addr models.Address
	if err := tx.Where("user_id = ? AND is_dellyman_pickup = ?", brand.UserID, true).First(&addr).Error; err != nil {
		name := brand.BrandName
		if name == "" {
			name = fmt.Sprintf("Brand #%d", brandID)
		}
		return brand, models.Address{}, fmt.Errorf("%s hasn't set up a courier pickup address yet, so delivery isn't available for their items right now — please remove those items or try again once the brand has added one in their dashboard's Addresses page", name)
	}

	return brand, addr, nil
}

// quoteDellymanForBrands fetches a live Dellyman quote per brand — each
// brand ships from its own Dellyman pickup address — and picks the cheapest
// courier for each. brandTotals is the product subtotal per brand;
// brandOrder gives a stable iteration order.
//
// Dellyman only has a rate configured for a subset of pickup-state →
// delivery-state routes on this account (confirmed live: e.g. any pickup
// state other than Lagos is rejected outright, even delivering into a
// covered state) — so a brand that can't be quoted is NOT treated as a hard
// failure here. Per how the brand's arrangement with Dellyman actually
// works, they still physically deliver; the price gets negotiated with them
// on WhatsApp once they confirm, and admin sets it via the same
// final-destination-fee flow used for the state→exact-address leg. Only a
// genuine setup gap on our own side (no pickup address configured for the
// brand) still blocks checkout — that's within our control to fix.
func quoteDellymanForBrands(tx *gorm.DB, brandTotals map[uint]float64, brandOrder []uint, deliveryAddress string) (map[uint]dellymanQuote, float64, error) {
	quotes := make(map[uint]dellymanQuote, len(brandOrder))
	var total float64
	pickupDate := time.Now().Format("2006/01/02")

	for _, brandID := range brandOrder {
		brand, pickup, err := dellymanPickupAddress(tx, brandID)
		if err != nil {
			return nil, 0, err
		}

		resp, err := services.GetQuotes(services.QuoteRequest{
			PaymentMode:         config.App.DellymanDefaultPaymentMode,
			Vehicle:             config.App.DellymanDefaultVehicle,
			PickupRequestedDate: pickupDate,
			PickupRequestedTime: config.App.DellymanPickupWindow,
			PickupAddress:       formatDellymanAddress(pickup.Line1+" "+pickup.Line2, pickup.City, pickup.State, pickup.Country),
			DeliveryAddress:     []string{deliveryAddress},
			// Buyers already pay in full at checkout, so Dellyman must not
			// collect money for the goods on delivery — IsProductOrder stays 0.
			IsProductOrder: intPtr(0),
		})
		if err != nil {
			log.Printf("⚠️ Dellyman quote request failed for brand %d, leaving price pending: %v", brandID, err)
			quotes[brandID] = dellymanQuote{Pickup: pickup, Brand: brand, Pending: true}
			continue
		}
		if len(resp.Companies) == 0 {
			log.Printf("ℹ️ Dellyman has no rate yet for brand %d's route to %q, leaving price pending", brandID, deliveryAddress)
			quotes[brandID] = dellymanQuote{Pickup: pickup, Brand: brand, Pending: true}
			continue
		}

		cheapest := resp.Companies[0]
		for _, comp := range resp.Companies[1:] {
			if comp.TotalPrice < cheapest.TotalPrice {
				cheapest = comp
			}
		}

		quotes[brandID] = dellymanQuote{Pickup: pickup, Brand: brand, Company: cheapest}
		total += cheapest.TotalPrice
	}

	return quotes, total, nil
}

// createDellymanDeliveryRows persists one OrderDellymanDelivery snapshot per
// brand for an already-created order, status "quoted" — booking with the
// courier itself happens later, once payment is confirmed (see
// bookDellymanShipmentsForOrder).
func createDellymanDeliveryRows(tx *gorm.DB, orderID uint, quotes map[uint]dellymanQuote, brandOrder []uint, deliveryAddress, deliveryCity, deliveryState, deliveryCountry, deliveryLandmark, contactName, contactPhone string) error {
	for _, brandID := range brandOrder {
		q, ok := quotes[brandID]
		if !ok {
			continue
		}
		status := models.DellymanQuoted
		if q.Pending {
			status = models.DellymanPendingQuote
		}
		row := models.OrderDellymanDelivery{
			OrderID:              orderID,
			BrandID:              brandID,
			PickupAddressID:      q.Pickup.ID,
			DeliveryContactName:  contactName,
			DeliveryContactPhone: contactPhone,
			DeliveryAddress:      deliveryAddress,
			DeliveryCity:         deliveryCity,
			DeliveryState:        deliveryState,
			DeliveryCountry:      deliveryCountry,
			DeliveryLandmark:     deliveryLandmark,
			CompanyID:            q.Company.CompanyID,
			CompanyName:          q.Company.Name,
			Vehicle:              config.App.DellymanDefaultVehicle,
			Price:                q.Company.TotalPrice,
			Currency:             "NGN",
			OrderRef:             uuid.NewString(),
			Status:               status,
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
		var pickup models.Address
		if err := database.DB.First(&pickup, row.PickupAddressID).Error; err != nil {
			log.Printf("❌ Dellyman booking failed for order %s brand %d: pickup address %d not found", order.DisplayID, row.BrandID, row.PickupAddressID)
			database.DB.Model(&row).Updates(map[string]interface{}{
				"status":       models.DellymanFailed,
				"raw_response": "Dellyman pickup address not found at booking time",
			})
			continue
		}

		var pickupBrand models.Brand
		database.DB.Select("brand_name").First(&pickupBrand, row.BrandID)

		var packages []services.BookPackage
		for _, it := range itemsByBrand[row.BrandID] {
			packages = append(packages, services.BookPackage{
				PackageDescription:         fmt.Sprintf("%s x%d", it.ProductName, it.Quantity),
				DeliveryContactName:        row.DeliveryContactName,
				DeliveryContactNumber:      dellymanPhone(row.DeliveryContactPhone),
				PackageWeight:              config.App.DellymanDefaultPackageWeight,
				DeliveryGooglePlaceAddress: row.DeliveryAddress,
				DeliveryLandmark:           dellymanLandmark(row.DeliveryLandmark),
				ProductAmount:              it.TotalPrice,
			})
		}
		if len(packages) == 0 {
			packages = []services.BookPackage{{
				PackageDescription:         fmt.Sprintf("Order %s", order.DisplayID),
				DeliveryContactName:        row.DeliveryContactName,
				DeliveryContactNumber:      dellymanPhone(row.DeliveryContactPhone),
				PackageWeight:              config.App.DellymanDefaultPackageWeight,
				DeliveryGooglePlaceAddress: row.DeliveryAddress,
				DeliveryLandmark:           dellymanLandmark(row.DeliveryLandmark),
				ProductAmount:              row.Price,
			}}
		}

		resp, err := services.BookOrder(services.BookOrderRequest{
			OrderRef:                 row.OrderRef,
			CompanyID:                row.CompanyID,
			PaymentMode:              config.App.DellymanDefaultPaymentMode,
			Vehicle:                  row.Vehicle,
			PickUpContactName:        pickupBrand.BrandName,
			PickUpContactNumber:      dellymanPhone(pickup.Phone),
			PickUpGooglePlaceAddress: formatDellymanAddress(pickup.Line1+" "+pickup.Line2, pickup.City, pickup.State, pickup.Country),
			PickUpLandmark:           "N/A",
			// Buyers already pay in full at checkout, so Dellyman must not
			// collect money for the goods on delivery — IsProductOrder stays 0.
			IsProductOrder:        intPtr(0),
			PickUpRequestedDate:   pickupDate,
			PickUpRequestedTime:   config.App.DellymanPickupWindow,
			DeliveryRequestedTime: config.App.DellymanPickupWindow,
			DeliveryTimeline:      "sameDay",
			Packages:              packages,
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

// cancelDellymanDeliveriesForOrder is called when a buyer or brand cancels an
// order — best-effort attempt to also cancel any still-active courier
// bookings. services.CancelOrder's endpoint is unconfirmed (see the comment
// on it), so a failure here is logged for manual admin follow-up rather than
// blocking the order cancellation itself, which must always succeed on our
// side regardless of whether Dellyman's side can be reached.
// sendGoodsDeliveredEmailForRow emails the brand a "letter of goods delivery"
// once Dellyman confirms their shipment for an order was delivered. Scoped
// to just this brand's items in the order — an order can span brands, each
// gets its own delivery row and its own email, only when its own row lands.
func sendGoodsDeliveredEmailForRow(rowID uint) {
	var row models.OrderDellymanDelivery
	if err := database.DB.First(&row, rowID).Error; err != nil {
		return
	}

	var order models.Order
	if err := database.DB.First(&order, row.OrderID).Error; err != nil {
		return
	}

	type brandWithEmail struct {
		BrandName string
		Email     string
	}
	var brand brandWithEmail
	database.DB.Table("brands b").
		Select("b.brand_name, u.email").
		Joins("LEFT JOIN users u ON u.id = b.user_id").
		Where("b.id = ?", row.BrandID).
		Scan(&brand)
	if brand.Email == "" {
		log.Printf("⚠️ sendGoodsDeliveredEmailForRow: no email on file for brand %d, skipping", row.BrandID)
		return
	}

	var orderItems []models.OrderItem
	database.DB.Where("order_id = ? AND brand_id = ?", row.OrderID, row.BrandID).Find(&orderItems)
	items := make([]utils.OrderConfirmationItem, len(orderItems))
	for i, it := range orderItems {
		items[i] = utils.OrderConfirmationItem{
			Name: it.ProductName, Size: it.Size, Quantity: it.Quantity,
			UnitPrice: it.UnitPrice, Total: it.TotalPrice, ImageURL: it.ImageURL,
		}
	}

	deliveredAt := "just now"
	if row.DeliveredAt != nil {
		deliveredAt = row.DeliveredAt.Format("Jan 2, 2006 · 3:04 PM")
	}

	err := utils.SendGoodsDeliveredEmail(utils.GoodsDeliveredData{
		BrandName: brand.BrandName, BrandEmail: brand.Email,
		OrderID: order.DisplayID, DeliveredAt: deliveredAt,
		TrackingID: row.TrackingID, CourierCompany: row.CompanyName,
		Currency: order.Currency, Items: items,
	})
	if err != nil {
		log.Printf("⚠️ Failed to send goods-delivered email for order %s brand %d: %v", order.DisplayID, row.BrandID, err)
	}
}

// ── POST /api/brand/orders/dellyman/:delivery_id/confirm-pickup ──────────────
// Lets a brand manually confirm they've handed their package to the Dellyman
// rider — a fallback for when Dellyman's own "picked up" webhook is late or
// never arrives, since the brand is physically there to know it happened.
func BrandConfirmDellymanPickup(c *gin.Context) {
	userID := c.GetUint("userID")
	deliveryID, err := strconv.ParseUint(c.Param("delivery_id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid delivery ID", nil)
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var row models.OrderDellymanDelivery
	if err := database.DB.Where("id = ? AND brand_id = ?", deliveryID, brand.ID).First(&row).Error; err != nil {
		utils.NotFound(c, "Delivery not found")
		return
	}

	if row.Status != models.DellymanBooked {
		switch row.Status {
		case models.DellymanQuoted:
			utils.BadRequest(c, "This courier hasn't been booked yet", nil)
		case models.DellymanPicked, models.DellymanDelivered:
			utils.Conflict(c, "This pickup has already been confirmed")
		default:
			utils.BadRequest(c, "This delivery can't be confirmed right now", nil)
		}
		return
	}

	now := time.Now()
	database.DB.Model(&row).Updates(map[string]interface{}{
		"status":       models.DellymanPicked,
		"picked_up_at": &now,
	})
	syncOrderStatusFromDellyman(row.OrderID)

	utils.OK(c, "Pickup confirmed — the courier is on the way", gin.H{
		"delivery_id": row.ID,
		"status":      models.DellymanPicked,
	})
}

// sendDellymanCancelAlert emails ops the details needed to manually cancel a
// booked/picked Dellyman shipment by hand — see the package-level comment on
// services.CancelOrder for why this can't just be an API call.
func sendDellymanCancelAlert(row models.OrderDellymanDelivery) {
	var order models.Order
	database.DB.First(&order, row.OrderID)

	type brandName struct{ BrandName string }
	var b brandName
	database.DB.Table("brands").Select("brand_name").Where("id = ?", row.BrandID).Scan(&b)

	err := utils.SendDellymanCancelAlertEmail(utils.DellymanCancelAlertData{
		OrderID: order.DisplayID, DellymanOrderID: row.DellymanOrderID,
		TrackingID: row.TrackingID, CourierCompany: row.CompanyName,
		BrandName: b.BrandName, BuyerName: row.DeliveryContactName,
		BuyerPhone: row.DeliveryContactPhone, DeliveryAddress: row.DeliveryAddress,
		CancelledAt: time.Now().Format("Jan 2, 2006 · 3:04 PM"),
	})
	if err != nil {
		log.Printf("⚠️ Failed to send Dellyman cancel alert for order %s delivery %d: %v", order.DisplayID, row.ID, err)
	}
}

func cancelDellymanDeliveriesForOrder(orderID uint) {
	var rows []models.OrderDellymanDelivery
	database.DB.Where("order_id = ? AND status IN ?", orderID,
		[]models.DellymanShipmentStatus{models.DellymanQuoted, models.DellymanBooked, models.DellymanPicked},
	).Find(&rows)

	for _, row := range rows {
		database.DB.Model(&row).Update("status", models.DellymanCancelled)
		if row.DellymanOrderID != "" {
			// Dellyman has no cancel-order API (confirmed by them directly) —
			// this one already had a rider assigned, so ops needs to go
			// cancel it by hand in the Dellyman app. Quoted-only rows
			// (DellymanOrderID empty) never reached Dellyman at all, so
			// there's nothing for a human to do there.
			go sendDellymanCancelAlert(row)
		}
	}
}

// ── Final destination fee ─────────────────────────────────────────────────
//
// Dellyman only prices pickup→state at checkout (see quoteDellymanForBrands),
// so the state→exact-address leg is negotiated by hand with Dellyman over
// WhatsApp once a brand's shipment reaches the buyer's state. Admin types
// the agreed amount in here, which generates a fresh Paystack payment link
// and notifies the buyer in-app and by email with a "Pay Now" button/link.

type adminSetFinalPriceRequest struct {
	Amount float64 `json:"amount" binding:"required,gt=0"`
}

// AdminSetDellymanFinalPrice is POST
// /api/admin/dellyman-deliveries/:id/final-price.
func AdminSetDellymanFinalPrice(c *gin.Context) {
	deliveryID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid delivery ID", nil)
		return
	}

	var req adminSetFinalPriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}

	var row models.OrderDellymanDelivery
	if err := database.DB.First(&row, deliveryID).Error; err != nil {
		utils.NotFound(c, "Delivery not found")
		return
	}

	var order models.Order
	if err := database.DB.First(&order, row.OrderID).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}
	if order.ContactEmail == "" {
		utils.BadRequest(c, "This order has no contact email on file", nil)
		return
	}

	currency := order.Currency
	if currency == "" {
		currency = "NGN"
	}

	var existing models.DellymanFinalCharge
	hasExisting := database.DB.Where("delivery_id = ?", deliveryID).First(&existing).Error == nil
	if hasExisting && existing.Status == models.FinalChargePaid {
		utils.Conflict(c, "This final delivery fee has already been paid")
		return
	}

	callbackBase := os.Getenv("PAYSTACK_CALLBACK_URL")
	if callbackBase == "" {
		callbackBase = os.Getenv("FLUTTERWAVE_REDIRECT_URL")
	}
	if callbackBase == "" {
		utils.InternalError(c, "Payment gateway not configured")
		return
	}
	callbackURL := withQueryParam(callbackBase, "gateway", "final-delivery-fee")

	reference := "FDP-" + uuid.NewString()
	link, err := createPaystackPaymentLink(reference, req.Amount, currency, order.ContactEmail, callbackURL)
	if err != nil {
		log.Printf("❌ Failed to create final-destination-fee payment link for delivery %d: %v", deliveryID, err)
		utils.InternalError(c, "Failed to create payment link")
		return
	}

	charge := existing
	charge.DeliveryID = uint(deliveryID)
	charge.OrderID = row.OrderID
	charge.UserID = order.UserID
	charge.Amount = req.Amount
	charge.Currency = currency
	charge.Reference = reference
	charge.PaymentURL = link
	charge.Status = models.FinalChargePending
	charge.PaidAt = nil

	if hasExisting {
		err = database.DB.Save(&charge).Error
	} else {
		err = database.DB.Create(&charge).Error
	}
	if err != nil {
		log.Printf("❌ Failed to save final-destination charge for delivery %d: %v", deliveryID, err)
		utils.InternalError(c, "Failed to save charge")
		return
	}

	if order.UserID != nil {
		database.DB.Create(&models.Notification{
			UserID: *order.UserID,
			Type:   models.NotifOrder,
			Title:  fmt.Sprintf("Final delivery fee for order %s", order.DisplayID),
			Body: fmt.Sprintf(
				"Your order has reached %s. Pay the final delivery fee of %s %.2f to get it delivered to your address.",
				row.DeliveryState, currency, req.Amount,
			),
			RefType:     "dellyman_final_charge",
			RefID:       &charge.ID,
			ActionURL:   link,
			ActionLabel: fmt.Sprintf("Pay %s %.2f", currency, req.Amount),
		})
	}

	go func() {
		if err := utils.SendFinalDestinationPriceEmail(utils.FinalDestinationPriceData{
			BuyerEmail: order.ContactEmail,
			OrderID:    order.DisplayID,
			State:      row.DeliveryState,
			City:       row.DeliveryCity,
			Amount:     req.Amount,
			Currency:   currency,
			PaymentURL: link,
		}); err != nil {
			log.Printf("⚠️ Failed to send final-destination-price email for delivery %d: %v", deliveryID, err)
		}
	}()

	utils.OK(c, "Final delivery fee set — buyer notified", gin.H{"charge": charge})
}

type finalizeFinalChargeRequest struct {
	Reference string `json:"reference" binding:"required"`
}

// FinalizeDellymanFinalCharge is POST
// /api/checkout/final-delivery-fee/finalize — public (reached from an
// emailed "Pay Now" link, which guest buyers must also be able to use
// without logging in), so it's verified purely against the Paystack
// reference rather than a session, mirroring how guest checkout itself works.
func FinalizeDellymanFinalCharge(c *gin.Context) {
	var body finalizeFinalChargeRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}

	var charge models.DellymanFinalCharge
	if err := database.DB.Where("reference = ?", body.Reference).First(&charge).Error; err != nil {
		utils.NotFound(c, "Payment not found")
		return
	}
	if charge.Status == models.FinalChargePaid {
		utils.OK(c, "Already paid", gin.H{"charge": charge})
		return
	}

	verification, err := utils.VerifyPaystackPayment(body.Reference)
	if err != nil {
		utils.BadRequest(c, "Payment verification failed: "+err.Error(), nil)
		return
	}
	if verification.Data.Status != "success" {
		utils.BadRequest(c, "Payment was not successful", nil)
		return
	}
	expected := int64(math.Round(charge.Amount * 100))
	if verification.Data.Amount != expected || !strings.EqualFold(verification.Data.Currency, charge.Currency) {
		log.Printf("❌ Final-destination-fee amount mismatch for reference=%s: expected=%d %s got=%d %s",
			body.Reference, expected, charge.Currency, verification.Data.Amount, verification.Data.Currency)
		utils.BadRequest(c, "Payment amount mismatch — please contact support", nil)
		return
	}

	now := time.Now()
	database.DB.Model(&charge).Updates(map[string]interface{}{
		"status":  models.FinalChargePaid,
		"paid_at": &now,
	})
	charge.Status = models.FinalChargePaid
	charge.PaidAt = &now

	utils.OK(c, "Final delivery fee paid — thank you!", gin.H{"charge": charge})
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
	// City is optional — Dellyman prices per state, not city (confirmed:
	// identical price across different cities in the same state), so a
	// state-only preview (e.g. the cart page's destination-state dropdown,
	// before a full address is collected at checkout) is a valid quote too.
	City    string `json:"city"`
	State   string `json:"state" binding:"required"`
	Country string `json:"country" binding:"required"`
}

type checkoutDellymanBrandQuote struct {
	BrandID   uint    `json:"brand_id"`
	BrandName string  `json:"brand_name"`
	Price     float64 `json:"price"`
	Company   string  `json:"company"`
	// Pending is true when Dellyman has no rate for this route yet — the
	// buyer can still check out, the real price is set later via the
	// final-destination-fee flow once negotiated with the courier.
	Pending bool `json:"pending"`
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

	city := req.City
	if city == "" {
		// State-only preview (e.g. the cart page) — Dellyman still expects an
		// address string to geocode, and since price is state-invariant
		// anyway, the state name itself is a safe stand-in for the city.
		city = req.State
	}
	deliveryAddress := formatDellymanAddress(req.Address, city, req.State, req.Country)
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
			Pending:   q.Pending,
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
	if err := database.DB.Where("dellyman_order_id = ?", payload.Order.OrderID).First(&row).Error; err != nil {
		log.Printf("⚠️ Dellyman webhook — no matching delivery for Dellyman order %s", payload.Order.OrderID)
		c.JSON(http.StatusOK, gin.H{"success": true}) // ack anyway, nothing to retry
		return
	}

	// Real Dellyman OrderStatus values are PENDING/ASSIGNED/INTRANSIT/
	// COMPLETED/CANCELLED (confirmed against their GetOrder/webhook docs) —
	// not the "in transit"/"delivered" style strings this used to check for.
	updates := map[string]interface{}{"raw_response": string(body)}
	switch strings.ToLower(payload.Order.OrderStatus) {
	case "intransit":
		updates["status"] = models.DellymanPicked
		now := time.Now()
		updates["picked_up_at"] = &now
	case "completed":
		updates["status"] = models.DellymanDelivered
		now := time.Now()
		updates["delivered_at"] = &now
	case "cancelled", "canceled":
		updates["status"] = models.DellymanCancelled
	}

	database.DB.Model(&row).Updates(updates)
	syncOrderStatusFromDellyman(row.OrderID)
	if status, ok := updates["status"]; ok && status == models.DellymanDelivered {
		go sendGoodsDeliveredEmailForRow(row.ID)
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// syncOrderStatusFromDellyman rolls the buyer-facing Order.Status up from the
// per-brand courier delivery rows after a webhook update. An order can have
// several brands' items, each with its own courier booking, so:
//   - once every brand's delivery has been picked up or delivered, the order
//     is at least "shipped" — flip it up from pending/processing.
//   - once every brand's delivery is delivered, the whole order is delivered.
//
// A single row going "cancelled" does NOT cancel the whole order — other
// brands' items in the same order may still be in progress; that stays a
// manual/admin decision.
func syncOrderStatusFromDellyman(orderID uint) {
	var rows []models.OrderDellymanDelivery
	if err := database.DB.Where("order_id = ?", orderID).Find(&rows).Error; err != nil || len(rows) == 0 {
		return
	}

	var order models.Order
	if err := database.DB.First(&order, orderID).Error; err != nil {
		return
	}
	if order.Status == models.OrderCancelled || order.Status == models.OrderRefunded {
		return
	}

	allDelivered := true
	anyInTransit := false
	for _, r := range rows {
		if r.Status != models.DellymanDelivered {
			allDelivered = false
		}
		if r.Status == models.DellymanPicked || r.Status == models.DellymanDelivered {
			anyInTransit = true
		}
	}

	if allDelivered {
		database.DB.Model(&order).Update("status", models.OrderDelivered)
	} else if anyInTransit && (order.Status == models.OrderPending || order.Status == models.OrderProcessing) {
		database.DB.Model(&order).Update("status", models.OrderShipped)
	}
}

// ── Locations (states/cities Dellyman's own network recognizes) ────────────
//
// Their "GetQuotes"/"BookOrder" flow expects a free-text address, but the
// country-state-city npm package used everywhere on the frontend for
// suggestions doesn't have Dellyman's own area names (e.g. Lagos "Ketu",
// "Agric" — real Dellyman city entries missing from that generic dataset).
// Discovered these two undocumented endpoints by probing the API; they
// return Dellyman's actual State/City reference list, which the frontend
// merges into its typeahead suggestions so users can pick names that match
// what Dellyman expects, cutting down address mismatches at quote time.
//
// This is near-static reference data, so it's cached in memory rather than
// re-fetched (37 states x 1 cities call each) on every request.
var (
	dellymanLocationsCache   map[string][]string
	dellymanLocationsCacheAt time.Time
	dellymanLocationsMu      sync.Mutex
)

const dellymanLocationsCacheTTL = 24 * time.Hour

func fetchDellymanLocations() (map[string][]string, error) {
	states, err := services.GetStates()
	if err != nil {
		return nil, err
	}

	result := make(map[string][]string, len(states))
	for _, s := range states {
		cities, err := services.GetCities(s.StateID)
		if err != nil {
			log.Printf("⚠️ Dellyman: failed to fetch cities for state %s (%s): %v", s.Name, s.StateID, err)
			continue
		}
		names := make([]string, len(cities))
		for i, city := range cities {
			names[i] = city.Name
		}
		result[s.Name] = names
	}
	return result, nil
}

// WarmDellymanLocationsCache pre-fetches the states/cities cache in the
// background at server startup, so the first real request doesn't have to
// wait on ~38 sequential live Dellyman calls.
func WarmDellymanLocationsCache() {
	result, err := fetchDellymanLocations()
	if err != nil {
		log.Printf("⚠️ Dellyman: failed to warm locations cache at startup: %v", err)
		return
	}
	dellymanLocationsMu.Lock()
	dellymanLocationsCache = result
	dellymanLocationsCacheAt = time.Now()
	dellymanLocationsMu.Unlock()
	log.Printf("[boot] Dellyman locations cache warmed — %d states", len(result))
}

// DellymanLocations is GET /api/dellyman/locations — public. Returns every
// state → [city names] Dellyman's own network recognizes.
func DellymanLocations(c *gin.Context) {
	dellymanLocationsMu.Lock()
	cached := dellymanLocationsCache
	fresh := cached != nil && time.Since(dellymanLocationsCacheAt) < dellymanLocationsCacheTTL
	dellymanLocationsMu.Unlock()

	if fresh {
		utils.OK(c, "Dellyman locations fetched", gin.H{"states": cached})
		return
	}

	result, err := fetchDellymanLocations()
	if err != nil {
		if cached != nil {
			// Serve stale data rather than nothing if Dellyman's API is down.
			utils.OK(c, "Dellyman locations fetched (cached)", gin.H{"states": cached})
			return
		}
		utils.InternalError(c, "Failed to fetch courier locations")
		return
	}

	dellymanLocationsMu.Lock()
	dellymanLocationsCache = result
	dellymanLocationsCacheAt = time.Now()
	dellymanLocationsMu.Unlock()

	utils.OK(c, "Dellyman locations fetched", gin.H{"states": result})
}
