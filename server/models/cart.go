package models

import "time"

// CartItem — one row per product+size combo a user has in their cart.
// No separate Cart table — the cart is just all CartItems for a user_id.
// Merges guest → user cart on login (handled in handler logic).
type CartItem struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        uint      `gorm:"not null;index"           json:"user_id"`
	ProductID     uint      `gorm:"not null;index"           json:"product_id"`
	ProductSizeID *uint     `gorm:"index"                    json:"product_size_id"` // nil = no size
	Quantity      int       `gorm:"not null;default:1"       json:"quantity"`
	CreatedAt     time.Time `                               json:"created_at"`
	UpdatedAt     time.Time `                               json:"updated_at"`
}