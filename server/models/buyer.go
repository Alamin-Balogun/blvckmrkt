package models

import (
	"fmt"
	"math/rand"
	"time"

	"gorm.io/gorm"
)

// Buyer profile — auto-created when account_type = "user".
// UserID links back to users.id (1-to-1).
// Addresses are stored separately in the addresses table (1-to-many via user_id).
// Phone is kept here as a quick-access contact field on the profile.
type Buyer struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"              json:"id"`
	DisplayID string         `gorm:"type:varchar(20);uniqueIndex;not null" json:"display_id"` // BYR-001
	UserID    uint           `gorm:"not null;uniqueIndex"                  json:"user_id"`    // → users.id
	Phone     string         `gorm:"type:varchar(30)"                      json:"phone,omitempty"`
	CreatedAt time.Time      `                                             json:"created_at"`
	UpdatedAt time.Time      `                                             json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                                 json:"-"`
}

func (b *Buyer) BeforeCreate(tx *gorm.DB) error {
	for {
		b.DisplayID = fmt.Sprintf("BYR-%06d", rand.Intn(900000)+100000)
		var count int64
		tx.Model(&Buyer{}).Where("display_id = ?", b.DisplayID).Count(&count)
		if count == 0 {
			break
		}
	}
	return nil
}

type BuyerResponse struct {
	ID                 uint               `json:"id"`
	DisplayID          string             `json:"display_id"`
	UserID             uint               `json:"user_id"`
	VerificationStatus VerificationStatus `json:"verification_status"` // always not_applicable
	Phone              string             `json:"phone,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
}

func (b *Buyer) ToResponse() BuyerResponse {
	return BuyerResponse{
		ID:                 b.ID,
		DisplayID:          b.DisplayID,
		UserID:             b.UserID,
		VerificationStatus: VerificationNA,
		Phone:              b.Phone,
		CreatedAt:          b.CreatedAt,
	}
}