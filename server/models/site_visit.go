package models

import "time"

// SiteVisit is a lightweight page-view record. Since the frontend is a
// client-side-routed SPA, a server request log would only ever see the
// initial index.html load — the frontend fires one of these per route
// change instead. SessionID is a random ID the frontend generates once and
// keeps in sessionStorage, used only to approximate unique visitors per
// browser session — not tied to any account or PII.
type SiteVisit struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"   json:"id"`
	Path      string    `gorm:"type:varchar(255);not null;index" json:"path"`
	Referrer  string    `gorm:"type:varchar(255)"          json:"referrer,omitempty"`
	SessionID string    `gorm:"type:varchar(64);index"     json:"-"`
	CreatedAt time.Time `gorm:"index"                      json:"created_at"`
}

func (SiteVisit) TableName() string { return "site_visits" }
