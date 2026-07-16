package handlers

import (
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
func AdminStats(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	var totalUsers, totalBrands, totalOrders, newUsersToday, ordersToday int64
	var totalRevenue float64

	database.DB.Model(&models.User{}).Where("account_type != 'admin'").Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("account_type = 'brand'").Count(&totalBrands)
	database.DB.Model(&models.Order{}).Count(&totalOrders)
	database.DB.Model(&models.Order{}).
		Where("status != ? AND status != ?", models.OrderCancelled, models.OrderRefunded).
		Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)
	database.DB.Model(&models.User{}).
		Where("DATE(created_at) = ?", today).Count(&newUsersToday)
	database.DB.Model(&models.Order{}).
		Where("DATE(created_at) = ?", today).Count(&ordersToday)

	// Active drops
	var activeDrops int64
	database.DB.Model(&models.Drop{}).Where("status = ?", models.DropLive).Count(&activeDrops)

	// Pending brand verifications
	var pendingBrands int64
	database.DB.Model(&models.Brand{}).
		Where("verification_status = ?", models.VerificationPending).Count(&pendingBrands)

	// Unread reviews (no flagged field on Review model — count last 7 days as "new")
	var newReviews int64
	database.DB.Model(&models.Review{}).
		Where("created_at >= ?", time.Now().AddDate(0, 0, -7)).Count(&newReviews)

	utils.OK(c, "Stats fetched", gin.H{
		"total_users":      totalUsers,
		"total_brands":     totalBrands,
		"total_orders":     totalOrders,
		"total_revenue":    totalRevenue,
		"active_drops":     activeDrops,
		"pending_brands":   pendingBrands,
		"new_reviews":      newReviews,
		"new_users_today":  newUsersToday,
		"orders_today":     ordersToday,
	})
}