// handlers/payment_gateway.go
//
// Hosted-checkout (redirect) flow for gateways that should open in their own
// browser tab instead of an embedded modal/iframe. The customer's tab leaves
// our app entirely while they pay, so the pending order can't just live in
// frontend memory — it's priced and parked as a models.PaymentIntent here,
// then finalized once the gateway sends the browser back to our
// FLUTTERWAVE_REDIRECT_URL page with the transaction result.
package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ── Flutterwave hosted payment link ─────────────────────────────────────────────

type flutterwaveInitResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Link string `json:"link"`
	} `json:"data"`
}

func createFlutterwavePaymentLink(txRef string, amount float64, currency, email, phone, name, redirectURL string) (string, error) {
	secretKey := os.Getenv("FLUTTERWAVE_SECRET_KEY")
	if secretKey == "" {
		return "", fmt.Errorf("FLUTTERWAVE_SECRET_KEY not set")
	}

	body, _ := json.Marshal(map[string]interface{}{
		"tx_ref":          txRef,
		"amount":          amount,
		"currency":        currency,
		"redirect_url":    redirectURL,
		"payment_options": "card,mobilemoney,ussd,banktransfer",
		"customer": map[string]string{
			"email":       email,
			"phonenumber": phone,
			"name":        name,
		},
		"customizations": map[string]string{
			"title":       "BLVCKMRKT",
			"description": "Order Payment",
		},
	})

	req, err := http.NewRequest("POST", "https://api.flutterwave.com/v3/payments", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to build Flutterwave request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+secretKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Flutterwave request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Flutterwave response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Flutterwave returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result flutterwaveInitResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse Flutterwave response: %w", err)
	}
	if result.Status != "success" || result.Data.Link == "" {
		return "", fmt.Errorf("Flutterwave link creation failed: %s", result.Message)
	}
	return result.Data.Link, nil
}

// quoteOrderTotal prices the cart from live product data — the same
// "current price wins" rule buildOrder applies — without touching stock, so we
// know how much to charge before the order (and any stock decrement) exists.
func quoteOrderTotal(req createOrderRequest) (float64, error) {
	var subtotal float64
	for _, it := range req.Items {
		var product models.Product
		if err := database.DB.First(&product, it.ProductID).Error; err != nil {
			return 0, fmt.Errorf("product %d not found", it.ProductID)
		}
		unitPrice := product.Price
		if unitPrice <= 0 {
			unitPrice = it.UnitPrice
		}
		subtotal += unitPrice * float64(it.Quantity)
	}

	shippingFee := req.ShippingCost
	if shippingFee < 0 {
		shippingFee = 0
	}
	discount := req.Discount
	if discount < 0 {
		discount = 0
	}
	total := subtotal - discount + shippingFee
	if total < 0 {
		total = 0
	}
	return total, nil
}

func customerNameFromRequest(req createOrderRequest) string {
	if req.Delivery != nil {
		name := strings.TrimSpace(req.Delivery.FirstName + " " + req.Delivery.LastName)
		if name != "" {
			return name
		}
	}
	return "Guest"
}

// withQueryParam appends a key=value pair to a URL, using "&" if the URL
// already has a query string. Used to tag the shared /payment/callback page
// with ?gateway=... so one frontend route can finalize either gateway.
func withQueryParam(rawURL, key, value string) string {
	sep := "?"
	if strings.Contains(rawURL, "?") {
		sep = "&"
	}
	return rawURL + sep + key + "=" + value
}

// ── POST /api/user/payments/flutterwave/initiate ────────────────────────────────
// Prices the pending order, parks it (keyed by tx_ref) so the finalize step can
// build it once Flutterwave redirects back, and returns a hosted checkout link
// for the frontend to open in a new tab.
func InitiateFlutterwavePayment(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}
	if err := validateCreateOrderRequest(req); err != nil {
		utils.BadRequest(c, err.Error(), nil)
		return
	}

	total, err := quoteOrderTotal(req)
	if err != nil {
		utils.BadRequest(c, err.Error(), nil)
		return
	}
	if total <= 0 {
		utils.BadRequest(c, "Invalid order amount", nil)
		return
	}

	payloadJSON, err := json.Marshal(req)
	if err != nil {
		utils.InternalError(c, "Failed to prepare order")
		return
	}

	txRef := "FLW-" + generateOrderReference()
	intent := models.PaymentIntent{
		TxRef:    txRef,
		UserID:   uid,
		Gateway:  "flutterwave",
		Amount:   total,
		Currency: req.Currency,
		Payload:  string(payloadJSON),
		Status:   models.IntentPending,
	}
	if err := database.DB.Create(&intent).Error; err != nil {
		log.Printf("❌ Failed to create payment intent: %v", err)
		utils.InternalError(c, "Failed to start payment")
		return
	}

	redirectURL := os.Getenv("FLUTTERWAVE_REDIRECT_URL")
	if redirectURL == "" {
		utils.InternalError(c, "Payment gateway not configured")
		return
	}
	redirectURL = withQueryParam(redirectURL, "gateway", "flutterwave")

	link, err := createFlutterwavePaymentLink(
		txRef, total, req.Currency,
		req.Contact.Email, req.Contact.Phone, customerNameFromRequest(req),
		redirectURL,
	)
	if err != nil {
		log.Printf("❌ Flutterwave link creation failed: %v", err)
		database.DB.Model(&intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": err.Error(),
		})
		utils.InternalError(c, "Failed to initialize payment")
		return
	}

	log.Printf("✅ Flutterwave payment link created: tx_ref=%s amount=%.2f %s", txRef, total, req.Currency)
	utils.OK(c, "Payment link created", gin.H{"link": link, "tx_ref": txRef})
}

// claimIntentOrWait atomically flips a PENDING PaymentIntent to PROCESSING so
// only one caller actually verifies the payment and builds the order. The
// frontend's /payment/callback finalize call and the gateway's server-to-server
// webhook can both arrive for the same tx_ref within milliseconds of each
// other, and a plain "if intent.Status == Completed" read-check in each
// caller (what this used to rely on) doesn't stop both from passing that
// check before either has written anything — the actual DB write only
// happens after a slow outbound payment-verification call, which is exactly
// the window the race lands in. That produced duplicate orders, duplicate
// stock decrements, and duplicate confirmation emails.
//
// If this caller loses the claim, it polls briefly for the winner to finish
// and returns that result instead of finalizing a second time.
func claimIntentOrWait(intent *models.PaymentIntent) (order models.Order, handled bool, err error) {
	res := database.DB.Model(&models.PaymentIntent{}).
		Where("id = ? AND status = ?", intent.ID, models.IntentPending).
		Update("status", models.IntentProcessing)

	if res.RowsAffected == 1 {
		intent.Status = models.IntentProcessing
		return models.Order{}, false, nil // won the claim — caller proceeds to finalize
	}

	for i := 0; i < 10; i++ {
		time.Sleep(300 * time.Millisecond)
		var fresh models.PaymentIntent
		if dbErr := database.DB.First(&fresh, intent.ID).Error; dbErr != nil {
			return models.Order{}, true, fmt.Errorf("failed to check payment status")
		}
		if fresh.Status == models.IntentCompleted {
			var finishedOrder models.Order
			if fresh.OrderID != nil {
				database.DB.Preload("Items").First(&finishedOrder, *fresh.OrderID)
			}
			return finishedOrder, true, nil
		}
		if fresh.Status == models.IntentFailed {
			return models.Order{}, true, fmt.Errorf("Payment failed%s", condSuffix(fresh.FailureReason))
		}
	}
	return models.Order{}, true, fmt.Errorf("Payment is still being processed — please check back in a moment")
}

// finalizeFlutterwaveIntent verifies a Flutterwave charge and builds the real
// order for a pending PaymentIntent. Shared by the frontend-triggered finalize
// endpoint (below) and the FlutterwaveWebhook safety net in webhooks.go —
// claimIntentOrWait above ensures whichever one arrives first is the only one
// that actually builds the order.
func finalizeFlutterwaveIntent(intent *models.PaymentIntent, transactionID string) (models.Order, error) {
	if transactionID == "" {
		return models.Order{}, fmt.Errorf("missing transaction id")
	}

	if order, handled, claimErr := claimIntentOrWait(intent); handled {
		return order, claimErr
	}

	verification, err := utils.VerifyFlutterwavePayment(transactionID)
	if err != nil {
		database.DB.Model(intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": err.Error(),
		})
		return models.Order{}, fmt.Errorf("Payment verification failed: %w", err)
	}

	if verification.Data.TxRef != intent.TxRef {
		return models.Order{}, fmt.Errorf("Payment reference mismatch")
	}
	// ✅ Rounded comparison — see the note in create_order.go's Flutterwave
	// branch for why a naked float `!=` here was rejecting real payments.
	if math.Round(verification.Data.Amount*100) != math.Round(intent.Amount*100) ||
		!strings.EqualFold(verification.Data.Currency, intent.Currency) {
		log.Printf("❌ Amount/currency mismatch for tx_ref=%s: expected=%.2f %s got=%.2f %s",
			intent.TxRef, intent.Amount, intent.Currency, verification.Data.Amount, verification.Data.Currency)
		database.DB.Model(intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": "Amount/currency mismatch",
		})
		return models.Order{}, fmt.Errorf("Payment amount mismatch")
	}

	var req createOrderRequest
	if err := json.Unmarshal([]byte(intent.Payload), &req); err != nil {
		log.Printf("❌ Failed to unmarshal payment intent payload for tx_ref=%s: %v", intent.TxRef, err)
		return models.Order{}, fmt.Errorf("Failed to build order")
	}

	channel := verification.Data.PaymentType
	cardType, cardLast4 := "", ""
	if verification.Data.Card != nil {
		cardType = verification.Data.Card.Type
		cardLast4 = verification.Data.Card.Last4Digits
	}
	responseJSON, _ := json.Marshal(verification.Data)

	order, txErr := buildOrder(&intent.UserID, req, "paid", verification.Data.TxRef, func(tx *gorm.DB, orderID uint, orderTotal float64) error {
		gatewayDetails := models.OrderPaymentGateway{
			OrderID:         orderID,
			Gateway:         "flutterwave",
			TransactionID:   verification.Data.TxRef,
			Reference:       verification.Data.TxRef,
			Amount:          orderTotal,
			Currency:        req.Currency,
			Status:          "success",
			Channel:         channel,
			CardType:        cardType,
			CardLast4:       cardLast4,
			CustomerEmail:   req.Contact.Email,
			GatewayResponse: string(responseJSON),
			VerifiedAt:      time.Now(),
		}
		return tx.Create(&gatewayDetails).Error
	})
	if txErr != nil {
		log.Printf("❌ Order build failed for tx_ref=%s: %v", intent.TxRef, txErr)
		database.DB.Model(intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": txErr.Error(),
		})
		return models.Order{}, txErr
	}

	database.DB.Model(intent).Updates(map[string]interface{}{
		"status":    models.IntentCompleted,
		"order_id":  order.ID,
		"order_ref": order.DisplayID,
	})

	firstName := customerNameFromRequest(req)
	go sendOrderConfirmationEmail(order, firstName, req.Contact.Email)

	log.Printf("✅ Flutterwave order finalized: %s (tx_ref=%s)", order.DisplayID, intent.TxRef)
	return order, nil
}

// ── POST /api/user/payments/flutterwave/finalize ─────────────────────────────────
// Called by the frontend's /payment/callback page (opened in the same tab
// Flutterwave redirects back to) once it has the tx_ref/transaction_id/status
// query params. Verifies the charge server-side and builds the real order —
// this is the step that was missing before, which is why paid Flutterwave
// orders weren't showing up in the orders table.
func FinalizeFlutterwavePayment(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	var body struct {
		TxRef         string `json:"tx_ref" binding:"required"`
		Status        string `json:"status"`
		TransactionID string `json:"transaction_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}

	var intent models.PaymentIntent
	if err := database.DB.Where("tx_ref = ? AND user_id = ?", body.TxRef, uid).First(&intent).Error; err != nil {
		utils.NotFound(c, "Payment not found")
		return
	}

	// Idempotent: a page refresh, or the webhook safety net beating us to it,
	// just returns the prior result.
	if intent.Status == models.IntentCompleted {
		utils.OK(c, "Order already created", gin.H{
			"order_ref": intent.OrderRef,
			"order_id":  intent.OrderID,
		})
		return
	}
	if intent.Status == models.IntentFailed {
		utils.BadRequest(c, "This payment failed"+condSuffix(intent.FailureReason), nil)
		return
	}

	if body.Status != "successful" || body.TransactionID == "" {
		database.DB.Model(&intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": "Payment was not completed (status: " + body.Status + ")",
		})
		utils.BadRequest(c, "Payment was not completed", nil)
		return
	}

	order, err := finalizeFlutterwaveIntent(&intent, body.TransactionID)
	if err != nil {
		log.Printf("❌ Flutterwave finalize failed for tx_ref=%s: %v", body.TxRef, err)
		utils.BadRequest(c, err.Error(), nil)
		return
	}

	utils.OK(c, "Order created", gin.H{
		"order": gin.H{
			"id":             order.ID,
			"display_id":     order.DisplayID,
			"reference":      order.DisplayID,
			"status":         order.Status,
			"payment_status": order.PaymentStatus,
			"total":          order.Total,
			"currency":       order.Currency,
		},
	})
}

// ── GET /api/user/payments/status ───────────────────────────────────────────────
// Read-only lookup so the original checkout tab can poll for completion as a
// fallback if it can't rely on window.opener messaging from the payment tab.
func GetPaymentIntentStatus(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	txRef := c.Query("tx_ref")
	if txRef == "" {
		utils.BadRequest(c, "tx_ref is required", nil)
		return
	}

	var intent models.PaymentIntent
	if err := database.DB.Where("tx_ref = ? AND user_id = ?", txRef, uid).First(&intent).Error; err != nil {
		utils.NotFound(c, "Payment not found")
		return
	}

	utils.OK(c, "Payment status fetched", gin.H{
		"status":         intent.Status,
		"order_id":       intent.OrderID,
		"order_ref":      intent.OrderRef,
		"failure_reason": intent.FailureReason,
	})
}

func condSuffix(reason string) string {
	if reason == "" {
		return ""
	}
	return ": " + reason
}

// ── Paystack hosted payment link ─────────────────────────────────────────────
// Card payments are currently marked "Coming Soon" in the UI while a Paystack
// dashboard config issue gets sorted out, but the flow below is wired up the
// same way as Flutterwave's hosted checkout (park a PaymentIntent, redirect
// to a hosted page, finalize on return) so it's ready to flip on.

type paystackInitResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

func createPaystackPaymentLink(reference string, amount float64, currency, email, callbackURL string) (string, error) {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")
	if secretKey == "" {
		return "", fmt.Errorf("PAYSTACK_SECRET_KEY not set")
	}

	body, _ := json.Marshal(map[string]interface{}{
		"reference":    reference,
		"amount":       int64(math.Round(amount * 100)), // Paystack expects the smallest currency unit
		"currency":     currency,
		"email":        email,
		"callback_url": callbackURL,
	})

	req, err := http.NewRequest("POST", "https://api.paystack.co/transaction/initialize", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to build Paystack request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+secretKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Paystack request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Paystack response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Paystack returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var result paystackInitResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("failed to parse Paystack response: %w", err)
	}
	if !result.Status || result.Data.AuthorizationURL == "" {
		return "", fmt.Errorf("Paystack link creation failed: %s", result.Message)
	}
	return result.Data.AuthorizationURL, nil
}

// finalizePaystackIntent verifies a Paystack charge and builds the real order
// for a pending PaymentIntent. Mirrors finalizeFlutterwaveIntent — shared by
// the frontend finalize endpoint and the PaystackWebhook safety net, with the
// same claimIntentOrWait guard against both firing at once.
func finalizePaystackIntent(intent *models.PaymentIntent, reference string) (models.Order, error) {
	if reference == "" {
		return models.Order{}, fmt.Errorf("missing payment reference")
	}

	if order, handled, claimErr := claimIntentOrWait(intent); handled {
		return order, claimErr
	}

	verification, err := utils.VerifyPaystackPayment(reference)
	if err != nil {
		database.DB.Model(intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": err.Error(),
		})
		return models.Order{}, fmt.Errorf("Payment verification failed: %w", err)
	}

	if verification.Data.Reference != intent.TxRef {
		return models.Order{}, fmt.Errorf("Payment reference mismatch")
	}
	expected := int64(math.Round(intent.Amount * 100))
	if verification.Data.Amount != expected || !strings.EqualFold(verification.Data.Currency, intent.Currency) {
		log.Printf("❌ Amount/currency mismatch for reference=%s: expected=%d %s got=%d %s",
			intent.TxRef, expected, intent.Currency, verification.Data.Amount, verification.Data.Currency)
		database.DB.Model(intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": "Amount/currency mismatch",
		})
		return models.Order{}, fmt.Errorf("Payment amount mismatch")
	}

	var req createOrderRequest
	if err := json.Unmarshal([]byte(intent.Payload), &req); err != nil {
		log.Printf("❌ Failed to unmarshal payment intent payload for reference=%s: %v", intent.TxRef, err)
		return models.Order{}, fmt.Errorf("Failed to build order")
	}

	channel := verification.Data.Channel
	cardType, cardLast4 := "", ""
	if verification.Data.Authorization != nil {
		cardType = verification.Data.Authorization.CardType
		cardLast4 = verification.Data.Authorization.Last4
	}
	responseJSON, _ := json.Marshal(verification.Data)

	order, txErr := buildOrder(&intent.UserID, req, "paid", verification.Data.Reference, func(tx *gorm.DB, orderID uint, orderTotal float64) error {
		gatewayDetails := models.OrderPaymentGateway{
			OrderID:         orderID,
			Gateway:         "paystack",
			TransactionID:   verification.Data.Reference,
			Reference:       verification.Data.Reference,
			Amount:          orderTotal,
			Currency:        req.Currency,
			Status:          "success",
			Channel:         channel,
			CardType:        cardType,
			CardLast4:       cardLast4,
			CustomerEmail:   req.Contact.Email,
			GatewayResponse: string(responseJSON),
			VerifiedAt:      time.Now(),
		}
		return tx.Create(&gatewayDetails).Error
	})
	if txErr != nil {
		log.Printf("❌ Order build failed for reference=%s: %v", intent.TxRef, txErr)
		database.DB.Model(intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": txErr.Error(),
		})
		return models.Order{}, txErr
	}

	database.DB.Model(intent).Updates(map[string]interface{}{
		"status":    models.IntentCompleted,
		"order_id":  order.ID,
		"order_ref": order.DisplayID,
	})

	firstName := customerNameFromRequest(req)
	go sendOrderConfirmationEmail(order, firstName, req.Contact.Email)

	log.Printf("✅ Paystack order finalized: %s (reference=%s)", order.DisplayID, intent.TxRef)
	return order, nil
}

// ── POST /api/user/payments/paystack/initiate ────────────────────────────────
// Mirrors InitiateFlutterwavePayment for Paystack's hosted checkout page.
func InitiatePaystackPayment(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}
	if err := validateCreateOrderRequest(req); err != nil {
		utils.BadRequest(c, err.Error(), nil)
		return
	}

	total, err := quoteOrderTotal(req)
	if err != nil {
		utils.BadRequest(c, err.Error(), nil)
		return
	}
	if total <= 0 {
		utils.BadRequest(c, "Invalid order amount", nil)
		return
	}

	payloadJSON, err := json.Marshal(req)
	if err != nil {
		utils.InternalError(c, "Failed to prepare order")
		return
	}

	txRef := "PSK-" + generateOrderReference()
	intent := models.PaymentIntent{
		TxRef:    txRef,
		UserID:   uid,
		Gateway:  "paystack",
		Amount:   total,
		Currency: req.Currency,
		Payload:  string(payloadJSON),
		Status:   models.IntentPending,
	}
	if err := database.DB.Create(&intent).Error; err != nil {
		log.Printf("❌ Failed to create payment intent: %v", err)
		utils.InternalError(c, "Failed to start payment")
		return
	}

	callbackURL := os.Getenv("PAYSTACK_CALLBACK_URL")
	if callbackURL == "" {
		callbackURL = os.Getenv("FLUTTERWAVE_REDIRECT_URL")
	}
	if callbackURL == "" {
		utils.InternalError(c, "Payment gateway not configured")
		return
	}
	callbackURL = withQueryParam(callbackURL, "gateway", "paystack")

	link, err := createPaystackPaymentLink(txRef, total, req.Currency, req.Contact.Email, callbackURL)
	if err != nil {
		log.Printf("❌ Paystack link creation failed: %v", err)
		database.DB.Model(&intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": err.Error(),
		})
		utils.InternalError(c, "Failed to initialize payment")
		return
	}

	log.Printf("✅ Paystack payment link created: tx_ref=%s amount=%.2f %s", txRef, total, req.Currency)
	utils.OK(c, "Payment link created", gin.H{"link": link, "tx_ref": txRef})
}

// ── POST /api/user/payments/paystack/finalize ────────────────────────────────
// Mirrors FinalizeFlutterwavePayment. Called by the frontend's
// /payment/callback page once Paystack redirects back with ?reference=.
func FinalizePaystackPayment(c *gin.Context) {
	uid := c.GetUint("userID")
	if uid == 0 {
		utils.Unauthorized(c, "Unauthorized")
		return
	}

	var body struct {
		Reference string `json:"reference" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request: "+err.Error(), nil)
		return
	}

	var intent models.PaymentIntent
	if err := database.DB.Where("tx_ref = ? AND user_id = ?", body.Reference, uid).First(&intent).Error; err != nil {
		utils.NotFound(c, "Payment not found")
		return
	}

	if intent.Status == models.IntentCompleted {
		utils.OK(c, "Order already created", gin.H{
			"order_ref": intent.OrderRef,
			"order_id":  intent.OrderID,
		})
		return
	}
	if intent.Status == models.IntentFailed {
		utils.BadRequest(c, "This payment failed"+condSuffix(intent.FailureReason), nil)
		return
	}

	order, err := finalizePaystackIntent(&intent, body.Reference)
	if err != nil {
		log.Printf("❌ Paystack finalize failed for reference=%s: %v", body.Reference, err)
		utils.BadRequest(c, err.Error(), nil)
		return
	}

	utils.OK(c, "Order created", gin.H{
		"order": gin.H{
			"id":             order.ID,
			"display_id":     order.DisplayID,
			"reference":      order.DisplayID,
			"status":         order.Status,
			"payment_status": order.PaymentStatus,
			"total":          order.Total,
			"currency":       order.Currency,
		},
	})
}
