// services/dellyman.go
//
// Client for the Dellyman courier API (https://dellyman.com/rest-api/).
// Covers the intra-city flow only: quotes, booking, order lookup, tracking,
// and webhook signature verification. Interstate endpoints are not wired up
// yet — add GetInterstateQuote/BookInterstateOrder here if/when needed.
package services

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Alamin-Balogun/blvckmrkt/config"
)

// DellymanConfigured reports whether an API key has been set. Callers should
// check this before attempting a booking so they can surface a clear error
// ("Dellyman isn't set up yet") instead of a raw network failure.
func DellymanConfigured() bool {
	return config.App != nil && config.App.DellymanAPIKey != ""
}

func dellymanRequest(method, path string, body interface{}, out interface{}) error {
	if !DellymanConfigured() {
		return fmt.Errorf("DELLYMAN_NOT_CONFIGURED: Dellyman API key is not set on the server")
	}

	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to encode Dellyman request: %w", err)
		}
		reqBody = bytes.NewBuffer(b)
	}

	url := config.App.DellymanBaseURL + path
	httpReq, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return fmt.Errorf("failed to build Dellyman request: %w", err)
	}
	httpReq.Header.Set("Authorization", "Bearer "+config.App.DellymanAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("Dellyman request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read Dellyman response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("Dellyman returned status %d: %s", resp.StatusCode, string(respBody))
	}

	if out != nil {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("failed to parse Dellyman response: %w", err)
		}
	}
	return nil
}

// ── Vehicles ───────────────────────────────────────────────────────────────

type DellymanVehicle struct {
	VehicleID uint   `json:"VehicleID"`
	Name      string `json:"Name"`
}

type dellymanVehiclesResponse struct {
	ResponseCode int               `json:"ResponseCode"`
	Message      string            `json:"Message"`
	Vehicles     []DellymanVehicle `json:"Vehicles"`
}

func GetVehicles() ([]DellymanVehicle, error) {
	var out dellymanVehiclesResponse
	if err := dellymanRequest(http.MethodGet, "/Vehicles", nil, &out); err != nil {
		return nil, err
	}
	if out.ResponseCode != 100 {
		return nil, fmt.Errorf("Dellyman error: %s", out.Message)
	}
	return out.Vehicles, nil
}

// ── States & Cities ──────────────────────────────────────────────────────────
// Unlike GetQuotes/BookOrder/Vehicles, these two return a raw JSON array at
// the top level — no ResponseCode/Message wrapper — discovered by probing
// the API directly (undocumented in the public rest-api page).

type DellymanState struct {
	StateID string `json:"StateID"`
	Name    string `json:"Name"`
}

func GetStates() ([]DellymanState, error) {
	var out []DellymanState
	if err := dellymanRequest(http.MethodGet, "/States", nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

type DellymanCity struct {
	CityID  string `json:"CityID"`
	StateID string `json:"StateID"`
	Name    string `json:"Name"`
}

func GetCities(stateID string) ([]DellymanCity, error) {
	var out []DellymanCity
	if err := dellymanRequest(http.MethodPost, "/Cities", map[string]string{"StateID": stateID}, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// ── Quotes ─────────────────────────────────────────────────────────────────

type QuoteRequest struct {
	PaymentMode         string    `json:"PaymentMode"`
	Vehicle             string    `json:"Vehicle"`
	PickupRequestedDate string    `json:"PickupRequestedDate"` // "YYYY/MM/DD"
	PickupRequestedTime string    `json:"PickupRequestedTime"` // e.g. "08:00 AM to 05:00 PM"
	PickupAddress       string    `json:"PickupAddress"`
	DeliveryAddress     []string  `json:"DeliveryAddress"`
	IsInstantDelivery   *int      `json:"IsInstantDelivery,omitempty"`
	IsProductOrder      *int      `json:"IsProductOrder,omitempty"`
	ProductAmount       []float64 `json:"ProductAmount,omitempty"`
}

type QuoteCompany struct {
	CompanyID    uint    `json:"CompanyID"`
	Name         string  `json:"Name"`
	TotalPrice   float64 `json:"TotalPrice"`
	AvgRating    float64 `json:"AvgRating"`
	SameDayPrice float64 `json:"SameDayPrice"`
}

type QuoteResponse struct {
	ResponseCode int            `json:"ResponseCode"`
	Message      string         `json:"ResponseMessage"`
	Companies    []QuoteCompany `json:"Companies"`
	Distance     float64        `json:"Distance"`
}

func GetQuotes(req QuoteRequest) (*QuoteResponse, error) {
	var out QuoteResponse
	if err := dellymanRequest(http.MethodPost, "/GetQuotes", req, &out); err != nil {
		return nil, err
	}
	if out.ResponseCode != 100 {
		return nil, fmt.Errorf("Dellyman error: %s", out.Message)
	}
	return &out, nil
}

// ── Booking ────────────────────────────────────────────────────────────────

type BookPackage struct {
	PackageDescription         string  `json:"PackageDescription"`
	DeliveryContactName        string  `json:"DeliveryContactName"`
	DeliveryContactNumber      string  `json:"DeliveryContactNumber"`
	PackageWeight              float64 `json:"PackageWeight"`
	DeliveryGooglePlaceAddress string  `json:"DeliveryGooglePlaceAddress"`
	DeliveryLandmark           string  `json:"DeliveryLandmark,omitempty"`
	ProductAmount              float64 `json:"ProductAmount,omitempty"`
}

type BookOrderRequest struct {
	OrderRef                 string `json:"OrderRef"` // unique UUID — prevents duplicate bookings
	CompanyID                uint   `json:"CompanyID"`
	PaymentMode              string `json:"PaymentMode"`
	Vehicle                  string `json:"Vehicle"`
	PickUpContactName        string `json:"PickUpContactName"`
	PickUpContactNumber      string `json:"PickUpContactNumber"`
	PickUpGooglePlaceAddress string `json:"PickUpGooglePlaceAddress"`
	PickUpLandmark           string `json:"PickUpLandmark,omitempty"`
	// IsProductOrder tells Dellyman to collect payment for the goods from the
	// receiver on delivery (COD). Our buyers already pay upfront at checkout
	// (Paystack/Flutterwave/bank transfer), so this must stay 0 — otherwise
	// Dellyman would attempt to double-charge the buyer at the door.
	IsProductOrder        *int          `json:"IsProductOrder,omitempty"`
	IsInstantDelivery     *int          `json:"IsInstantDelivery,omitempty"`
	PickUpRequestedDate   string        `json:"PickUpRequestedDate"`
	PickUpRequestedTime   string        `json:"PickUpRequestedTime"`
	DeliveryRequestedTime string        `json:"DeliveryRequestedTime"`
	DeliveryTimeline      string        `json:"DeliveryTimeline"` // "sameDay" | "nextDay" | "beyondNextDay"
	Packages              []BookPackage `json:"Packages"`
}

type BookPackageResult struct {
	PackageID         uint   `json:"PackageID"`
	PackageTrackingID string `json:"PackageTrackingID"`
}

type BookOrderResponse struct {
	ResponseCode int                 `json:"ResponseCode"`
	Message      string              `json:"ResponseMessage"`
	OrderID      uint                `json:"OrderID"`
	OrderCode    string              `json:"OrderCode"`
	TrackingID   string              `json:"TrackingID"`
	Packages     []BookPackageResult `json:"Packages"`
}

func BookOrder(req BookOrderRequest) (*BookOrderResponse, error) {
	var out BookOrderResponse
	if err := dellymanRequest(http.MethodPost, "/BookOrder", req, &out); err != nil {
		return nil, err
	}
	if out.ResponseCode != 100 {
		return nil, fmt.Errorf("Dellyman error: %s", out.Message)
	}
	return &out, nil
}

// ── Order lookup / tracking ───────────────────────────────────────────────

// DellymanOrderStatus mirrors the raw GetOrder/TrackOrder response — unlike
// GetQuotes/BookOrder, these endpoints return the order fields directly at
// the top level (no ResponseCode/Data wrapper), and OrderID/OrderPrice come
// back as JSON strings, not numbers.
type DellymanOrderStatus struct {
	OrderID     string `json:"OrderID"`
	OrderCode   string `json:"OrderCode"`
	TrackingID  string `json:"TrackingID"`
	OrderStatus string `json:"OrderStatus"`
	OrderPrice  string `json:"OrderPrice"`
	PickedUpAt  string `json:"PickedUpAt,omitempty"`
	DeliveredAt string `json:"DeliveredAt,omitempty"`
}

func GetOrder(orderID uint) (*DellymanOrderStatus, error) {
	var out DellymanOrderStatus
	if err := dellymanRequest(http.MethodPost, "/GetOrder", map[string]uint{"OrderID": orderID}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func TrackOrder(trackingID string) (*DellymanOrderStatus, error) {
	var out DellymanOrderStatus
	if err := dellymanRequest(http.MethodPost, "/TrackOrder", map[string]string{"TrackingID": trackingID}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// ── Cancellation ─────────────────────────────────────────────────────────
//
// Dellyman confirmed directly (2026-07-30) that there is no API to cancel an
// already-booked order — every plausible endpoint (/CancelOrder,
// /CancelBooking, /CancelOrders, /DeleteOrder, /Order/Cancel) 404s, and
// that's expected, not a bug on our side. A booked/picked shipment that gets
// cancelled on BLVCKMRKT is instead flagged for a human to cancel by hand in
// the Dellyman dashboard — see cancelDellymanDeliveriesForOrder in
// handlers/dellyman.go, which emails ops the order/tracking details needed
// to do that.

// ── Webhooks ───────────────────────────────────────────────────────────────

// WebhookPayload mirrors the documented Order.* event body Dellyman POSTs to
// our callback URL (Order.created/picked/delivered/cancelled). "status" is a
// JSON boolean on the wire, and — matching the same quirk seen on
// GetOrder/TrackOrder — OrderID/OrderPrice/PackageID come back as strings,
// not numbers.
type WebhookPayload struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Order   struct {
		OrderID     string `json:"OrderID"`
		OrderCode   string `json:"OrderCode"`
		TrackingID  string `json:"TrackingID"`
		OrderStatus string `json:"OrderStatus"`
		OrderPrice  string `json:"OrderPrice"`
		PickedUpAt  string `json:"PickedUpAt,omitempty"`
		DeliveredAt string `json:"DeliveredAt,omitempty"`
		Packages    []struct {
			PackageID     string `json:"PackageID"`
			PackageStatus string `json:"PackageStatus"`
		} `json:"Packages"`
	} `json:"order"`
}

// VerifyDellymanWebhookSignature validates the X-Dellyman-Signature header —
// an HMAC-SHA256 of the raw request body, hex-encoded, keyed by our webhook
// secret — using a constant-time comparison to avoid timing attacks.
func VerifyDellymanWebhookSignature(rawBody []byte, signature string) bool {
	if config.App == nil || config.App.DellymanWebhookSecret == "" || signature == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(config.App.DellymanWebhookSecret))
	mac.Write(rawBody)
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}
