package models

import (
	"time"

	"gorm.io/gorm"
)

// CommunityCategories are the fixed set of topic tags a post can carry.
var CommunityCategories = map[string]bool{
	"design_feedback": true,
	"showcase":        true,
	"general":         true,
	"question":        true,
}

// CommunityPost is a feed post in the brand↔buyer community. Any logged-in
// account (buyer or brand) can author one; BrandID is set only when the
// author was posting as a verified brand at creation time.
type CommunityPost struct {
	ID           uint           `gorm:"primaryKey;autoIncrement"                json:"id"`
	UserID       uint           `gorm:"not null;index"                          json:"user_id"`
	BrandID      *uint          `gorm:"index"                                   json:"brand_id,omitempty"`
	Category     string         `gorm:"type:varchar(40);not null;default:'general';index" json:"category"`
	Body         string         `gorm:"type:text;not null"                      json:"body"`
	ImageURL     string         `gorm:"type:varchar(512)"                       json:"image_url,omitempty"`
	LikeCount    int            `gorm:"not null;default:0"                      json:"like_count"`
	CommentCount int            `gorm:"not null;default:0"                      json:"comment_count"`
	Flagged      bool           `gorm:"not null;default:false;index"            json:"flagged"`
	FlagCount    int            `gorm:"not null;default:0"                      json:"flag_count"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index"                                   json:"-"`
}

// CommunityComment is a flat (non-threaded) reply to a CommunityPost.
type CommunityComment struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"       json:"id"`
	PostID    uint           `gorm:"not null;index"                 json:"post_id"`
	UserID    uint           `gorm:"not null;index"                 json:"user_id"`
	Body      string         `gorm:"type:varchar(2000);not null"    json:"body"`
	Flagged   bool           `gorm:"not null;default:false;index"   json:"flagged"`
	FlagCount int            `gorm:"not null;default:0"             json:"flag_count"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                          json:"-"`
}

// CommunityLike is a per-user toggle on a post — one row per (user, post).
type CommunityLike struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"                                      json:"id"`
	PostID    uint      `gorm:"not null;uniqueIndex:uidx_community_like_user_post"            json:"post_id"`
	UserID    uint      `gorm:"not null;uniqueIndex:uidx_community_like_user_post"            json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// CommunityReport records a single user's flag of a post or comment as
// spam/inappropriate. The unique index dedupes repeat reports from the same
// user against the same target — each unique reporter only bumps the
// target's flag_count once.
type CommunityReport struct {
	ID             uint      `gorm:"primaryKey;autoIncrement"                                                json:"id"`
	TargetType     string    `gorm:"type:enum('post','comment');not null;uniqueIndex:uidx_community_report_user_target" json:"target_type"`
	TargetID       uint      `gorm:"not null;uniqueIndex:uidx_community_report_user_target"                 json:"target_id"`
	ReporterUserID uint      `gorm:"not null;uniqueIndex:uidx_community_report_user_target"                 json:"reporter_user_id"`
	Reason         string    `gorm:"type:varchar(255)"                                                       json:"reason"`
	CreatedAt      time.Time `json:"created_at"`
}
