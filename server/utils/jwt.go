package utils

import (
	"errors"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID      uint   `json:"user_id"`
	Email       string `json:"email"`
	AccountType string `json:"account_type"`
	jwt.RegisteredClaims
}

func SignToken(userID uint, email, accountType string) (string, error) {
	claims := Claims{
		UserID:      userID,
		Email:       email,
		AccountType: accountType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(config.App.JWTExpiresIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "blvckmrkt",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}

func ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.App.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}