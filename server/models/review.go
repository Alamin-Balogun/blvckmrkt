package models

import (
	"time"

	"gorm.io/gorm"
)

// Review — buyer review on a product, tied to a specific order item (verified purchase)
type Review struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"                      json:"id"`
	UserID    uint           `gorm:"not null;uniqueIndex:uidx_review_user_product" json:"user_id"`    // reviewer
	ProductID uint           `gorm:"not null;uniqueIndex:uidx_review_user_product" json:"product_id"` // one review per user per product
	OrderID   *uint          `gorm:"index"                                         json:"order_id,omitempty"` // verified purchase ref
	Rating    int            `gorm:"not null"                                      json:"rating"`     // 1–5
	Title     string         `gorm:"type:varchar(200)"                             json:"title,omitempty"`
	Body      string         `gorm:"type:text"                                     json:"body,omitempty"`
	Flagged   bool           `gorm:"default:false"                                 json:"flagged"`
	CreatedAt time.Time      `                                                     json:"created_at"`
	UpdatedAt time.Time      `                                                     json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                                         json:"-"`
}