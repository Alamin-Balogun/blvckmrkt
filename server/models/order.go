// models/order.go
package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ── Enums ──────────────────────────────────────────────────────────────────────

type OrderStatus string
type PaymentStatus string
type DeliveryType string

const (
	OrderPending    OrderStatus = "pending"
	OrderProcessing OrderStatus = "processing"
	OrderShipped    OrderStatus = "shipped"
	OrderDelivered  OrderStatus = "delivered"
	OrderCancelled  OrderStatus = "cancelled"
	OrderRefunded   OrderStatus = "refunded"

	PaymentUnpaid   PaymentStatus = "unpaid"
	PaymentPending  PaymentStatus = "pending"
	PaymentPaid     PaymentStatus = "paid"
	PaymentFailed   PaymentStatus = "failed"
	PaymentRefunded PaymentStatus = "refunded"

	DeliveryPickup DeliveryType = "pickup"
	DeliveryZone   DeliveryType = "zone"
	DeliveryLocal  DeliveryType = "local"
)

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Order - Main order table (clean, normalized)
// ─────────────────────────────────────────────────────────────────────────────

type Order struct {
	ID            uint           `gorm:"primaryKey;autoIncrement"               json:"id"`
	DisplayID     string         `gorm:"type:varchar(20);uniqueIndex;not null"  json:"display_id"`
	// UserID is nil for guest checkout orders — those are identified by
	// ContactEmail/ContactPhone below instead of an account.
	UserID        *uint          `gorm:"index"                                  json:"user_id"`
	AddressID     *uint          `gorm:"index"                                  json:"address_id"`
	Subtotal      float64        `gorm:"type:decimal(10,2);not null"            json:"subtotal"`
	ShippingFee   float64        `gorm:"type:decimal(10,2);default:0"           json:"shipping_fee"`
	// Tax is the platform's commission, re-added at checkout as a line item
	// (shown to buyers as "Tax") instead of only being baked into a lower
	// Product.Price. It is derived per-item from (BrandPrice - Price) and is
	// NOT included in any OrderItem.TotalPrice, so brand payouts (which sum
	// OrderItem.TotalPrice) are unaffected — this amount stays with the platform.
	Tax           float64        `gorm:"type:decimal(10,2);default:0"           json:"tax"`
	Total         float64        `gorm:"type:decimal(10,2);not null"            json:"total"`
	Currency      string         `gorm:"type:varchar(10);default:'NGN'"         json:"currency"`
	
	// ✅ Explicit column name to avoid conflicts
    DeliveryType  DeliveryType   `gorm:"column:delivery_type;type:varchar(20)"  json:"delivery_type"`
    Status        OrderStatus    `gorm:"column:status;type:varchar(20)"          json:"status"`
    PaymentStatus PaymentStatus  `gorm:"column:payment_status;type:varchar(20)"  json:"payment_status"`
	PaymentMethod string         `gorm:"type:varchar(50);not null"              json:"payment_method"`
	PaymentRef    string         `gorm:"type:varchar(200);not null"             json:"payment_ref"`
	
	ContactEmail  string         `gorm:"type:varchar(255)"                      json:"contact_email,omitempty"`
	ContactPhone  string         `gorm:"type:varchar(50)"                       json:"contact_phone,omitempty"`
	Notes         string         `gorm:"type:varchar(500)"                      json:"notes,omitempty"`
	CreatedAt     time.Time      `                                              json:"created_at"`
	UpdatedAt     time.Time      `                                              json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index"                                  json:"-"`

	// ✅ Relationships - only ONE will be populated based on DeliveryType
	Items              []OrderItem             `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	PickupDetails      *OrderPickup            `gorm:"foreignKey:OrderID" json:"pickup_details,omitempty"`
	ZoneDelivery       *OrderZoneDelivery      `gorm:"foreignKey:OrderID" json:"zone_delivery,omitempty"`
	LocalDelivery      *OrderLocalDelivery     `gorm:"foreignKey:OrderID" json:"local_delivery,omitempty"`
	PaymentTransfer    *OrderPaymentTransfer   `gorm:"foreignKey:OrderID" json:"payment_transfer,omitempty"`
	PaymentGateway     *OrderPaymentGateway    `gorm:"foreignKey:OrderID" json:"payment_gateway,omitempty"`
}

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	var count int64
	tx.Model(&Order{}).Unscoped().Count(&count)
	o.DisplayID = fmt.Sprintf("ORD-%04d", count+1)
	return nil
}

func (Order) TableName() string { return "orders" }

// ─────────────────────────────────────────────────────────────────────────────
// ✅ OrderItem - One product+size combo in an order
// ─────────────────────────────────────────────────────────────────────────────

type OrderItem struct {
	ID            uint      `gorm:"primaryKey;autoIncrement"       json:"id"`
	OrderID       uint      `gorm:"not null;index"                 json:"order_id"`
	ProductID     uint      `gorm:"not null;index"                 json:"product_id"`
	ProductSizeID *uint     `gorm:"index"                          json:"product_size_id"`
	BrandID       uint      `gorm:"not null;index"                 json:"brand_id"`
	ProductName   string    `gorm:"type:varchar(200)"              json:"product_name"`
	Size          string    `gorm:"type:varchar(20)"               json:"size,omitempty"`
	Quantity      int       `gorm:"not null;default:1"             json:"quantity"`
	UnitPrice     float64   `gorm:"type:decimal(10,2);not null"    json:"unit_price"`
	TotalPrice    float64   `gorm:"type:decimal(10,2);not null"    json:"total_price"`
	ImageURL      string    `gorm:"type:varchar(512)"              json:"image_url,omitempty"`
	CreatedAt     time.Time `                                      json:"created_at"`
}

func (OrderItem) TableName() string { return "order_items" }

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Shipping Detail Tables
// ─────────────────────────────────────────────────────────────────────────────

// OrderPickup - Snapshot of pickup location at order time
type OrderPickup struct {
	ID               uint      `gorm:"primaryKey;autoIncrement"      json:"id"`
	OrderID          uint      `gorm:"uniqueIndex;not null"          json:"order_id"`
	PickupLocationID uint      `gorm:"not null;index"                json:"pickup_location_id"`
	BrandID          uint      `gorm:"not null;index"                json:"brand_id"`
	
	// Snapshot fields - preserve data even if pickup location is deleted/changed
	Name             string    `gorm:"type:varchar(200);not null"    json:"name"`
	Address          string    `gorm:"type:varchar(500);not null"    json:"address"`
	City             string    `gorm:"type:varchar(100);not null"    json:"city"`
	State            string    `gorm:"type:varchar(100)"             json:"state,omitempty"`
	StateCode        string    `gorm:"type:varchar(10)"              json:"state_code,omitempty"`
	Country          string    `gorm:"type:varchar(100);not null"    json:"country"`
	CountryCode      string    `gorm:"type:varchar(10);not null"     json:"country_code"`
	Phone            string    `gorm:"type:varchar(50)"              json:"phone,omitempty"`
	Instructions     string    `gorm:"type:varchar(500)"             json:"instructions,omitempty"`
	
	CreatedAt        time.Time `                                     json:"created_at"`
}

func (OrderPickup) TableName() string { return "order_pickups" }

// OrderZoneDelivery - Snapshot of zone shipping details at order time
type OrderZoneDelivery struct {
	ID                uint      `gorm:"primaryKey;autoIncrement"      json:"id"`
	OrderID           uint      `gorm:"uniqueIndex;not null"          json:"order_id"`
	ShippingMethodID  uint      `gorm:"not null;index"                json:"shipping_method_id"`
	ZoneID            uint      `gorm:"not null;index"                json:"zone_id"`
	ZoneLocationID    *uint     `gorm:"index"                         json:"zone_location_id,omitempty"`
	BrandID           uint      `gorm:"not null;index"                json:"brand_id"`
	
	// Zone snapshot
	ZoneName          string    `gorm:"type:varchar(150);not null"    json:"zone_name"`
	
	// Location snapshot (which country/state in zone was selected)
	LocationCountry   string    `gorm:"type:varchar(100);not null"    json:"location_country"`
	LocationState     string    `gorm:"type:varchar(100)"             json:"location_state,omitempty"`
	
	// Shipping method snapshot
	MethodName        string    `gorm:"type:varchar(150);not null"    json:"method_name"`
	MethodDescription string    `gorm:"type:varchar(500)"             json:"method_description,omitempty"`
	PricingType       string    `gorm:"type:varchar(20);not null"     json:"pricing_type"` // flat, per_item, weight
	Rate              float64   `gorm:"type:decimal(10,2);not null"   json:"rate"`
	Currency          string    `gorm:"type:varchar(10);not null"     json:"currency"`
	CurrencySymbol    string    `gorm:"type:varchar(10)"              json:"currency_symbol,omitempty"`
	MinDays           *int      `                                     json:"min_days,omitempty"`
	MaxDays           *int      `                                     json:"max_days,omitempty"`
	
	CreatedAt         time.Time `                                     json:"created_at"`
}

func (OrderZoneDelivery) TableName() string { return "order_zone_deliveries" }

// OrderLocalDelivery - Snapshot of local shipping rate at order time
type OrderLocalDelivery struct {
	ID                  uint      `gorm:"primaryKey;autoIncrement"      json:"id"`
	OrderID             uint      `gorm:"uniqueIndex;not null"          json:"order_id"`
	LocalShippingRateID uint      `gorm:"not null;index"                json:"local_shipping_rate_id"`
	BrandID             uint      `gorm:"not null;index"                json:"brand_id"`
	
	// Local rate snapshot
	Country             string    `gorm:"type:varchar(100);not null"    json:"country"`
	CountryCode         string    `gorm:"type:varchar(10);not null"     json:"country_code"`
	State               string    `gorm:"type:varchar(100)"             json:"state,omitempty"`
	StateCode           string    `gorm:"type:varchar(10)"              json:"state_code,omitempty"`
	City                string    `gorm:"type:varchar(100)"             json:"city,omitempty"`
	BasePrice           float64   `gorm:"type:decimal(10,2);not null"   json:"base_price"`
	Currency            string    `gorm:"type:varchar(10);not null"     json:"currency"`
	CurrencySymbol      string    `gorm:"type:varchar(10)"              json:"currency_symbol,omitempty"`
	
	// Area overrides snapshot (JSON array of custom pricing for specific areas)
	AreaOverrides       string    `gorm:"type:json"                     json:"area_overrides,omitempty"`
	
	CreatedAt           time.Time `                                     json:"created_at"`
}

func (OrderLocalDelivery) TableName() string { return "order_local_deliveries" }

// ─────────────────────────────────────────────────────────────────────────────
// ✅ Payment Detail Tables
// ─────────────────────────────────────────────────────────────────────────────

// OrderPaymentTransfer - Bank/Manual transfer payment details
type OrderPaymentTransfer struct {
	ID           uint       `gorm:"primaryKey;autoIncrement"      json:"id"`
	OrderID      uint       `gorm:"uniqueIndex;not null"          json:"order_id"`
	Reference    string     `gorm:"type:varchar(200);not null"    json:"reference"`
	ReceiptURL   string     `gorm:"type:varchar(512)"             json:"receipt_url,omitempty"`
	
	// Optional fields for manual verification workflow
	BankName     string     `gorm:"type:varchar(100)"             json:"bank_name,omitempty"`
	AccountName  string     `gorm:"type:varchar(200)"             json:"account_name,omitempty"`
	TransferDate *time.Time `                                     json:"transfer_date,omitempty"`
	
	// Admin verification fields
	VerifiedBy   *uint      `gorm:"index"                         json:"verified_by,omitempty"`
	VerifiedAt   *time.Time `                                     json:"verified_at,omitempty"`
	Notes        string     `gorm:"type:varchar(500)"             json:"notes,omitempty"`
	
	CreatedAt    time.Time  `                                     json:"created_at"`
	UpdatedAt    time.Time  `                                     json:"updated_at"`
}

func (OrderPaymentTransfer) TableName() string { return "order_payment_transfers" }

// OrderPaymentGateway - Paystack/Flutterwave payment details
type OrderPaymentGateway struct {
	ID              uint      `gorm:"primaryKey;autoIncrement"      json:"id"`
	OrderID         uint      `gorm:"uniqueIndex;not null"          json:"order_id"`
	Gateway         string    `gorm:"type:varchar(20);not null"     json:"gateway"`           // 'paystack' or 'flutterwave'
	TransactionID   string    `gorm:"type:varchar(191);not null;index" json:"transaction_id"` // Gateway's transaction ID
	Reference       string    `gorm:"type:varchar(191);not null;index" json:"reference"`      // Our reference (merchant ref)
	
	// Transaction details
	Amount          float64   `gorm:"type:decimal(10,2);not null"   json:"amount"`
	Currency        string    `gorm:"type:varchar(10);not null"     json:"currency"`
	Status          string    `gorm:"type:varchar(50);not null"     json:"status"`            // success, failed, etc.
	
	// Payment channel details
	Channel         string    `gorm:"type:varchar(50)"              json:"channel,omitempty"`     // card, bank_transfer, ussd, mobilemoney, etc.
	CardType        string    `gorm:"type:varchar(50)"              json:"card_type,omitempty"`   // visa, mastercard, verve, etc.
	CardLast4       string    `gorm:"type:varchar(4)"               json:"card_last4,omitempty"`  // Last 4 digits
	
	// Customer info
	CustomerEmail   string    `gorm:"type:varchar(255)"             json:"customer_email,omitempty"`
	
	// Full gateway response (JSON)
	GatewayResponse string    `gorm:"type:json"                     json:"gateway_response,omitempty"` // Complete response from gateway
	
	// Timestamps
	VerifiedAt      time.Time `gorm:"not null"                      json:"verified_at"`
	CreatedAt       time.Time `                                     json:"created_at"`
}

func (OrderPaymentGateway) TableName() string { return "order_payment_gateways" }