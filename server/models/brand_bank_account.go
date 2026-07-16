// models/brand_bank_account.go
package models

import (
	"time"
	"gorm.io/gorm"
)

type BankAccountType string

const (
	BankAccountSavings BankAccountType = "savings"
	BankAccountCurrent BankAccountType = "current"
)

// BrandBankAccount stores brand's payout account details
type BrandBankAccount struct {
	ID              uint             `gorm:"primaryKey;autoIncrement"       json:"id"`
	BrandID         uint             `gorm:"uniqueIndex;not null"           json:"brand_id"`
	
	// Bank details
	BankName             string           `gorm:"type:varchar(150);not null"     json:"bank_name"`
	PaystackBankCode     string           `gorm:"type:varchar(20);not null"      json:"paystack_bank_code"`
	FlutterwaveBankCode  string           `gorm:"type:varchar(20);not null"      json:"flutterwave_bank_code"`
	AccountNumber        string           `gorm:"type:varchar(20);not null"      json:"account_number"`
	AccountName          string           `gorm:"type:varchar(200);not null"     json:"account_name"`
	AccountType          BankAccountType  `gorm:"type:enum('savings','current');default:'savings'" json:"account_type"`
	
	// Additional info
	Currency        string           `gorm:"type:varchar(10);default:'NGN'" json:"currency"`
	Country         string           `gorm:"type:varchar(100);default:'Nigeria'" json:"country"`
	
	// Verification (Gateway recipient codes)
	PaystackRecipientCode    string  `gorm:"type:varchar(100)"             json:"paystack_recipient_code,omitempty"`
	FlutterwaveRecipientID   string  `gorm:"type:varchar(100)"             json:"flutterwave_recipient_id,omitempty"`
	
	// Status
	IsVerified      bool             `gorm:"default:false"                  json:"is_verified"`
	IsActive        bool             `gorm:"default:true"                   json:"is_active"`
	
	// Metadata
	Notes           string           `gorm:"type:varchar(500)"              json:"notes,omitempty"`
	VerifiedAt      *time.Time       `                                      json:"verified_at,omitempty"`
	
	CreatedAt       time.Time        `                                      json:"created_at"`
	UpdatedAt       time.Time        `                                      json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `gorm:"index"                          json:"-"`
}

func (BrandBankAccount) TableName() string { return "brand_bank_accounts" }