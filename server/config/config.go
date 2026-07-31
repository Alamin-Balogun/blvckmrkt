package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	Env           string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	JWTSecret     string
	JWTExpiresIn  time.Duration
	AllowedOrigin string
	// Email — Resend (https://resend.com) — free tier: 3k emails/month
	ResendAPIKey  string // from Resend dashboard → API Keys
	EmailFrom     string // e.g. onboarding@resend.dev (dev) or noreply@blvckmrkt.com (prod)
	EmailFromName string // display name shown in inbox e.g. "BLVCKMRKT"
	// SupportEmail receives operational alerts that need a human to act —
	// e.g. manually cancelling a Dellyman booking, since Dellyman has no
	// cancel-order API endpoint.
	SupportEmail string

	// Dellyman — third-party delivery courier (https://dellyman.com/rest-api/)
	// DellymanBaseURL defaults to their sandbox; switch to the live API base
	// once DELLYMAN_API_KEY holds a production key.
	DellymanAPIKey        string
	DellymanBaseURL       string
	DellymanWebhookSecret string
	// Defaults used on every GetQuotes/BookOrder call until we have a UI for
	// picking a vehicle/payment mode per booking. Adjustable via env without
	// a code change once real Dellyman docs/credentials confirm valid values.
	DellymanDefaultVehicle     string
	DellymanDefaultPaymentMode string
	DellymanPickupWindow       string
	// DellymanDefaultPackageWeight (kg) — Dellyman rejects BookOrder with
	// "Package weight must be a valid number greater than 0" if omitted, but
	// we don't collect a real per-product weight yet. Used as a flat
	// placeholder on every package until product-level weight exists.
	DellymanDefaultPackageWeight float64
}

var App *Config

func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("[config] no .env file found, reading from environment")
	}

	jwtDuration, err := time.ParseDuration(getEnv("JWT_EXPIRES_IN", "72h"))
	if err != nil {
		log.Fatalf("[config] invalid JWT_EXPIRES_IN: %v", err)
	}

	App = &Config{
		Port:          getEnv("PORT", "8080"),
		Env:           getEnv("ENV", "development"),
		DBHost:        getEnv("DB_HOST", "localhost"),
		DBPort:        getEnv("DB_PORT", "3306"),
		DBUser:        getEnv("DB_USER", "root"),
		DBPassword:    getEnv("DB_PASSWORD", ""),
		DBName:        getEnv("DB_NAME", "blvckmrkt"),
		JWTSecret:     getEnv("JWT_SECRET", "change-me"),
		JWTExpiresIn:  jwtDuration,
		AllowedOrigin: getEnv("ALLOWED_ORIGIN", "http://localhost:5173"),
		ResendAPIKey:  getEnv("RESEND_API_KEY", ""),
		EmailFrom:     getEnv("EMAIL_FROM", "onboarding@resend.dev"),
		EmailFromName: getEnv("EMAIL_FROM_NAME", "BLVCKMRKT"),
		SupportEmail:  getEnv("SUPPORT_EMAIL", "blvckmrkt.market@gmail.com"),

		DellymanAPIKey:        getEnv("DELLYMAN_API_KEY", ""),
		DellymanBaseURL:       getEnv("DELLYMAN_BASE_URL", "https://dev.dellyman.com/api/v3.0"),
		DellymanWebhookSecret: getEnv("DELLYMAN_WEBHOOK_SECRET", ""),

		DellymanDefaultVehicle:     getEnv("DELLYMAN_DEFAULT_VEHICLE", "Bike"),
		DellymanDefaultPaymentMode: getEnv("DELLYMAN_DEFAULT_PAYMENT_MODE", "online"),
		DellymanPickupWindow:       getEnv("DELLYMAN_PICKUP_WINDOW", "09:00 AM to 06:00 PM"),
	}

	weight, err := strconv.ParseFloat(getEnv("DELLYMAN_DEFAULT_PACKAGE_WEIGHT", "1"), 64)
	if err != nil || weight <= 0 {
		weight = 1
	}
	App.DellymanDefaultPackageWeight = weight

	log.Printf("[config] loaded — env=%s port=%s db=%s@%s/%s",
		App.Env, App.Port, App.DBUser, App.DBHost, App.DBName)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
