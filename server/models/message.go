package models

import "time"

// Message — one line in a buyer<->brand conversation. A "conversation" is
// just every Message row sharing the same (BuyerID, BrandID) pair, ordered
// by CreatedAt — no separate Conversation table needed for a two-party thread.
type Message struct {
	ID         uint      `gorm:"primaryKey;autoIncrement"   json:"id"`
	BuyerID    uint      `gorm:"not null;index:idx_msg_pair" json:"buyer_id"`    // → users.id
	BrandID    uint      `gorm:"not null;index:idx_msg_pair" json:"brand_id"`    // → brands.id
	SenderType string    `gorm:"type:enum('buyer','brand');not null" json:"sender_type"`
	Body       string    `gorm:"type:text;not null"         json:"body"`
	IsRead     bool      `gorm:"default:false"              json:"is_read"`
	CreatedAt  time.Time `                                  json:"created_at"`
}

func (Message) TableName() string { return "messages" }
