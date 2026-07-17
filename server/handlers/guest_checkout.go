// handlers/guest_checkout.go
//
// Guest checkout — no account required to buy. A guest order is identified
// by contact email/phone (Order.ContactEmail/ContactPhone) instead of a
// user_id, which is nil for these orders (see models/order.go). Deliberately
// a separate handler from CreateOrder rather than making that one accept an
// optional token: the buyer checkout path is real, already-verified payment
// code, and duplicating its (short, already battle-tested) payment
// verification switch here keeps that path completely untouched.
//
// Scope: only the payment methods that verify synchronously in the same
// request (bank transfer, and reference-based Paystack/Flutterwave
// verification) are supported for guests. The hosted-checkout redirect flow
// (payment_gateway.go's initiate/finalize + PaymentIntent) stays
// buyer-only — extending that to guests would mean making PaymentIntent's
// user_id nullable too and reworking the webhook/finalize race-condition
// guard for a nil identity, which is a materially bigger change than "let
// people check out without an account."
package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateGuestOrder(c *gin.Context) {
	log.Printf("🚀 CreateGuestOrder started")

	var req createOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("❌ Guest bind failed: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if err := validateCreateOrderRequest(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Guests are identified entirely by contact email — required by
	// validateCreateOrderRequest already, but worth being explicit here
	// since it's the only identity a guest order has.
	if strings.TrimSpace(req.Contact.Email) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Contact email is required"})
		return
	}

	// ── Payment verification — mirrors CreateOrder's switch exactly ────────
	var paymentStatus, paymentRef, receiptURL string
	var paystackChannel, paystackCardType, paystackCardLast4 string
	var paystackResponseJSON []byte
	var flutterwaveChannel, flutterwaveCardType, flutterwaveCardLast4 string
	var flutterwaveResponseJSON []byte

	log.Printf("🔍 Guest payment method: %s", req.Payment.Method)

	switch req.Payment.Method {
	case "paystack", "card":
		if req.Payment.Reference == nil || *req.Payment.Reference == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment reference required for Paystack"})
			return
		}

		verification, err := utils.VerifyPaystackPayment(*req.Payment.Reference)
		if err != nil {
			log.Printf("❌ Guest Paystack verify failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment verification failed", "details": err.Error()})
			return
		}

		expected := int64(math.Round(req.Total * 100))
		if verification.Data.Amount != expected {
			log.Printf("❌ Guest amount mismatch: expected=%d got=%d", expected, verification.Data.Amount)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":    "Payment amount mismatch",
				"expected": fmt.Sprintf("%.2f %s", req.Total, req.Currency),
				"received": fmt.Sprintf("%.2f %s", float64(verification.Data.Amount)/100, verification.Data.Currency),
			})
			return
		}

		paymentStatus = "paid"
		paymentRef = verification.Data.Reference
		paystackChannel = verification.Data.Channel
		if verification.Data.Authorization != nil {
			paystackCardType = verification.Data.Authorization.CardType
			paystackCardLast4 = verification.Data.Authorization.Last4
		}
		paystackResponseJSON, _ = json.Marshal(verification.Data)
		log.Printf("✅ Guest Paystack verified: %s (channel: %s)", paymentRef, paystackChannel)

	case "flutterwave":
		if req.Payment.Reference == nil || *req.Payment.Reference == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction ID required for Flutterwave"})
			return
		}

		verification, err := utils.VerifyFlutterwavePayment(*req.Payment.Reference)
		if err != nil {
			log.Printf("❌ Guest Flutterwave verify failed: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Payment verification failed", "details": err.Error()})
			return
		}

		if math.Round(verification.Data.Amount*100) != math.Round(req.Total*100) {
			log.Printf("❌ Guest amount mismatch: expected=%.2f got=%.2f", req.Total, verification.Data.Amount)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":    "Payment amount mismatch",
				"expected": fmt.Sprintf("%.2f %s", req.Total, req.Currency),
				"received": fmt.Sprintf("%.2f %s", verification.Data.Amount, verification.Data.Currency),
			})
			return
		}

		paymentStatus = "paid"
		paymentRef = verification.Data.TxRef
		flutterwaveChannel = verification.Data.PaymentType
		if verification.Data.Card != nil {
			flutterwaveCardType = verification.Data.Card.Type
			flutterwaveCardLast4 = verification.Data.Card.Last4Digits
		}
		flutterwaveResponseJSON, _ = json.Marshal(verification.Data)
		log.Printf("✅ Guest Flutterwave verified: %s (type: %s)", paymentRef, flutterwaveChannel)

	case "transfer", "manual_transfer", "bank_transfer":
		paymentStatus = "pending"
		paymentRef = generateOrderReference()
		if req.Payment.ReceiptURL != nil && *req.Payment.ReceiptURL != "" {
			receiptURL = *req.Payment.ReceiptURL
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported payment method: " + req.Payment.Method})
		return
	}

	if !validatePaymentStatus(paymentStatus) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal payment status error"})
		return
	}

	order, txErr := buildOrder(nil, req, paymentStatus, paymentRef, func(tx *gorm.DB, orderID uint, orderTotal float64) error {
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
		log.Printf("❌ Guest order build failed: %v", txErr)
		c.JSON(http.StatusBadRequest, gin.H{"error": txErr.Error()})
		return
	}

	log.Printf("✅ Guest order complete: %s | total=%.2f %s | payment=%s (%s)",
		order.DisplayID, order.Total, req.Currency, req.Payment.Method, paymentStatus)

	firstName := ""
	if req.DeliveryMode == "delivery" && req.Delivery != nil {
		firstName = strings.TrimSpace(req.Delivery.FirstName)
	}
	if firstName == "" {
		firstName = strings.Split(req.Contact.Email, "@")[0]
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
