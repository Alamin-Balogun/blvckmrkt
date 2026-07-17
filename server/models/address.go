package models

import (
	"time"

	"gorm.io/gorm"
)

// Address is shared between buyers and brands.
// UserID links to users.id — any account type can have multiple addresses.
// Nullable: a guest checkout address isn't owned by any account.
type Address struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"             json:"id"`
	UserID    *uint          `gorm:"index"                                json:"user_id"`
	Label     string         `gorm:"type:varchar(80);not null"            json:"label"`          // "Home", "Work", etc.
	Line1     string         `gorm:"type:varchar(255);not null"           json:"line1"`          // Street address
	Line2     string         `gorm:"type:varchar(255)"                    json:"line2,omitempty"`
	City      string         `gorm:"type:varchar(100);not null"           json:"city"`
	State     string         `gorm:"type:varchar(100)"                    json:"state,omitempty"`
	Postcode  string         `gorm:"type:varchar(20)"                     json:"postcode,omitempty"`
	Country   string         `gorm:"type:varchar(100);not null"           json:"country"`
	IsDefault bool           `gorm:"default:false"                        json:"is_default"`
	CreatedAt time.Time      `                                            json:"created_at"`
	UpdatedAt time.Time      `                                            json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"                                json:"-"`
}

// AddressResponse is the safe DTO returned to the client
type AddressResponse struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Label     string    `json:"label"`
	Line1     string    `json:"line1"`
	Line2     string    `json:"line2,omitempty"`
	City      string    `json:"city"`
	State     string    `json:"state,omitempty"`
	Postcode  string    `json:"postcode,omitempty"`
	Country   string    `json:"country"`
	IsDefault bool      `json:"is_default"`
	CreatedAt time.Time `json:"created_at"`
}

func (a *Address) ToResponse() AddressResponse {
	var userID uint
	if a.UserID != nil {
		userID = *a.UserID
	}
	return AddressResponse{
		ID:        a.ID,
		UserID:    userID,
		Label:     a.Label,
		Line1:     a.Line1,
		Line2:     a.Line2,
		City:      a.City,
		State:     a.State,
		Postcode:  a.Postcode,
		Country:   a.Country,
		IsDefault: a.IsDefault,
		CreatedAt: a.CreatedAt,
	}
}