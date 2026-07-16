// models/brand_payout.go
package models

import (
	"time"
	"gorm.io/gorm"
)

type PayoutStatus string
type PayoutGateway string

const (
	PayoutPending   PayoutStatus = "pending"
	PayoutProcessing PayoutStatus = "processing"
	PayoutCompleted PayoutStatus = "completed"
	PayoutFailed    PayoutStatus = "failed"
	PayoutReversed  PayoutStatus = "reversed"
	
	PayoutPaystack     PayoutGateway = "paystack"
	PayoutFlutterwave  PayoutGateway = "flutterwave"
	PayoutManual       PayoutGateway = "manual"
)

// BrandPayout tracks all payouts made to brands
type BrandPayout struct {
	ID                uint           `gorm:"primaryKey;autoIncrement"       json:"id"`
	BrandID           uint           `gorm:"not null;index"                 json:"brand_id"`
	OrderID           uint           `gorm:"not null;index"                 json:"order_id"`
	BankAccountID     uint           `gorm:"not null"                       json:"bank_account_id"`
	
	// Payout details
	Amount            float64        `gorm:"type:decimal(10,2);not null"    json:"amount"`
	Currency          string         `gorm:"type:varchar(10);not null"      json:"currency"`
	Gateway           PayoutGateway  `gorm:"type:enum('paystack','flutterwave','manual');not null" json:"gateway"`
	Status            PayoutStatus   `gorm:"type:enum('pending','processing','completed','failed','reversed');default:'pending'" json:"status"`
	
	// Gateway response
	TransferCode      string         `gorm:"type:varchar(200)"              json:"transfer_code,omitempty"`      // Paystack transfer code
	TransferID        string         `gorm:"type:varchar(191);index"        json:"transfer_id,omitempty"`        // Flutterwave transfer ID
	Reference         string         `gorm:"type:varchar(191);uniqueIndex"  json:"reference"`                    // Our unique reference
	
	// Recipient details snapshot
	RecipientName     string         `gorm:"type:varchar(200);not null"     json:"recipient_name"`
	AccountNumber     string         `gorm:"type:varchar(20);not null"      json:"account_number"`
	BankName          string         `gorm:"type:varchar(150);not null"     json:"bank_name"`
	
	// Admin tracking
	InitiatedBy       uint           `gorm:"not null;index"                 json:"initiated_by"`                 // Admin user ID
	ApprovedBy        *uint          `gorm:"index"                          json:"approved_by,omitempty"`
	
	// Response data
	GatewayResponse   *string        `gorm:"type:json;default:null"         json:"gateway_response,omitempty"`
	FailureReason     string         `gorm:"type:varchar(500)"              json:"failure_reason,omitempty"`
	AdminNotes        string         `gorm:"type:varchar(500)"              json:"admin_notes,omitempty"`
	
	// Timestamps
	ProcessedAt       *time.Time     `                                      json:"processed_at,omitempty"`
	CompletedAt       *time.Time     `                                      json:"completed_at,omitempty"`
	CreatedAt         time.Time      `                                      json:"created_at"`
	UpdatedAt         time.Time      `                                      json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index"                          json:"-"`
}

func (BrandPayout) TableName() string { return "brand_payouts" }