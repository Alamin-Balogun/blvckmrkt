package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// AdminClaims is a separate claims struct for admin JWTs.
// Uses a different issuer ("blvckmrkt-admin") and a longer expiry (7 days)
// so admin sessions outlast the regular 72h user sessions.
type AdminClaims struct {
	AdminID   uint   `json:"admin_id"`
	Email     string `json:"email"`
	TokenType string `json:"token_type"` // always "admin"
	jwt.RegisteredClaims
}

func SignAdminToken(adminID uint, email string) (string, error) {
	secret := adminJWTSecret()

	claims := AdminClaims{
		AdminID:   adminID,
		Email:     email,
		TokenType: "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "blvckmrkt-admin",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseAdminToken(tokenStr string) (*AdminClaims, error) {
	secret := adminJWTSecret()

	token, err := jwt.ParseWithClaims(tokenStr, &AdminClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid admin token")
	}
	if claims.TokenType != "admin" {
		return nil, errors.New("not an admin token")
	}

	return claims, nil
}

// adminJWTSecret returns a dedicated secret for admin tokens.
// Falls back to ADMIN_JWT_SECRET → JWT_SECRET → hardcoded fallback.
func adminJWTSecret() string {
	if s := os.Getenv("ADMIN_JWT_SECRET"); s != "" {
		return s
	}
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return s + "-admin" // namespace it so admin tokens can't be used as user tokens
	}
	return "change-me-admin"
}