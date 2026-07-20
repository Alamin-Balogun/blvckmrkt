package config

import (
	"log"
	"os"
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

	// Dellyman — third-party delivery courier (https://dellyman.com/rest-api/)
	// DellymanBaseURL defaults to their sandbox; switch to the live API base
	// once DELLYMAN_API_KEY holds a production key.
	DellymanAPIKey        string
	DellymanBaseURL       string
	DellymanWebhookSecret string
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
		ResendAPIKey:  getEnv("RESEND_API_KEY", "re_M896jNBj_9xA7j4MzZBTxkDjaFa2EvV6E"),
		EmailFrom:     getEnv("EMAIL_FROM", "onboarding@resend.dev"),
		EmailFromName: getEnv("EMAIL_FROM_NAME", "BLVCKMRKT"),

		DellymanAPIKey:        getEnv("DELLYMAN_API_KEY", ""),
		DellymanBaseURL:       getEnv("DELLYMAN_BASE_URL", "https://dev.dellyman.com/api/v3.0"),
		DellymanWebhookSecret: getEnv("DELLYMAN_WEBHOOK_SECRET", ""),
	}

	log.Printf("[config] loaded — env=%s port=%s db=%s@%s/%s",
		App.Env, App.Port, App.DBUser, App.DBHost, App.DBName)
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}