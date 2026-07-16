package models

import (
	"time"

	"gorm.io/gorm"
)

type DropStatus string

const (
	DropScheduled DropStatus = "scheduled" // product is draft/archived — not live yet
	DropLive      DropStatus = "live"      // product is active/sold_out — visible
	DropEnded     DropStatus = "ended"     // product removed from drop
)

// Drop — a timed product release event created by a brand.
// Auto-created when the brand first adds a product via the Latest Drop toggle.
type Drop struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"               json:"id"`
	BrandID   uint           `gorm:"not null;index"                         json:"brand_id"`
	UserID    uint           `gorm:"not null;index"                         json:"user_id"`
	Name      string         `gorm:"type:varchar(200);not null"             json:"name"`
	Slug      string         `gorm:"type:varchar(191);uniqueIndex;not null" json:"slug"`
	DropAt    *time.Time     `gorm:"default:null"                           json:"drop_at"`
	EndsAt    *time.Time     `gorm:"default:null"                           json:"ends_at"`
	CreatedAt time.Time      `                                              json:"created_at"`
	UpdatedAt time.Time      `                                              json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                                  json:"-"`

	Products []DropProduct `gorm:"foreignKey:DropID" json:"products,omitempty"`
}

// DropProduct — join table linking drops ↔ products (max 8 per drop, enforced in handler).
// Status uses a pointer so GORM always includes it in INSERT statements,
// preventing MySQL from silently applying the column default ('scheduled')
// even when the handler explicitly sets 'live'.
//   - "scheduled" → product is draft or archived
//   - "live"      → product is active or sold_out
//   - "ended"     → product was removed from the drop (ends_at recorded)
type DropProduct struct {
	ID        uint        `gorm:"primaryKey;autoIncrement"                     json:"id"`
	DropID    uint        `gorm:"not null;index;uniqueIndex:uidx_drop_product" json:"drop_id"`
	ProductID uint        `gorm:"not null;index;uniqueIndex:uidx_drop_product" json:"product_id"`
	Status    *DropStatus `gorm:"type:enum('scheduled','live','ended');not null" json:"status"`
	EndsAt    *time.Time  `gorm:"default:null"                                  json:"ends_at"`
	CreatedAt time.Time   `                                                     json:"created_at"`
}

func (DropProduct) TableName() string {
	return "drop_products"
}