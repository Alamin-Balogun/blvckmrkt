package models

import (
	"time"

	"gorm.io/gorm"
)

// ── BlogCategory ──────────────────────────────────────────────────────────────

type BlogCategory struct {
	ID          uint           `gorm:"primaryKey;autoIncrement;type:int unsigned" json:"id"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Slug        string         `gorm:"type:varchar(120);uniqueIndex;not null" json:"slug"`
	Color       string         `gorm:"type:varchar(30);not null;default:'#ef4444'" json:"color"`
	BgColor     string         `gorm:"type:varchar(30);default:'rgba(239,68,68,0.15)'" json:"bg_color"`
	BorderColor string         `gorm:"type:varchar(30);default:'rgba(239,68,68,0.3)'" json:"border_color"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (BlogCategory) TableName() string { return "blog_categories" }

// ── Blog ──────────────────────────────────────────────────────────────────────

type BlogStatus string

const (
	BlogDraft     BlogStatus = "draft"
	BlogPublished BlogStatus = "published"
)

type Blog struct {
	ID           uint           `gorm:"primaryKey;autoIncrement;type:int unsigned" json:"id"`
	CategoryID   uint           `gorm:"not null;index;type:int unsigned" json:"category_id"`
	Title        string         `gorm:"type:varchar(300);not null" json:"title"`
	Slug         string         `gorm:"type:varchar(191);uniqueIndex;not null" json:"slug"`
	Excerpt      string         `gorm:"type:text;not null" json:"excerpt"`
	Body         string         `gorm:"type:longtext;not null" json:"body"`
	CoverImage   string         `gorm:"type:varchar(512);not null;default:''" json:"cover_image"`
	AuthorName   string         `gorm:"type:varchar(150);not null;default:''" json:"author_name"`
	AuthorAvatar string         `gorm:"type:varchar(512);not null;default:''" json:"author_avatar"`
	ReadTime     string         `gorm:"type:varchar(30);not null;default:'5 min read'" json:"read_time"`
	IsFeatured   bool           `gorm:"default:false;index" json:"is_featured"`
	Status       BlogStatus     `gorm:"type:enum('draft','published');not null;default:'draft';index" json:"status"`
	PublishedAt  *time.Time     `gorm:"type:datetime;default:null" json:"published_at,omitempty"`
	CreatedAt    time.Time      `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"type:datetime;not null;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"type:datetime;index" json:"-"`

	// Associations
	Category BlogCategory  `gorm:"foreignKey:CategoryID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"category,omitempty"`
	Comments []BlogComment `gorm:"foreignKey:BlogID" json:"comments,omitempty"`
}

func (Blog) TableName() string { return "blogs" }

// ── BlogComment ───────────────────────────────────────────────────────────────

type BlogComment struct {
    ID        uint           `gorm:"primaryKey;autoIncrement;type:int unsigned" json:"id"`
    BlogID    uint           `gorm:"not null;index;type:int unsigned" json:"blog_id"`
    UserID    uint           `gorm:"not null;index;type:bigint unsigned" json:"user_id"` // ← bigint to match users.id
    Body      string         `gorm:"type:text;not null" json:"body"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (BlogComment) TableName() string { return "blog_comments" }