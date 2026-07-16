package models

import (
	"time"
)

// EmailVerification stores pending OTPs for signup email verification.
// A record is created when the user requests a code and deleted after
// successful verification. Unverified records expire after 15 minutes.
type EmailVerification struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Email     string    `gorm:"type:varchar(191);uniqueIndex;not null" json:"email"`
	HashedOTP string    `gorm:"type:varchar(255);not null"            json:"-"`
	ExpiresAt time.Time `gorm:"not null"                              json:"expires_at"`
	CreatedAt time.Time `                                              json:"created_at"`
}