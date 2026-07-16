package models

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"gorm.io/gorm"
)

type Subscription struct {
	ID               uint               `gorm:"primaryKey;autoIncrement"                                           json:"id"`
	Reference        string             `gorm:"type:varchar(20);uniqueIndex;not null"                              json:"reference"`
	UserID           uint               `gorm:"not null;index"                                                     json:"user_id"`
	BrandID          uint               `gorm:"not null;index"                                                     json:"brand_id"`
	
	// ✅ Store plan details (no enum, dynamic from database)
	PlanSlug         string             `gorm:"type:varchar(100);not null"                                         json:"plan_slug"`  // e.g., "blvck", "starter", custom slugs
	PlanName         string             `gorm:"type:varchar(150);not null"                                         json:"plan_name"`  // e.g., "BLVCK", "Starter", custom names
	
	Billing          string             `gorm:"type:enum('monthly','annual');not null;default:'monthly'"           json:"billing"`
	Status           SubscriptionStatus `gorm:"type:enum('none','trial','active','expired','cancelled');not null"  json:"status"`
	PricePaid        float64            `gorm:"type:decimal(10,2);default:0.00"                                    json:"price_paid"`
	TrialEndsAt      *time.Time         `gorm:"default:null"                                                       json:"trial_ends_at,omitempty"`
	PeriodStart      time.Time          `gorm:"not null"                                                           json:"period_start"`
	PeriodEnd        time.Time          `gorm:"not null"                                                           json:"period_end"`
	
	// Payment tracking fields
	PaymentMethod    string             `gorm:"type:varchar(50)"                                                   json:"payment_method,omitempty"`
	PaymentReference string             `gorm:"type:varchar(100)"                                                  json:"payment_reference,omitempty"`
	ReceiptURL       string             `gorm:"type:varchar(512)"                                                  json:"receipt_url,omitempty"`
	
	CreatedAt        time.Time          `                                                                          json:"created_at"`
	UpdatedAt        time.Time          `                                                                          json:"updated_at"`
	DeletedAt        gorm.DeletedAt     `gorm:"index"                                                              json:"-"`
}

func GenerateUniqueRef(db *gorm.DB) string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	for {
		b := make([]byte, 6)
		for i := range b {
			b[i] = chars[rand.Intn(len(chars))]
		}
		ref := fmt.Sprintf("SUB-%s", strings.ToUpper(string(b)))

		var count int64
		db.Model(&Subscription{}).Where("reference = ?", ref).Count(&count)
		if count == 0 {
			return ref
		}
	}
}

type SubscriptionResponse struct {
	ID               uint               `json:"id"`
	Reference        string             `json:"reference"`
	UserID           uint               `json:"user_id"`
	BrandID          uint               `json:"brand_id"`
	PlanSlug         string             `json:"plan_slug"`
	PlanName         string             `json:"plan_name"`
	Billing          string             `json:"billing"`
	Status           SubscriptionStatus `json:"status"`
	PricePaid        float64            `json:"price_paid"`
	TrialEndsAt      *time.Time         `json:"trial_ends_at,omitempty"`
	PeriodStart      time.Time          `json:"period_start"`
	PeriodEnd        time.Time          `json:"period_end"`
	PaymentMethod    string             `json:"payment_method,omitempty"`
	PaymentReference string             `json:"payment_reference,omitempty"`
	ReceiptURL       string             `json:"receipt_url,omitempty"`
	CreatedAt        time.Time          `json:"created_at"`
}

func (s *Subscription) ToResponse() SubscriptionResponse {
	return SubscriptionResponse{
		ID:               s.ID,
		Reference:        s.Reference,
		UserID:           s.UserID,
		BrandID:          s.BrandID,
		PlanSlug:         s.PlanSlug,
		PlanName:         s.PlanName,
		Billing:          s.Billing,
		Status:           s.Status,
		PricePaid:        s.PricePaid,
		TrialEndsAt:      s.TrialEndsAt,
		PeriodStart:      s.PeriodStart,
		PeriodEnd:        s.PeriodEnd,
		PaymentMethod:    s.PaymentMethod,
		PaymentReference: s.PaymentReference,
		ReceiptURL:       s.ReceiptURL,
		CreatedAt:        s.CreatedAt,
	}
}