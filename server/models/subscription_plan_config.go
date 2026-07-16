package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// PlanFeature represents a single feature bullet.
// Use Included=true for a ✓ row and Included=false for a ~~strikethrough~~ row.
type PlanFeature struct {
	Text     string `json:"text"`
	Included bool   `json:"included"`
}

// SubscriptionPlanConfig is the admin-controlled plan catalog shown on the
// public pricing page.  It is intentionally separate from the Subscription
// model (which tracks individual brand purchases).
//
// Fields the admin controls:
//   - PlanType  → "buyer" | "brand"  → drives the colour accent in the UI
//   - IsPopular → the plan card that appears enlarged in the middle
//                 Calculated automatically from subscriber counts;
//                 admin can force-override via the toggle.
//   - IconName  → Lucide icon name string (e.g. "star", "store", "user")
//                 Rendered on the public frontend via lucide-react.
type SubscriptionPlanConfig struct {
	ID           uint           `gorm:"primaryKey;autoIncrement"                    json:"id"`
	Name         string         `gorm:"type:varchar(100);not null"                  json:"name"`
	Slug         string         `gorm:"type:varchar(100);uniqueIndex;not null"      json:"slug"`
	Description  string         `gorm:"type:varchar(500)"                           json:"description,omitempty"`
	// PlanType controls which colour accent the card uses on the pricing page.
	//   "none"  → no buyer/brand badge shown; uses the original neutral styling
	//   "buyer" → blue accent, shows "For Buyers" badge
	//   "brand" → amber accent, shows "For Sellers" badge
	PlanType     string         `gorm:"type:enum('none','buyer','brand');default:'none'" json:"plan_type"`
	MonthlyPrice float64        `gorm:"type:decimal(10,2);default:0"                json:"monthly_price"`
	AnnualPrice  float64        `gorm:"type:decimal(10,2);default:0"                json:"annual_price"` // per-month rate when billed annually
	// Features stored as JSON: [{text, included}]
	// Parse/encode via ParseFeatures() / EncodeFeatures()
	Features     string         `gorm:"type:json"                                   json:"features"`
	IconName     string         `gorm:"type:varchar(100);default:'user'"            json:"icon_name"`
	IsPopular    bool           `gorm:"default:false"                               json:"is_popular"`
	SortOrder    int            `gorm:"default:0"                                   json:"sort_order"`
	IsActive     bool           `gorm:"default:true"                                json:"is_active"`
	Tagline      string         `gorm:"type:varchar(200)"                           json:"tagline,omitempty"`
	Tag          string         `gorm:"type:varchar(100)"                           json:"tag,omitempty"`    // e.g. "For Buyers"
	CtaText      string         `gorm:"type:varchar(100)"                           json:"cta_text,omitempty"`
	CtaLink      string         `gorm:"type:varchar(200)"                           json:"cta_link,omitempty"`
	// TrialDays is the admin-configured free trial length in days.
	// 0 = no free trial. 7 = 1 week free, 30 = 1 month free, 365 = 1 year free.
	// When > 0 the first TrialDays days are free regardless of MonthlyPrice.
	TrialDays     int            `gorm:"default:0"                                   json:"trial_days"`
	// UsageCount is computed at query time from the subscriptions table.
	// It is NOT stored in this table.
	UsageCount   int            `gorm:"-"                                           json:"usage_count"`
	CreatedAt    time.Time      `                                                   json:"created_at"`
	UpdatedAt    time.Time      `                                                   json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index"                                       json:"-"`
}

func (SubscriptionPlanConfig) TableName() string { return "subscription_plan_configs" }

// ParseFeatures deserialises the JSON features column into a typed slice.
func (p *SubscriptionPlanConfig) ParseFeatures() []PlanFeature {
	if p.Features == "" {
		return nil
	}
	var out []PlanFeature
	_ = json.Unmarshal([]byte(p.Features), &out)
	return out
}

// EncodeFeatures serialises a feature slice back to the JSON string for storage.
func EncodeFeatures(features []PlanFeature) (string, error) {
	b, err := json.Marshal(features)
	if err != nil {
		return "", err
	}
	return string(b), nil
}