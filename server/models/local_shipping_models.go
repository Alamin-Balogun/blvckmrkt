package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// ── AreaOverride ──────────────────────────────────────────────────────────────
type AreaOverride struct {
	Area      string  `json:"area"`
	Price     float64 `json:"price"`
	IsSpecial bool    `json:"is_special"`
}

// ── AreaOverrides — custom type that auto-marshals to/from JSON in MySQL ──────
// Using a custom type avoids needing the gorm.io/datatypes extra dependency.
type AreaOverrides []AreaOverride

// Value — called by GORM/database driver when writing to DB
func (a AreaOverrides) Value() (driver.Value, error) {
	if a == nil {
		return "[]", nil
	}
	b, err := json.Marshal(a)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

// Scan — called by GORM/database driver when reading from DB
func (a *AreaOverrides) Scan(value interface{}) error {
	if value == nil {
		*a = AreaOverrides{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("cannot scan type %T into AreaOverrides", value)
	}
	if len(bytes) == 0 || string(bytes) == "null" {
		*a = AreaOverrides{}
		return nil
	}
	return json.Unmarshal(bytes, a)
}

// ── LocalShippingRate ─────────────────────────────────────────────────────────
type LocalShippingRate struct {
	ID             uint          `gorm:"primaryKey;autoIncrement"                      json:"id"`
	BrandID        uint          `gorm:"not null;index"                                json:"brand_id"`
	Country        string        `gorm:"size:100;not null"                             json:"country"`
	CountryCode    string        `gorm:"column:country_code;size:10;not null"          json:"country_code"`
	State          string        `gorm:"size:100;not null"                             json:"state"`
	StateCode      string        `gorm:"column:state_code;size:20;not null"            json:"state_code"`
	City           *string       `gorm:"size:100;default:null"                         json:"city"`
	Currency       string        `gorm:"size:10;default:''"                            json:"currency"`
	CurrencySymbol string        `gorm:"column:currency_symbol;size:10;default:''"     json:"currency_symbol"`
	BasePrice      float64       `gorm:"type:decimal(12,2);not null;default:0"         json:"base_price"`
	// Stored as JSON in DB, automatically parsed to []AreaOverride on read
	AreaOverrides  AreaOverrides `gorm:"type:json"                                     json:"area_overrides"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

func (LocalShippingRate) TableName() string { return "local_shipping_rates" }

// ── PickupLocation ────────────────────────────────────────────────────────────
type PickupLocation struct {
	ID           uint      `gorm:"primaryKey;autoIncrement"                       json:"id"`
	BrandID      uint      `gorm:"not null;index"                                 json:"brand_id"`
	Name         string    `gorm:"size:200;not null"                              json:"name"`
	Address      string    `gorm:"size:500;not null"                              json:"address"`
	City         string    `gorm:"size:100;not null"                              json:"city"`
	State        string    `gorm:"size:100;default:''"                            json:"state"`
	StateCode    string    `gorm:"column:state_code;size:20;default:''"           json:"state_code"`
	Country      string    `gorm:"size:100;default:''"                            json:"country"`
	CountryCode  string    `gorm:"column:country_code;size:10;default:''"         json:"country_code"`
	Phone        string    `gorm:"size:50;default:''"                             json:"phone"`
	Instructions string    `gorm:"type:text;default:null"                         json:"instructions"`
	Active       bool      `gorm:"not null;default:1"                             json:"active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (PickupLocation) TableName() string { return "pickup_locations" }