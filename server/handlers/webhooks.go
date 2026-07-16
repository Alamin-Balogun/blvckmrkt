// handlers/webhooks.go
package handlers

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/gin-gonic/gin"
)

// verifyPaystackSignature checks the `x-paystack-signature` header, which is
// an HMAC-SHA512 of the raw request body keyed with the Paystack secret key.
func verifyPaystackSignature(body []byte, signature string) bool {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")
	if secretKey == "" || signature == "" {
		return false
	}
	mac := hmac.New(sha512.New, []byte(secretKey))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func PaystackWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed to read Paystack webhook body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if !verifyPaystackSignature(body, c.GetHeader("x-paystack-signature")) {
		log.Printf("❌ Paystack webhook signature mismatch")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	var payload models.WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("Failed to parse Paystack webhook: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	switch payload.Event {
	case "charge.success":
		handlePaystackChargeSuccess(payload.Data)
	case "charge.failed":
		handlePaystackChargeFailed(payload.Data)
	default:
		log.Printf("Unhandled Paystack event: %s", payload.Event)
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// FlutterwaveWebhook verifies the `verif-hash` header against
// FLUTTERWAVE_SECRET_HASH (the shared secret configured in the Flutterwave
// dashboard) before processing — Flutterwave webhooks carry no HMAC, just
// this static header, so a missing/empty env var is treated as
// "verification not configured" and the request is rejected rather than
// silently trusted.
func FlutterwaveWebhook(c *gin.Context) {
	expectedHash := os.Getenv("FLUTTERWAVE_SECRET_HASH")
	if expectedHash == "" || c.GetHeader("verif-hash") != expectedHash {
		log.Printf("❌ Flutterwave webhook signature mismatch")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed to read Flutterwave webhook body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var payload models.WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("Failed to parse Flutterwave webhook: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	if payload.Event == "charge.completed" {
		handleFlutterwaveChargeCompleted(payload.Data)
	} else {
		log.Printf("Unhandled Flutterwave event: %s", payload.Event)
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

// handlePaystackChargeSuccess is the safety net for Paystack's hosted
// checkout: normally the frontend's /payment/callback page finalizes the
// order via FinalizePaystackPayment as soon as the customer's browser
// returns from Paystack, but if that tab gets closed early this webhook
// (which Paystack always sends server-to-server) builds the order instead.
func handlePaystackChargeSuccess(data map[string]interface{}) {
	reference, ok := data["reference"].(string)
	if !ok || reference == "" {
		log.Printf("No reference in Paystack webhook data")
		return
	}

	var intent models.PaymentIntent
	if err := database.DB.Where("tx_ref = ?", reference).First(&intent).Error; err != nil {
		return // no parked intent for this reference — nothing for us to build
	}
	if intent.Status == models.IntentCompleted {
		return // already finalized by the frontend callback
	}

	if _, err := finalizePaystackIntent(&intent, reference); err != nil {
		log.Printf("❌ Paystack webhook finalize failed for reference=%s: %v", reference, err)
		return
	}
	log.Printf("✅ Order confirmed via Paystack webhook safety net: %s", reference)
}

func handlePaystackChargeFailed(data map[string]interface{}) {
	reference, ok := data["reference"].(string)
	if !ok || reference == "" {
		log.Printf("No reference in Paystack webhook data")
		return
	}

	database.DB.Model(&models.PaymentIntent{}).
		Where("tx_ref = ? AND status = ?", reference, models.IntentPending).
		Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": "Payment failed (webhook)",
		})

	log.Printf("❌ Payment failed for reference: %s", reference)
}

// handleFlutterwaveChargeCompleted is the safety net for Flutterwave's
// hosted checkout — see handlePaystackChargeSuccess above for why this
// exists alongside the frontend callback finalize path. This used to run a
// raw `UPDATE orders ... WHERE payment_ref = ?` directly, which silently
// affected 0 rows because no order row is ever created until an intent is
// finalized — that gap is why paid Flutterwave orders weren't showing up in
// the orders table.
func handleFlutterwaveChargeCompleted(data map[string]interface{}) {
	txRef, ok := data["tx_ref"].(string)
	if !ok || txRef == "" {
		log.Printf("No tx_ref in Flutterwave webhook data")
		return
	}
	status, _ := data["status"].(string)

	var intent models.PaymentIntent
	if err := database.DB.Where("tx_ref = ?", txRef).First(&intent).Error; err != nil {
		log.Printf("⚠️ Flutterwave webhook: no payment intent for tx_ref=%s (ignoring)", txRef)
		return
	}
	if intent.Status == models.IntentCompleted {
		return // already finalized by the frontend callback
	}

	if status != "successful" {
		database.DB.Model(&intent).Updates(map[string]interface{}{
			"status":         models.IntentFailed,
			"failure_reason": "Payment failed (webhook status: " + status + ")",
		})
		log.Printf("❌ Flutterwave payment failed for tx_ref=%s", txRef)
		return
	}

	transactionID := ""
	switch v := data["id"].(type) {
	case float64:
		transactionID = strconv.FormatInt(int64(v), 10)
	case string:
		transactionID = v
	}
	if transactionID == "" {
		log.Printf("❌ Flutterwave webhook missing transaction id for tx_ref=%s", txRef)
		return
	}

	if _, err := finalizeFlutterwaveIntent(&intent, transactionID); err != nil {
		log.Printf("❌ Flutterwave webhook finalize failed for tx_ref=%s: %v", txRef, err)
		return
	}
	log.Printf("✅ Order confirmed via Flutterwave webhook safety net: %s", txRef)
}
