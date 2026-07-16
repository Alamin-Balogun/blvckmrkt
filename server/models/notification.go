package models

import (
	"time"

	"gorm.io/gorm"
)

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

type NotifType string

const (
	NotifNews   NotifType = "news"
	NotifDrop   NotifType = "drop"
	NotifOrder  NotifType = "order"
	NotifSystem NotifType = "system"
)

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION — Personal user notifications
// ─────────────────────────────────────────────────────────────────────────────

type Notification struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"           json:"id"`
	UserID    uint           `gorm:"not null;index"                     json:"user_id"`
	Type      NotifType      `gorm:"type:varchar(50);default:'news'"    json:"type"`
	Title     string         `gorm:"type:varchar(255);not null"         json:"title"`
	Body      string         `gorm:"type:text;not null"                 json:"body"`
	IsRead    bool           `gorm:"default:false"                      json:"is_read"`
	RefType   string         `gorm:"type:varchar(50)"                   json:"ref_type,omitempty"`
	RefID     *uint          `gorm:"default:null"                       json:"ref_id,omitempty"`
	CreatedAt time.Time      `gorm:"autoCreateTime"                     json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"                     json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                              json:"-"`
}

func (Notification) TableName() string { return "notifications" }

// ToResponse returns a safe response object
func (n *Notification) ToResponse() NotificationResponse {
	return NotificationResponse{
		ID:        n.ID,
		Type:      string(n.Type),
		Title:     n.Title,
		Body:      n.Body,
		IsRead:    n.IsRead,
		RefType:   n.RefType,
		RefID:     n.RefID,
		CreatedAt: n.CreatedAt,
	}
}

type NotificationResponse struct {
	ID        uint      `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	IsRead    bool      `json:"is_read"`
	RefType   string    `json:"ref_type,omitempty"`
	RefID     *uint     `json:"ref_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION ITEM — For user-facing API responses
// ─────────────────────────────────────────────────────────────────────────────

type NotificationItem struct {
	ID        uint      `json:"id"`
	Type      string    `json:"type"` // "news" | "drop" | "order" | "system"
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// Helper: Convert Notification to NotificationItem
func (n *Notification) ToItem() NotificationItem {
	return NotificationItem{
		ID:        n.ID,
		Type:      string(n.Type),
		Title:     n.Title,
		Body:      n.Body,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt,
	}
}