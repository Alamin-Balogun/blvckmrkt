package models

import "time"

// SitePage stores editable content for each page slug (home, about, shop, etc.)
type SitePage struct {
	Slug        string    `gorm:"primaryKey;size:50"                     json:"slug"`
	ContentJSON string    `gorm:"type:text;not null"                     json:"-"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"                         json:"updated_at"`
}

// AdminSetting is a simple key-value store for platform-wide config.
type AdminSetting struct {
	Key       string    `gorm:"primaryKey;column:setting_key;size:100" json:"key"`
	Value     string    `gorm:"column:setting_value;type:text"         json:"value"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"                         json:"updated_at"`
}

// RolePrivilege stores a JSON blob of privilege flags per role.
type RolePrivilege struct {
	Role           string    `gorm:"primaryKey;size:20" json:"role"`
	PrivilegesJSON string    `gorm:"type:text;not null" json:"-"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime"     json:"updated_at"`
}

// UserPrivilege stores per-user privilege overrides on top of role defaults.
type UserPrivilege struct {
	UserID        string    `gorm:"primaryKey;size:36" json:"user_id"`
	OverridesJSON string    `gorm:"type:text;not null" json:"-"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"     json:"updated_at"`
}