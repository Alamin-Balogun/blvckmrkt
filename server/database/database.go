package database

import (
	"fmt"
	"log"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect initializes MySQL connection
func Connect() {
	cfg := config.App

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	log.Println("[database] connecting to:", cfg.DBName)

	logLevel := logger.Silent
	if cfg.Env == "development" {
		logLevel = logger.Info
	}

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("[database] failed to connect: %v", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("[database] failed to get sql.DB: %v", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)

	log.Println("[database] connected successfully")
}

// Migrate runs all schema migrations safely and shows clear logs
func Migrate(models ...interface{}) error {
	log.Println("[database] starting migrations...")

	if DB == nil {
		return fmt.Errorf("database not initialized")
	}

	// Run migration
for _, m := range models {
    if err := DB.AutoMigrate(m); err != nil {
        log.Printf("[database] ❌ migration error on %T: %v", m, err)
        return err
    }
    log.Printf("[database] ✅ migrated %T", m)
}

	log.Println("[database] ✅ migrations complete")
	return nil
}

// ✅ CleanupBlacklistedTokens removes expired blacklisted tokens periodically
// Run this as a goroutine: go database.CleanupBlacklistedTokens()
func CleanupBlacklistedTokens() {
	if DB == nil {
		log.Println("[cleanup] ⚠️ database not initialized, skipping token cleanup")
		return
	}

	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	log.Println("[cleanup] 🧹 blacklisted token cleanup service started")

	// Run cleanup immediately on startup
	cleanupNow := func() {
		result := DB.Where("expires_at < ?", time.Now()).Delete(&models.BlacklistedToken{})
		if result.Error != nil {
			log.Printf("[cleanup] ❌ error cleaning blacklisted tokens: %v", result.Error)
		} else if result.RowsAffected > 0 {
			log.Printf("[cleanup] 🧹 cleaned up %d expired blacklisted tokens", result.RowsAffected)
		}
	}

	cleanupNow()

	// Then run every 6 hours
	for range ticker.C {
		cleanupNow()
	}
}