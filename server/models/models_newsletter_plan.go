package models

import (
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ── NewsletterSubscriber ──────────────────────────────────────────────────────
type NewsletterSubscriber struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"              json:"id"`
	DisplayID string         `gorm:"type:varchar(20);uniqueIndex;not null" json:"display_id"`
	Email     string         `gorm:"type:varchar(191);uniqueIndex;not null" json:"email"`
	Name      string         `gorm:"type:varchar(255)"                     json:"name,omitempty"`
	Source    string         `gorm:"type:varchar(50);default:'website'"    json:"source"`
	Status    string         `gorm:"type:varchar(20);default:'active'"     json:"status"`
	CreatedAt time.Time      `                                             json:"created_at"`
	UpdatedAt time.Time      `                                             json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                                 json:"-"`
}

func (NewsletterSubscriber) TableName() string { return "newsletter_subscribers" }

// BeforeCreate auto-generates a display ID like NWL-001
func (n *NewsletterSubscriber) BeforeCreate(tx *gorm.DB) error {
	if n.DisplayID != "" {
		return nil
	}
	var count int64
	tx.Model(&NewsletterSubscriber{}).Unscoped().Count(&count)
	n.DisplayID = fmt.Sprintf("NWL-%04d", count+1)
	return nil
}

// ── PlanDefinition ────────────────────────────────────────────────────────────
// Admin-managed plan catalogue (slug, pricing, features).
// Named PlanDefinition to avoid clash with the SubscriptionPlan string-enum in brand.go.

type PlanDefinition struct {
	ID           uint64     `gorm:"primaryKey;autoIncrement"  json:"id"`
	Slug         string     `gorm:"uniqueIndex;size:64"       json:"slug"`
	Name         string     `gorm:"size:128"                  json:"name"`
	Description  string     `gorm:"type:text"                 json:"description"`
	MonthlyPrice float64    `gorm:"type:decimal(10,2)"        json:"monthly_price"`
	AnnualPrice  float64    `gorm:"type:decimal(10,2)"        json:"annual_price"`
	FeaturesJSON string     `gorm:"type:text;column:features" json:"-"`
	Features     []string   `gorm:"-"                         json:"features"`
	IsActive     bool       `gorm:"default:true"              json:"is_active"`
	SortOrder    int        `gorm:"default:0"                 json:"sort_order"`
	CreatedAt    time.Time  `                                  json:"created_at"`
	UpdatedAt    time.Time  `                                  json:"updated_at"`
	DeletedAt    *time.Time `gorm:"index"                     json:"deleted_at,omitempty"`
}

// Table name maps to subscription_plans in the DB
func (PlanDefinition) TableName() string { return "subscription_plans" }

// AfterFind — deserialise features JSON column into slice
func (p *PlanDefinition) AfterFind(tx *gorm.DB) error {
	if p.FeaturesJSON != "" {
		_ = json.Unmarshal([]byte(p.FeaturesJSON), &p.Features)
	}
	if p.Features == nil {
		p.Features = []string{}
	}
	return nil
}

// ── Newsletter ────────────────────────────────────────────────────────────────

type Newsletter struct {
	ID          uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Subject     string     `gorm:"size:255"                 json:"subject"`
	PreviewText string     `gorm:"size:255"                 json:"preview_text"`
	BodyHTML    string     `gorm:"type:longtext"            json:"body_html"`
	BodyText    string     `gorm:"type:longtext"            json:"body_text"`
	Status      string     `gorm:"size:20;default:draft"    json:"status"`
	Audience    string     `gorm:"size:20;default:active"   json:"audience"`
	SentCount   int        `gorm:"default:0"                json:"sent_count"`
	ScheduledAt *time.Time `                                 json:"scheduled_at,omitempty"`
	SentAt      *time.Time `                                 json:"sent_at,omitempty"`
	CreatedBy   *uint64    `                                 json:"created_by,omitempty"`
	CreatedAt   time.Time  `                                 json:"created_at"`
	UpdatedAt   time.Time  `                                 json:"updated_at"`
	DeletedAt   *time.Time `gorm:"index"                    json:"deleted_at,omitempty"`
}

func (Newsletter) TableName() string { return "newsletters" }

// ── NewsletterSend ────────────────────────────────────────────────────────────

type NewsletterSend struct {
	ID           uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	NewsletterID uint64     `gorm:"index"                    json:"newsletter_id"`
	SubscriberID uint64     `gorm:"index"                    json:"subscriber_id"`
	Status       string     `gorm:"size:20;default:pending"  json:"status"`
	SentAt       *time.Time `                                 json:"sent_at,omitempty"`
	Error        string     `gorm:"type:text"                json:"error,omitempty"`
	CreatedAt    time.Time  `                                 json:"created_at"`
}

func (NewsletterSend) TableName() string { return "newsletter_sends" }