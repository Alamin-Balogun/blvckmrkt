// utils/payment.go
package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/Alamin-Balogun/blvckmrkt/models"
)

// VerifyPaystackPayment calls Paystack's verify endpoint and returns the
// full response. The caller is responsible for checking amounts / status.
func VerifyPaystackPayment(reference string) (*models.PaystackVerifyResponse, error) {
	secretKey := os.Getenv("PAYSTACK_SECRET_KEY")
	if secretKey == "" {
		return nil, fmt.Errorf("PAYSTACK_SECRET_KEY not set")
	}

	url := fmt.Sprintf("https://api.paystack.co/transaction/verify/%s", reference)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build Paystack request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+secretKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Paystack request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Paystack response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Paystack returned status %d: %s", resp.StatusCode, string(body))
	}

	var result models.PaystackVerifyResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse Paystack response: %w", err)
	}

	if !result.Status {
		return nil, fmt.Errorf("Paystack verification failed: %s", result.Message)
	}

	if result.Data.Status != "success" {
		return nil, fmt.Errorf("payment status is '%s', expected 'success'", result.Data.Status)
	}

	return &result, nil
}

// VerifyFlutterwavePayment calls Flutterwave's verify endpoint using the
// transaction ID (numeric string from the FLW callback).
func VerifyFlutterwavePayment(transactionID string) (*models.FlutterwaveVerifyResponse, error) {
	secretKey := os.Getenv("FLUTTERWAVE_SECRET_KEY")
	if secretKey == "" {
		return nil, fmt.Errorf("FLUTTERWAVE_SECRET_KEY not set")
	}

	url := fmt.Sprintf("https://api.flutterwave.com/v3/transactions/%s/verify", transactionID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build Flutterwave request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+secretKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Flutterwave request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Flutterwave response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Flutterwave returned status %d: %s", resp.StatusCode, string(body))
	}

	var result models.FlutterwaveVerifyResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse Flutterwave response: %w", err)
	}

	if result.Status != "success" {
		return nil, fmt.Errorf("Flutterwave verification failed: %s", result.Message)
	}

	if result.Data.Status != "successful" {
		return nil, fmt.Errorf("payment status is '%s', expected 'successful'", result.Data.Status)
	}

	return &result, nil
}