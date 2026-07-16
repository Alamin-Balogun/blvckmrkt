package handlers

import (
	"log"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
)

// StartDropExpiryJob starts a background goroutine that runs every hour and
// marks drop_products as "ended" when their ends_at timestamp has passed.
//
// Call this once from main.go after the DB is connected:
//
//	go handlers.StartDropExpiryJob()
func StartDropExpiryJob() {
	log.Println("[drop-expiry] job started — checking every hour")

	// Run immediately on startup, then on the ticker
	expireDropProducts()

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		expireDropProducts()
	}
}

// expireDropProducts finds all drop_products where ends_at has passed and the
// status is not already "ended", then sets status = "ended".
func expireDropProducts() {
	now := time.Now()
	ended := models.DropEnded

	result := database.DB.Model(&models.DropProduct{}).
		Where("ends_at IS NOT NULL AND ends_at <= ? AND status != ?", now, models.DropEnded).
		Updates(map[string]interface{}{
			"status":  &ended,
			"ends_at": now, // record the exact time it was marked ended
		})

	if result.Error != nil {
		log.Printf("[drop-expiry] error expiring products: %v", result.Error)
		return
	}

	if result.RowsAffected > 0 {
		log.Printf("[drop-expiry] expired %d drop product(s) at %s",
			result.RowsAffected, now.Format(time.RFC3339))
	}
}