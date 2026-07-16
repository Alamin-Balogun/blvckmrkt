package models

import "time"

// BrandFollow — a buyer following a brand to get drop notifications.
// Unique on (user_id, brand_id) — can only follow once.
type BrandFollow struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"                      json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:uidx_follow_user_brand"   json:"user_id"`
	BrandID   uint      `gorm:"not null;uniqueIndex:uidx_follow_user_brand"   json:"brand_id"`
	CreatedAt time.Time `                                                     json:"created_at"`
}