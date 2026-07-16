package models

import (
	"time"

	"gorm.io/gorm"
)

// Category — product categories e.g. "Hoodies", "Footwear", "Accessories"
type Category struct {
	ID          uint           `gorm:"primaryKey;autoIncrement"              json:"id"`
	Name        string         `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Slug        string         `gorm:"type:varchar(120);uniqueIndex;not null" json:"slug"`        // url-safe e.g. "t-shirts"
	Description string         `gorm:"type:varchar(255)"                      json:"description,omitempty"`
	ImageURL    string         `gorm:"type:varchar(512)"                      json:"image_url,omitempty"` // cover image shown in FeaturedCollections
	SortOrder   int            `gorm:"default:0"                              json:"sort_order"`
	CreatedAt   time.Time      `                                              json:"created_at"`
	UpdatedAt   time.Time      `                                              json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index"                                  json:"-"`
}