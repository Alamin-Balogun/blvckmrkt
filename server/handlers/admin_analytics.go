package handlers

import (
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/analytics/overview ────────────────────────────────────────
// Full platform snapshot: totals + today + breakdowns
func AdminAnalyticsOverview(c *gin.Context) {
	today := time.Now().Format("2006-01-02")

	var (
		totalUsers, totalBrands, totalOrders         int64
		newUsersToday, ordersToday                   int64
		activeDrops, pendingBrands, newReviews        int64
		buyersCount, employeesCount, partnersCount    int64
		deliveredOrders, processingOrders             int64
		pendingOrders, cancelledOrders                int64
		totalRevenue                                  float64
	)

	// Totals
	database.DB.Model(&models.User{}).Where("account_type NOT IN ('admin','banned')").Count(&totalUsers)
	database.DB.Model(&models.User{}).Where("account_type = 'brand'").Count(&totalBrands)
	database.DB.Model(&models.Order{}).Count(&totalOrders)
	database.DB.Model(&models.Order{}).
		Where("status NOT IN ('cancelled','refunded')").
		Select("COALESCE(SUM(total), 0)").Scan(&totalRevenue)

	// Today
	database.DB.Model(&models.User{}).Where("DATE(created_at) = ?", today).Count(&newUsersToday)
	database.DB.Model(&models.Order{}).Where("DATE(created_at) = ?", today).Count(&ordersToday)

	// Drops + reviews
	database.DB.Model(&models.Drop{}).Where("status = ?", models.DropLive).Count(&activeDrops)
	database.DB.Model(&models.Brand{}).Where("verification_status = ?", models.VerificationPending).Count(&pendingBrands)
	database.DB.Model(&models.Review{}).Where("created_at >= ?", time.Now().AddDate(0, 0, -7)).Count(&newReviews)

	// User breakdowns
	database.DB.Model(&models.User{}).Where("account_type = 'user'").Count(&buyersCount)
	database.DB.Model(&models.Employee{}).Where("status = 'active'").Count(&employeesCount)
	database.DB.Model(&models.Partner{}).Where("stage = 'active'").Count(&partnersCount)

	// Order status breakdowns
	database.DB.Model(&models.Order{}).Where("status = ?", models.OrderDelivered).Count(&deliveredOrders)
	database.DB.Model(&models.Order{}).Where("status = ?", models.OrderProcessing).Count(&processingOrders)
	database.DB.Model(&models.Order{}).Where("status = ?", models.OrderPending).Count(&pendingOrders)
	database.DB.Model(&models.Order{}).Where("status = ?", models.OrderCancelled).Count(&cancelledOrders)

	utils.OK(c, "Analytics overview fetched", gin.H{
		// Core totals (same as /stats so overview still works)
		"total_users":      totalUsers,
		"total_brands":     totalBrands,
		"total_orders":     totalOrders,
		"total_revenue":    totalRevenue,
		"active_drops":     activeDrops,
		"pending_reviews":  newReviews,
		"pending_brands":   pendingBrands,
		"new_users_today":  newUsersToday,
		"orders_today":     ordersToday,
		// Extra breakdowns for charts
		"buyers_count":      buyersCount,
		"employees_count":   employeesCount,
		"partners_count":    partnersCount,
		"delivered_orders":  deliveredOrders,
		"processing_orders": processingOrders,
		"pending_orders":    pendingOrders,
		"cancelled_orders":  cancelledOrders,
	})
}

// ── GET /api/admin/analytics/weekly?offset=0 ─────────────────────────────────
// Returns daily orders, revenue, and new users for a given ISO week.
// offset=0 → current week, offset=-1 → last week, etc.
func AdminAnalyticsWeekly(c *gin.Context) {
	// Parse week offset (default 0 = current week)
	var weekOffset int
	if v := c.Query("offset"); v != "" {
		for i, ch := range v {
			if i == 0 && ch == '-' {
				continue
			}
			if ch >= '0' && ch <= '9' {
				weekOffset = weekOffset*10 + int(ch-'0')
			}
		}
		if len(v) > 0 && v[0] == '-' {
			weekOffset = -weekOffset
		}
	}

	// Calculate Monday of the requested week
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // treat Sunday as 7
	}
	monday := now.AddDate(0, 0, -(weekday-1)+(weekOffset*7))
	monday = time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, time.UTC)

	type DayRow struct {
		Day          string  `json:"day"`   // "Mon", "Tue", ...
		Date         string  `json:"date"`  // "2025-01-06"
		Orders       int64   `json:"orders"`
		Revenue      float64 `json:"revenue"`
		NewUsers     int64   `json:"users"`
	}

	dayNames := []string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}
	rows := make([]DayRow, 7)

	for i := 0; i < 7; i++ {
		day := monday.AddDate(0, 0, i)
		dateStr := day.Format("2006-01-02")

		var orders int64
		var revenue float64
		var users int64

		database.DB.Model(&models.Order{}).
			Where("DATE(created_at) = ?", dateStr).
			Count(&orders)
		database.DB.Model(&models.Order{}).
			Where("DATE(created_at) = ? AND status NOT IN ('cancelled','refunded')", dateStr).
			Select("COALESCE(SUM(total), 0)").Scan(&revenue)
		database.DB.Model(&models.User{}).
			Where("DATE(created_at) = ?", dateStr).
			Count(&users)

		rows[i] = DayRow{
			Day:      dayNames[i],
			Date:     dateStr,
			Orders:   orders,
			Revenue:  revenue,
			NewUsers: users,
		}
	}

	// Week label for display
	sunday := monday.AddDate(0, 0, 6)
	label := monday.Format("2 Jan") + " – " + sunday.Format("2 Jan 2006")
	if weekOffset == 0 {
		label = "This Week"
	} else if weekOffset == -1 {
		label = "Last Week"
	}

	utils.OK(c, "Weekly analytics fetched", gin.H{
		"week_offset": weekOffset,
		"week_label":  label,
		"week_start":  monday.Format("2006-01-02"),
		"week_end":    sunday.Format("2006-01-02"),
		"days":        rows,
	})
}

// ── GET /api/admin/analytics/revenue?period=30 ───────────────────────────────
// Daily revenue for the last N days (default 30)
func AdminAnalyticsRevenue(c *gin.Context) {
	// Clean parse
	days := 30
	if v := c.Query("period"); v != "" {
		n := 0
		for _, ch := range v {
			if ch >= '0' && ch <= '9' {
				n = n*10 + int(ch-'0')
			}
		}
		if n > 0 && n <= 365 {
			days = n
		}
	}

	type RevenueRow struct {
		Date    string  `json:"date"`
		Revenue float64 `json:"revenue"`
		Orders  int64   `json:"orders"`
	}

	var result []RevenueRow
	for i := days - 1; i >= 0; i-- {
		d := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		var revenue float64
		var orders int64
		database.DB.Model(&models.Order{}).
			Where("DATE(created_at) = ? AND status NOT IN ('cancelled','refunded')", d).
			Select("COALESCE(SUM(total), 0)").Scan(&revenue)
		database.DB.Model(&models.Order{}).
			Where("DATE(created_at) = ?", d).Count(&orders)
		result = append(result, RevenueRow{Date: d, Revenue: revenue, Orders: orders})
	}

	utils.OK(c, "Revenue analytics fetched", gin.H{"days": result, "period": days})
}

// ── GET /api/admin/analytics/users?period=30 ─────────────────────────────────
// Daily new user signups for the last N days
func AdminAnalyticsUsers(c *gin.Context) {
	days := 30
	if v := c.Query("period"); v != "" {
		n := 0
		for _, ch := range v {
			if ch >= '0' && ch <= '9' {
				n = n*10 + int(ch-'0')
			}
		}
		if n > 0 && n <= 365 {
			days = n
		}
	}

	type UserRow struct {
		Date     string `json:"date"`
		Buyers   int64  `json:"buyers"`
		Brands   int64  `json:"brands"`
		Total    int64  `json:"total"`
	}

	var result []UserRow
	for i := days - 1; i >= 0; i-- {
		d := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		var buyers, brands int64
		database.DB.Model(&models.User{}).Where("DATE(created_at) = ? AND account_type = 'user'", d).Count(&buyers)
		database.DB.Model(&models.User{}).Where("DATE(created_at) = ? AND account_type = 'brand'", d).Count(&brands)
		result = append(result, UserRow{
			Date:   d,
			Buyers: buyers,
			Brands: brands,
			Total:  buyers + brands,
		})
	}

	utils.OK(c, "User analytics fetched", gin.H{"days": result, "period": days})
}