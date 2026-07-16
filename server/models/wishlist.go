package models

import "time"

// WishlistItem — one row per product a user has saved.
// Unique on (user_id, product_id) to prevent duplicates.
type WishlistItem struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"                      json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:uidx_wishlist_user_product" json:"user_id"`
	ProductID uint      `gorm:"not null;uniqueIndex:uidx_wishlist_user_product" json:"product_id"`
	CreatedAt time.Time `                                                     json:"created_at"`
}