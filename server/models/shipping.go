// models/shipping.go
package models

import (
	"time"

	"gorm.io/gorm"
)

type ShippingPricingType string

const (
	PricingFlat    ShippingPricingType = "flat"
	PricingPerItem ShippingPricingType = "per_item"
	PricingWeight  ShippingPricingType = "weight"
)

// ShippingZone — a named delivery region for a brand.
// e.g. "West Africa", "Europe", "Domestic"
type ShippingZone struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"   json:"id"`
	BrandID   uint           `gorm:"not null;index"             json:"brand_id"`
	UserID    uint           `gorm:"not null;index"             json:"user_id"`
	Name      string         `gorm:"type:varchar(150);not null" json:"name"`
	IsActive  bool           `gorm:"default:true"               json:"is_active"`
	CreatedAt time.Time      `                                  json:"created_at"`
	UpdatedAt time.Time      `                                  json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                      json:"-"`

	Locations []ShippingZoneLocation `gorm:"foreignKey:ZoneID" json:"locations,omitempty"`
	Methods   []ShippingMethod       `gorm:"foreignKey:ZoneID" json:"methods,omitempty"`
}

func (ShippingZone) TableName() string { return "shipping_zones" }

// ShippingZoneLocation — one country (+optional state) inside a zone.
type ShippingZoneLocation struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"     json:"id"`
	ZoneID    uint      `gorm:"not null;index"               json:"zone_id"`
	Country   string    `gorm:"type:varchar(100);not null"   json:"country"`
	State     string    `gorm:"type:varchar(100);default:''" json:"state,omitempty"`
	CreatedAt time.Time `                                    json:"created_at"`
}

func (ShippingZoneLocation) TableName() string { return "shipping_zone_locations" }

// ShippingMethod — one delivery option inside a zone.
// e.g. "Standard Delivery", "Express (Next Day)"
//
// Currency + CurrencySymbol store whichever currency the brand selected
// when creating this method. Since a zone can span countries with different
// currencies (e.g. Africa = NGN, GHS, KES, ZAR…), the brand picks one
// currency per method via the currency picker in the Shipping page.
type ShippingMethod struct {
	ID             uint                `gorm:"primaryKey;autoIncrement"                            json:"id"`
	ZoneID         uint                `gorm:"not null;index"                                      json:"zone_id"`
	BrandID        uint                `gorm:"not null;index"                                      json:"brand_id"`
	Name           string              `gorm:"type:varchar(150);not null"                          json:"name"`
	Description    string              `gorm:"type:varchar(500)"                                   json:"description,omitempty"`
	PricingType    ShippingPricingType `gorm:"type:enum('flat','per_item','weight');default:'flat'" json:"pricing_type"`
	FlatRate       float64             `gorm:"type:decimal(10,2);default:0"                        json:"flat_rate"`
	PerItemRate    float64             `gorm:"type:decimal(10,2);default:0"                        json:"per_item_rate"`
	WeightRate     float64             `gorm:"type:decimal(10,2);default:0"                        json:"weight_rate"`
	FreeAbove      *float64            `gorm:"type:decimal(10,2)"                                  json:"free_above"` // nil = disabled
	MinDays        *int                `gorm:"default:null"                                        json:"min_days"`
	MaxDays        *int                `gorm:"default:null"                                        json:"max_days"`
	IsActive       bool                `gorm:"default:true"                                        json:"is_active"`
	
	// Currency — set when the brand creates/edits the method.
	// Stored per-method so each method in a zone can independently use
	// the currency that makes sense for that delivery option.
	Currency       string         `gorm:"column:currency;type:varchar(10)"       json:"currency"`
	CurrencySymbol string         `gorm:"column:currency_symbol;type:varchar(10)" json:"currency_symbol"`
	
	CreatedAt      time.Time      `                                              json:"created_at"`
	UpdatedAt      time.Time      `                                              json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index"                                  json:"-"`

	// ✅ ADD THIS: Relationship to parent zone
	Zone           *ShippingZone  `gorm:"foreignKey:ZoneID"                      json:"zone,omitempty"`
}

func (ShippingMethod) TableName() string { return "shipping_methods" }