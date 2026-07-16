package models

import (
	"time"

	"gorm.io/gorm"
)

type ProductStatus string

const (
	ProductDraft    ProductStatus = "draft"
	ProductActive   ProductStatus = "active"
	ProductSoldOut  ProductStatus = "sold_out"
	ProductArchived ProductStatus = "archived"
)

// Product — listed by a brand (user with account_type = "brand")
type Product struct {
	ID           uint           `gorm:"primaryKey;autoIncrement"               json:"id"`
	BrandID      uint           `gorm:"not null;index"                         json:"brand_id"`    // → brands.id
	UserID       uint           `gorm:"not null;index"                         json:"user_id"`     // → users.id (redundant but fast)
	CategoryID   *uint          `gorm:"index"                                  json:"category_id"` // → categories.id (nullable)
	Name         string         `gorm:"type:varchar(200);not null"             json:"name"`
	Slug         string         `gorm:"type:varchar(191);uniqueIndex;not null" json:"slug"`
	Description  string         `gorm:"type:text"                              json:"description,omitempty"`

	// ── Pricing ──────────────────────────────────────────────────────────────
	// BrandPrice   = the raw price the brand set — never touched by commission logic.
	//                This is the source of truth used to recalculate Price and
	//                ComparePrice whenever the admin changes commission_rate.
	// Price        = BrandPrice × (1 − commission_rate/100) — what buyers pay.
	//                Recalculated automatically on every commission_rate change.
	// ComparePrice = BrandPrice (shown slashed/struck-through in the UI so
	//                buyers can see the original ask vs the discounted price).
	BrandPrice   float64 `gorm:"type:decimal(10,2);not null;default:0" json:"brand_price"`
	Price        float64 `gorm:"type:decimal(10,2);not null"           json:"price"`
	ComparePrice float64 `gorm:"type:decimal(10,2)"                    json:"compare_price,omitempty"`

	Status     ProductStatus  `gorm:"type:enum('draft','active','sold_out','archived');default:'draft'" json:"status"`
	IsFeatured bool           `gorm:"default:false"                         json:"is_featured"`
	Tags       string         `gorm:"type:varchar(500)"                     json:"tags,omitempty"` // comma-separated
	CreatedAt  time.Time      `                                              json:"created_at"`
	UpdatedAt  time.Time      `                                              json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index"                                 json:"-"`

	// GORM associations (preloaded on demand — not auto-loaded)
	Images []ProductImage `gorm:"foreignKey:ProductID" json:"images,omitempty"`
	Sizes  []ProductSize  `gorm:"foreignKey:ProductID" json:"sizes,omitempty"`
}

// ProductImage — multiple images per product
type ProductImage struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"  json:"id"`
	ProductID uint      `gorm:"not null;index"            json:"product_id"`
	URL       string    `gorm:"type:varchar(512);not null" json:"url"`
	Position  int       `gorm:"default:0"                json:"position"` // display order; 0 = primary
	CreatedAt time.Time `                                 json:"created_at"`
}

// ProductSize — each row = one size variant with its own stock count
type ProductSize struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"   json:"id"`
	ProductID uint      `gorm:"not null;index"             json:"product_id"`
	Size      string    `gorm:"type:varchar(20);not null"  json:"size"` // "S","M","L","XL","42","One Size"
	Stock     int       `gorm:"not null;default:0"         json:"stock"`
	CreatedAt time.Time `                                  json:"created_at"`
	UpdatedAt time.Time `                                  json:"updated_at"`
}