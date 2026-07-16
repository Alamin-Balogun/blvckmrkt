package models

import (
	"time"
	"gorm.io/gorm"
)

// ─────────────────────────────────────────────────────────────────────────────
// ✅ BlacklistedToken - Stores invalidated JWT tokens to prevent reuse
// ─────────────────────────────────────────────────────────────────────────────
type BlacklistedToken struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"          json:"id"`
	UserID    uint           `gorm:"not null;index"                    json:"user_id"`
	Token     string         `gorm:"type:varchar(191);not null;index"  json:"token"` // ✅ Changed from text to varchar(512)
	ExpiresAt time.Time      `gorm:"not null;index"                    json:"expires_at"`
	CreatedAt time.Time      `                                         json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                             json:"-"`
}

func (BlacklistedToken) TableName() string {
	return "blacklisted_tokens"
}