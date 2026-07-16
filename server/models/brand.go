package models

import (
	"fmt"
	"math/rand"
	"time"
	"gorm.io/gorm"
)

type SubscriptionStatus string

const (
	SubStatusNone      SubscriptionStatus = "none"
	SubStatusTrial     SubscriptionStatus = "trial"
	SubStatusActive    SubscriptionStatus = "active"
	SubStatusExpired   SubscriptionStatus = "expired"
	SubStatusCancelled SubscriptionStatus = "cancelled"
)

type Brand struct {
	ID                 uint               `gorm:"primaryKey;autoIncrement"                                        json:"id"`
	DisplayID          string             `gorm:"type:varchar(20);uniqueIndex;not null"                           json:"display_id"`
	UserID             uint               `gorm:"not null;uniqueIndex"                                            json:"user_id"`
	BrandName          string             `gorm:"type:varchar(150);not null"                                      json:"brand_name"`
	Slug               string             `gorm:"type:varchar(150);uniqueIndex"                                   json:"slug"`
	Description        string             `gorm:"type:text"                                                       json:"description,omitempty"`
	LogoURL            string             `gorm:"type:varchar(512)"                                               json:"logo_url,omitempty"`
	BannerURL          string             `gorm:"type:varchar(512)"                                               json:"banner_url,omitempty"`
	Website            string             `gorm:"type:varchar(255)"                                               json:"website,omitempty"`
	Category           string             `gorm:"type:varchar(100)"                                               json:"category,omitempty"`
	Instagram          string             `gorm:"type:varchar(100)"                                               json:"instagram,omitempty"`
	Facebook           string             `gorm:"type:varchar(100)"                                               json:"facebook,omitempty"`
	Twitter            string             `gorm:"type:varchar(100)"                                               json:"twitter,omitempty"`
	TikTok             string             `gorm:"column:tik_tok;type:varchar(100)"                                json:"tiktok,omitempty"`
	Phone              string             `gorm:"type:varchar(30)"                                                json:"phone,omitempty"`
	VerificationStatus VerificationStatus `gorm:"type:enum('not_applicable','pending','verified','suspended');default:'pending'" json:"verification_status"`

	// ✅ Custom commission rate (NULL = use platform default)
	CommissionRate *float64 `gorm:"type:decimal(5,2);default:null" json:"commission_rate,omitempty"`

	// ✅ Partnership agreement
	PartnershipSigned   bool       `gorm:"default:false"  json:"partnership_signed"`
	PartnershipSignedAt *time.Time `gorm:"default:null"   json:"partnership_signed_at,omitempty"`

	// Subscription fields
	SubscriptionPlan    string             `gorm:"type:varchar(100);default:'none'"                                        json:"subscription_plan"`
	SubscriptionStatus  SubscriptionStatus `gorm:"type:enum('none','trial','active','expired','cancelled');default:'none'" json:"subscription_status"`
	SubscriptionBilling string             `gorm:"type:enum('monthly','annual');default:'monthly'"                         json:"subscription_billing"`
	TrialEndsAt         *time.Time         `gorm:"default:null"                                                            json:"trial_ends_at,omitempty"`
	CurrentPeriodEnd    *time.Time         `gorm:"default:null"                                                            json:"current_period_end,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *Brand) BeforeCreate(tx *gorm.DB) error {
	for {
		b.DisplayID = fmt.Sprintf("BRD-%06d", rand.Intn(900000)+100000)
		var count int64
		tx.Model(&Brand{}).Where("display_id = ?", b.DisplayID).Count(&count)
		if count == 0 {
			break
		}
	}
	b.VerificationStatus = VerificationPending
	b.SubscriptionPlan = "none"
	b.SubscriptionStatus = SubStatusNone
	return nil
}

// ✅ BrandResponse — now includes partnership fields
type BrandResponse struct {
	ID                  uint               `json:"id"`
	DisplayID           string             `json:"display_id"`
	UserID              uint               `json:"user_id"`
	BrandName           string             `json:"brand_name"`
	Slug                string             `json:"slug"`
	Description         string             `json:"description,omitempty"`
	LogoURL             string             `json:"logo_url,omitempty"`
	BannerURL           string             `json:"banner_url,omitempty"`
	Website             string             `json:"website,omitempty"`
	Category            string             `json:"category,omitempty"`
	Instagram           string             `json:"instagram,omitempty"`
	Facebook            string             `json:"facebook,omitempty"`
	Twitter             string             `json:"twitter,omitempty"`
	TikTok              string             `json:"tiktok,omitempty"`
	Phone               string             `json:"phone,omitempty"`
	VerificationStatus  VerificationStatus `json:"verification_status"`
	CommissionRate      *float64           `json:"commission_rate,omitempty"`
	// ✅ Partnership fields in response
	PartnershipSigned   bool       `json:"partnership_signed"`
	PartnershipSignedAt *time.Time `json:"partnership_signed_at,omitempty"`
	SubscriptionPlan    string             `json:"subscription_plan"`
	SubscriptionStatus  SubscriptionStatus `json:"subscription_status"`
	SubscriptionBilling string             `json:"subscription_billing"`
	TrialEndsAt         *time.Time         `json:"trial_ends_at,omitempty"`
	CurrentPeriodEnd    *time.Time         `json:"current_period_end,omitempty"`
	CreatedAt           time.Time          `json:"created_at"`
}

// ✅ ToResponse — now maps partnership fields
func (b *Brand) ToResponse() BrandResponse {
	return BrandResponse{
		ID:                  b.ID,
		DisplayID:           b.DisplayID,
		UserID:              b.UserID,
		BrandName:           b.BrandName,
		Slug:                b.Slug,
		Description:         b.Description,
		LogoURL:             b.LogoURL,
		BannerURL:           b.BannerURL,
		Website:             b.Website,
		Category:            b.Category,
		Instagram:           b.Instagram,
		Facebook:            b.Facebook,
		Twitter:             b.Twitter,
		TikTok:              b.TikTok,
		Phone:               b.Phone,
		VerificationStatus:  b.VerificationStatus,
		CommissionRate:      b.CommissionRate,
		// ✅ Map partnership fields
		PartnershipSigned:   b.PartnershipSigned,
		PartnershipSignedAt: b.PartnershipSignedAt,
		SubscriptionPlan:    b.SubscriptionPlan,
		SubscriptionStatus:  b.SubscriptionStatus,
		SubscriptionBilling: b.SubscriptionBilling,
		TrialEndsAt:         b.TrialEndsAt,
		CurrentPeriodEnd:    b.CurrentPeriodEnd,
		CreatedAt:           b.CreatedAt,
	}
}