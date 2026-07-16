// models/payment.go
package models

import "time"

// ─────────────────────────────────────────────────────────────────────────────
// Paystack Verification Response Structures
// ─────────────────────────────────────────────────────────────────────────────

type PaystackVerifyResponse struct {
	Status  bool                    `json:"status"`
	Message string                  `json:"message"`
	Data    PaystackTransactionData `json:"data"`
}

type PaystackTransactionData struct {
	ID              int64                  `json:"id"`
	Domain          string                 `json:"domain"`
	Status          string                 `json:"status"`           // "success", "failed", "abandoned"
	Reference       string                 `json:"reference"`
	Amount          int64                  `json:"amount"`           // In kobo (cents)
	Message         string                 `json:"message"`
	GatewayResponse string                 `json:"gateway_response"`
	PaidAt          time.Time              `json:"paid_at"`
	CreatedAt       time.Time              `json:"created_at"`
	Channel         string                 `json:"channel"`          // "card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"
	Currency        string                 `json:"currency"`         // "NGN", "GHS", "ZAR", "USD"
	IPAddress       string                 `json:"ip_address"`
	Customer        PaystackCustomer       `json:"customer"`
	Authorization   *PaystackAuthorization `json:"authorization,omitempty"` // ✅ Optional - only for card payments
}

type PaystackCustomer struct {
	ID           int64  `json:"id"`
	Email        string `json:"email"`
	CustomerCode string `json:"customer_code"`
}

// ✅ This is optional and only present for card payments
type PaystackAuthorization struct {
	AuthorizationCode string `json:"authorization_code"`
	Bin               string `json:"bin"`
	Last4             string `json:"last4"`
	ExpMonth          string `json:"exp_month"`
	ExpYear           string `json:"exp_year"`
	Channel           string `json:"channel"`
	CardType          string `json:"card_type"`    // "visa", "mastercard", "verve"
	Bank              string `json:"bank"`
	CountryCode       string `json:"country_code"`
	Brand             string `json:"brand"`
	Reusable          bool   `json:"reusable"`
	Signature         string `json:"signature"`
	AccountName       string `json:"account_name"`
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook Payload (shared by Paystack and Flutterwave)
// ─────────────────────────────────────────────────────────────────────────────

// WebhookPayload is the common envelope for both Paystack and Flutterwave
// webhook events. The Data field is a raw map so each handler can extract
// whichever keys it needs (reference, tx_ref, status, etc.).
type WebhookPayload struct {
	Event string                 `json:"event"` // e.g. "charge.success", "charge.completed"
	Data  map[string]interface{} `json:"data"`
}

// ─────────────────────────────────────────────────────────────────────────────
// Flutterwave Verification Response Structures
// ─────────────────────────────────────────────────────────────────────────────

type FlutterwaveVerifyResponse struct {
	Status  string                     `json:"status"`  // "success" or "error"
	Message string                     `json:"message"`
	Data    FlutterwaveTransactionData `json:"data"`
}

type FlutterwaveTransactionData struct {
	ID                int64               `json:"id"`
	TxRef             string              `json:"tx_ref"`
	FlwRef            string              `json:"flw_ref"`
	DeviceFingerprint string              `json:"device_fingerprint"`
	Amount            float64             `json:"amount"`
	Currency          string              `json:"currency"`          // "NGN", "USD", "GHS", etc.
	ChargedAmount     float64             `json:"charged_amount"`
	AppFee            float64             `json:"app_fee"`
	MerchantFee       float64             `json:"merchant_fee"`
	ProcessorResponse string              `json:"processor_response"`
	AuthModel         string              `json:"auth_model"`
	IP                string              `json:"ip"`
	Narration         string              `json:"narration"`
	Status            string              `json:"status"`            // "successful", "failed"
	PaymentType       string              `json:"payment_type"`      // "card", "mobilemoney", "banktransfer", "ussd"
	CreatedAt         time.Time           `json:"created_at"`
	AccountID         int64               `json:"account_id"`
	Customer          FlutterwaveCustomer `json:"customer"`
	Card              *FlutterwaveCard    `json:"card,omitempty"` // ✅ Optional - only for card payments
}

type FlutterwaveCustomer struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	PhoneNumber string    `json:"phone_number"`
	Email       string    `json:"email"`
	CreatedAt   time.Time `json:"created_at"`
}

// ✅ This is optional and only present for card payments
type FlutterwaveCard struct {
	First6Digits string `json:"first_6digits"`
	Last4Digits  string `json:"last_4digits"`
	Issuer       string `json:"issuer"`
	Country      string `json:"country"`
	Type         string `json:"type"`  // "VISA", "MASTERCARD", "VERVE"
	Token        string `json:"token"`
	Expiry       string `json:"expiry"`
}