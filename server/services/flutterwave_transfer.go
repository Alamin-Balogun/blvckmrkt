// services/flutterwave_transfer.go
package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"log"
)

// ── Create Flutterwave Beneficiary ────────────────────────────────────────────
func CreateFlutterwaveRecipient(req RecipientRequest) (string, error) {
	url := "https://api.flutterwave.com/v3/beneficiaries"
	
	payload := map[string]interface{}{
		"account_number": req.AccountNumber,
		"account_bank":   req.BankCode,  // ✅ Use the code directly (no mapping needed)
		"beneficiary_name": req.Name,
	}

	jsonData, _ := json.Marshal(payload)
	
	log.Printf("🔵 Flutterwave Beneficiary Request: %s", string(jsonData))
	
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("FLUTTERWAVE_SECRET_KEY"))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("flutterwave request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	
	log.Printf("🔵 Flutterwave Response: %s", string(body))

	var result struct {
		Status  string `json:"status"`
		Message string `json:"message"`
		Data    struct {
			ID              int    `json:"id"`
			AccountNumber   string `json:"account_number"`
			BankCode        string `json:"bank_code"`
			BeneficiaryName string `json:"beneficiary_name"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Status != "success" {
		return "", fmt.Errorf("flutterwave error: %s", result.Message)
	}

	beneficiaryID := fmt.Sprintf("%d", result.Data.ID)
	log.Printf("✅ Flutterwave beneficiary created: %s", beneficiaryID)
	
	return beneficiaryID, nil
}

// ── Initiate Flutterwave Transfer ─────────────────────────────────────────────
func InitiateFlutterwaveTransfer(req TransferRequest) (*TransferResult, error) {
	url := "https://api.flutterwave.com/v3/transfers"
	
	payload := map[string]interface{}{
		"account_bank":   req.BankCode,
		"account_number": req.AccountNumber,
		"amount":         req.Amount,
		"narration":      req.Narration,
		"currency":       req.Currency,
		"reference":      req.Reference,
	}

	jsonData, _ := json.Marshal(payload)
	
	httpReq, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("FLUTTERWAVE_SECRET_KEY"))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("flutterwave request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

var result struct {
    Status  string `json:"status"`
    Message string `json:"message"`
    Code    string `json:"code"`   // ✅ ADD THIS
    Data    struct {
        ID        int    `json:"id"`
        Reference string `json:"reference"`
        Status    string `json:"status"`
    } `json:"data"`
}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

if result.Status != "success" {
    // ✅ Detect insufficient balance specifically
    if result.Message == "Insufficient funds" || 
       result.Message == "Insufficient balance" ||
       result.Code == "INSUFFICIENT_FUNDS" {
        return nil, fmt.Errorf("INSUFFICIENT_BALANCE: Your Flutterwave wallet balance is too low to complete this payout. Please top up and retry.")
    }
    return nil, fmt.Errorf("flutterwave error: %s", result.Message)
}

	return &TransferResult{
		TransferID: fmt.Sprintf("%d", result.Data.ID),
		Status:     result.Data.Status,
		Reference:  result.Data.Reference,
	}, nil
}