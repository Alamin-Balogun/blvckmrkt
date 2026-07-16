package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// GenerateOTP creates a 6-digit code and returns:
//   - plain     — the raw code to show/email to the user
//   - hashed    — bcrypt hash to store in the database
//   - expiresAt — 15 minutes from now
func GenerateOTP() (plain string, hashed string, expiresAt time.Time, err error) {
	// Build 6 cryptographically secure random digits
	code := ""
	for i := 0; i < 6; i++ {
		n, e := rand.Int(rand.Reader, big.NewInt(10))
		if e != nil {
			err = e
			return
		}
		code += fmt.Sprintf("%d", n.Int64())
	}

	h, e := bcrypt.GenerateFromPassword([]byte(code), bcrypt.DefaultCost)
	if e != nil {
		err = e
		return
	}

	plain     = code
	hashed    = string(h)
	expiresAt = time.Now().Add(15 * time.Minute)
	return
}

// VerifyOTP checks the plain text code against the stored bcrypt hash
// and confirms the token has not expired.
func VerifyOTP(plain string, storedHash string, expiresAt *time.Time) bool {
	if storedHash == "" || expiresAt == nil {
		return false
	}
	if time.Now().After(*expiresAt) {
		return false // token expired
	}
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(plain))
	return err == nil
}