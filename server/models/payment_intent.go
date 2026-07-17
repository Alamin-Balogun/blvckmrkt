// models/payment_intent.go
package models

import "time"

// PaymentIntentStatus tracks a hosted-checkout payment from initiation to
// resolution. Needed because redirect-based gateways (the customer's browser
// leaves our app entirely) can't carry the pending order in memory — we park
// it here, keyed by tx_ref, until the gateway redirects back.
type PaymentIntentStatus string

const (
	IntentPending    PaymentIntentStatus = "pending"
	IntentProcessing PaymentIntentStatus = "processing" // claimed by a finalizer — see claimIntentOrWait
	IntentCompleted  PaymentIntentStatus = "completed"
	IntentFailed     PaymentIntentStatus = "failed"
)

type PaymentIntent struct {
	ID            uint                `gorm:"primaryKey;autoIncrement"              json:"id"`
	TxRef         string              `gorm:"type:varchar(191);uniqueIndex;not null" json:"tx_ref"`
	UserID        uint                `gorm:"not null;index"                        json:"user_id"`
	Gateway       string              `gorm:"type:varchar(20);not null"             json:"gateway"`
	Amount        float64             `gorm:"type:decimal(10,2);not null"           json:"amount"`
	Currency      string              `gorm:"type:varchar(10);not null"             json:"currency"`
	Payload       string              `gorm:"type:json;not null"                    json:"-"`
	Status        PaymentIntentStatus `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	OrderID       *uint               `                                              json:"order_id,omitempty"`
	OrderRef      string              `gorm:"type:varchar(20)"                      json:"order_ref,omitempty"`
	FailureReason string              `gorm:"type:varchar(255)"                     json:"failure_reason,omitempty"`
	CreatedAt     time.Time           `                                              json:"created_at"`
	UpdatedAt     time.Time           `                                              json:"updated_at"`
}

func (PaymentIntent) TableName() string { return "payment_intents" }
