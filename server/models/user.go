package models

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountType string

const (
	AccountUser  AccountType = "user"
	AccountBrand AccountType = "brand"
)

type VerificationStatus string

const (
	VerificationNA        VerificationStatus = "not_applicable"
	VerificationPending   VerificationStatus = "pending"
	VerificationVerified  VerificationStatus = "verified"
	VerificationSuspended VerificationStatus = "suspended"
)

// User is the base auth table.
// brands and buyers each have a user_id column pointing back here.
type User struct {
	ID                  uint               `gorm:"primaryKey;autoIncrement"                                                              json:"id"`
	UserID              string             `gorm:"type:varchar(36);uniqueIndex;not null"                                                 json:"user_id"`
	DisplayID           string             `gorm:"type:varchar(20);uniqueIndex;not null"                                                 json:"display_id"`
	FirstName           string             `gorm:"type:varchar(80);not null"                                                             json:"first_name"`
	LastName            string             `gorm:"type:varchar(80);not null"                                                             json:"last_name"`
	Email               string             `gorm:"type:varchar(191);uniqueIndex;not null"                                                json:"email"`
	Password            string             `gorm:"type:varchar(255);not null"                                                            json:"-"`
	AccountType         AccountType        `gorm:"type:enum('user','brand');default:'user'"                                              json:"account_type"`
	VerificationStatus  VerificationStatus `gorm:"type:enum('not_applicable','pending','verified','suspended');default:'not_applicable'" json:"verification_status"`
	AvatarURL           string             `gorm:"type:varchar(512)"                                                                     json:"avatar_url,omitempty"`
	// Password reset — OTP hashed + 15-minute expiry
	ResetToken          string             `gorm:"type:varchar(255)"                                                                     json:"-"`
	ResetTokenExpiresAt *time.Time         `gorm:"default:null"                                                                          json:"-"`
	CreatedAt           time.Time          `                                                                                              json:"created_at"`
	UpdatedAt           time.Time          `                                                                                              json:"updated_at"`
	DeletedAt           gorm.DeletedAt     `gorm:"index"                                                                                 json:"-"`

	// ── Location — used as fallback for geo-aware currency detection ───────────
	CountryCode *string `gorm:"column:country_code;type:varchar(10)"  json:"country_code"`
	CountryName *string `gorm:"column:country_name;type:varchar(100)" json:"country_name"`
	StateCode   *string `gorm:"column:state_code;type:varchar(20)"    json:"state_code"`
	StateName   *string `gorm:"column:state_name;type:varchar(100)"   json:"state_name"`
	City        *string `gorm:"column:city;type:varchar(100)"         json:"city"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.UserID = uuid.New().String()

	for {
		u.DisplayID = fmt.Sprintf("USR-%06d", rand.Intn(900000)+100000)
		var count int64
		tx.Model(&User{}).Where("display_id = ?", u.DisplayID).Count(&count)
		if count == 0 {
			break
		}
	}

	switch u.AccountType {
	case AccountUser:
		u.VerificationStatus = VerificationNA
	case AccountBrand:
		u.VerificationStatus = VerificationPending
	}
	return nil
}

// ── Response DTO ──────────────────────────────────────────────────────────────

type UserResponse struct {
	ID                 uint               `json:"id"`
	UserID             string             `json:"user_id"`
	DisplayID          string             `json:"display_id"`
	FirstName          string             `json:"first_name"`
	LastName           string             `json:"last_name"`
	Email              string             `json:"email"`
	AccountType        AccountType        `json:"account_type"`
	VerificationStatus VerificationStatus `json:"verification_status"`
	AvatarURL          string             `json:"avatar_url,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	// Location
	CountryCode string `json:"country_code,omitempty"`
	CountryName string `json:"country_name,omitempty"`
	StateCode   string `json:"state_code,omitempty"`
	StateName   string `json:"state_name,omitempty"`
	City        string `json:"city,omitempty"`
}

func (u *User) ToResponse() UserResponse {
	str := func(p *string) string {
		if p != nil {
			return *p
		}
		return ""
	}
	return UserResponse{
		ID:                 u.ID,
		UserID:             u.UserID,
		DisplayID:          u.DisplayID,
		FirstName:          u.FirstName,
		LastName:           u.LastName,
		Email:              u.Email,
		AccountType:        u.AccountType,
		VerificationStatus: u.VerificationStatus,
		AvatarURL:          u.AvatarURL,
		CreatedAt:          u.CreatedAt,
		CountryCode:        str(u.CountryCode),
		CountryName:        str(u.CountryName),
		StateCode:          str(u.StateCode),
		StateName:          str(u.StateName),
		City:               str(u.City),
	}
}