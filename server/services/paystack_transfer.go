// services/paystack_transfer.go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// ✅ SHARED TYPES (exported - capital letter)
type TransferRequest struct {
	Amount        float64 `json:"amount"`
	Recipient     string  `json:"recipient"`
	Reference     string  `json:"reference"`
	Reason        string  `json:"reason"`
	Currency      string  `json:"currency"`
	AccountNumber string  `json:"account_number"`
	BankCode      string  `json:"bank_code"`
	Narration     string  `json:"narration"`
}

type TransferResult struct {
	TransferCode string
	TransferID   string
	Status       string
	Reference    string
}

// ✅ NEW: Recipient Request (make sure it's exported)
type RecipientRequest struct {
	Type          string `json:"type"`
	Name          string `json:"name"`
	AccountNumber string `json:"account_number"`
	BankCode      string `json:"bank_code"`
	Currency      string `json:"currency"`
}

// ── Create Paystack Transfer Recipient ────────────────────────────────────────
func CreatePaystackRecipient(req RecipientRequest) (string, error) {
	url := "https://api.paystack.co/transferrecipient"
	
	payload := map[string]interface{}{
		"type":           req.Type,
		"name":           req.Name,
		"account_number": req.AccountNumber,
		"bank_code":      req.BankCode,
		"currency":       req.Currency,
	}

	jsonData, _ := json.Marshal(payload)
	
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("PAYSTACK_SECRET_KEY"))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("paystack request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Status  bool   `json:"status"`
		Message string `json:"message"`
		Data    struct {
			RecipientCode string `json:"recipient_code"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if !result.Status {
		return "", fmt.Errorf("paystack error: %s", result.Message)
	}

	return result.Data.RecipientCode, nil
}

// ── Initiate Paystack Transfer ────────────────────────────────────────────────
func InitiatePaystackTransfer(req TransferRequest) (*TransferResult, error) {
	url := "https://api.paystack.co/transfer"
	
	amountInKobo := int(req.Amount * 100)
	
	payload := map[string]interface{}{
		"source":    "balance",
		"amount":    amountInKobo,
		"recipient": req.Recipient,
		"reference": req.Reference,
		"reason":    req.Reason,
		"currency":  req.Currency,
	}

	jsonData, _ := json.Marshal(payload)
	
	httpReq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("PAYSTACK_SECRET_KEY"))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("paystack request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Status  bool   `json:"status"`
		Message string `json:"message"`
		Data    struct {
			TransferCode string `json:"transfer_code"`
			Reference    string `json:"reference"`
			Status       string `json:"status"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

if !result.Status {
    msg := result.Message
    if msg == "You cannot initiate transfer. Check that your account has been activated for transfers" ||
       msg == "Transfer requires OTP to continue" {
        return nil, fmt.Errorf("PAYSTACK_NOT_ENABLED: Paystack transfers are not yet enabled on your account. Use Flutterwave for now.")
    }
    if msg == "Insufficient Balance" || msg == "Your balance is not enough to complete this request" {
        return nil, fmt.Errorf("INSUFFICIENT_BALANCE: Your Paystack balance is too low. Please top up and retry.")
    }
    return nil, fmt.Errorf("paystack error: %s", msg)
}

	return &TransferResult{
		TransferCode: result.Data.TransferCode,
		Status:       result.Data.Status,
		Reference:    result.Data.Reference,
	}, nil
}