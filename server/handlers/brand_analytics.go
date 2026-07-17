package handlers

import (
	"fmt"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/brand/overview ───────────────────────────────────────────────────
// Returns comprehensive stats + order breakdown + recent orders + top products
// for the Brand Studio overview page.
func BrandOverview(c *gin.Context) {
	userID := c.GetUint("userID")

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	lastMonth := startOfMonth.AddDate(0, -1, 0)

	// ──────────────────────────────────────────────────────────────────────────
	// 1. STATS CALCULATION
	// ──────────────────────────────────────────────────────────────────────────

	// Total revenue (all time, excluding cancelled/refunded)
	var totalRevenue float64
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.total_price), 0)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ? AND o.status NOT IN ('cancelled','refunded')
	`, brand.ID).Scan(&totalRevenue)

	// Total orders (all time, distinct orders)
	var totalOrders int64
	database.DB.Raw(`
		SELECT COUNT(DISTINCT oi.order_id)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ?
	`, brand.ID).Scan(&totalOrders)

	// Pending orders
	var pendingOrders int64
	database.DB.Raw(`
		SELECT COUNT(DISTINCT oi.order_id)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ? AND o.status = 'pending'
	`, brand.ID).Scan(&pendingOrders)

	// Revenue this month
	var thisMonthRevenue float64
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.total_price), 0)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ?
		  AND o.status NOT IN ('cancelled','refunded')
		  AND o.created_at >= ?
	`, brand.ID, startOfMonth).Scan(&thisMonthRevenue)

	// Revenue last month
	var lastMonthRevenue float64
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.total_price), 0)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ?
		  AND o.status NOT IN ('cancelled','refunded')
		  AND o.created_at >= ? AND o.created_at < ?
	`, brand.ID, lastMonth, startOfMonth).Scan(&lastMonthRevenue)

	// Revenue trend %
	revenueTrend := 0.0
	if lastMonthRevenue > 0 {
		revenueTrend = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
	} else if thisMonthRevenue > 0 {
		revenueTrend = 100 // 100% increase from zero
	}

	// Orders this month
	var thisMonthOrders int64
	database.DB.Raw(`
		SELECT COUNT(DISTINCT o.id)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ? AND o.created_at >= ?
	`, brand.ID, startOfMonth).Scan(&thisMonthOrders)

	// Orders last month
	var lastMonthOrders int64
	database.DB.Raw(`
		SELECT COUNT(DISTINCT o.id)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ? AND o.created_at >= ? AND o.created_at < ?
	`, brand.ID, lastMonth, startOfMonth).Scan(&lastMonthOrders)

	// Orders trend %
	orderTrend := 0.0
	if lastMonthOrders > 0 {
		orderTrend = (float64(thisMonthOrders-lastMonthOrders) / float64(lastMonthOrders)) * 100
	} else if thisMonthOrders > 0 {
		orderTrend = 100
	}

	// Active products count
	var activeProducts int64
	database.DB.Model(&models.Product{}).
		Where("brand_id = ? AND status = 'active'", brand.ID).
		Count(&activeProducts)

	// Total products count
	var productCount int64
	database.DB.Model(&models.Product{}).
		Where("brand_id = ?", brand.ID).
		Count(&productCount)

	// Conversion rate (basic heuristic)
	conversionRate := 0.0
	if totalOrders > 0 && productCount > 0 {
		estimatedViews := float64(productCount) * 100
		conversionRate = (float64(totalOrders) / estimatedViews) * 100
		if conversionRate > 100 {
			conversionRate = 100
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// 2. ORDER BREAKDOWN BY STATUS
	// ──────────────────────────────────────────────────────────────────────────
	type StatusCount struct {
		Status string
		Count  int
	}
	var statusCounts []StatusCount
	database.DB.Raw(`
		SELECT o.status, COUNT(DISTINCT oi.order_id) as count
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ?
		GROUP BY o.status
	`, brand.ID).Scan(&statusCounts)

	breakdown := map[string]int{
		"processing": 0,
		"shipped":    0,
		"delivered":  0,
		"pending":    0,
		"cancelled":  0,
		"refunded":   0,
	}
	for _, sc := range statusCounts {
		if _, ok := breakdown[sc.Status]; ok {
			breakdown[sc.Status] = sc.Count
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// 3. RECENT ORDERS (Last 10)
	// ──────────────────────────────────────────────────────────────────────────
	var orderIDs []uint
	database.DB.Model(&models.OrderItem{}).
		Select("DISTINCT order_id").
		Where("brand_id = ?", brand.ID).
		Pluck("order_id", &orderIDs)

	var recentOrders []models.Order
	if len(orderIDs) > 0 {
		database.DB.
			Where("id IN ?", orderIDs).
			Order("created_at DESC").
			Limit(10).
			Find(&recentOrders)
	}

	// Load buyer names
	buyerIDs := make([]uint, 0, len(recentOrders))
	for _, o := range recentOrders {
		if o.UserID != nil {
			buyerIDs = append(buyerIDs, *o.UserID)
		}
	}
	var buyerUsers []models.User
	if len(buyerIDs) > 0 {
		database.DB.Select("id, first_name, last_name, email").
			Where("id IN ?", buyerIDs).Find(&buyerUsers)
	}
	buyerNameMap := map[uint]string{}
	for _, u := range buyerUsers {
		buyerNameMap[u.ID] = u.FirstName + " " + u.LastName
	}

	// Load brand items per recent order
	var recentItems []models.OrderItem
	if len(orderIDs) > 0 {
		recentOrderIDs := make([]uint, 0, len(recentOrders))
		for _, o := range recentOrders {
			recentOrderIDs = append(recentOrderIDs, o.ID)
		}
		database.DB.
			Where("order_id IN ? AND brand_id = ?", recentOrderIDs, brand.ID).
			Find(&recentItems)
	}
	recentItemMap := map[uint][]models.OrderItem{}
	for _, it := range recentItems {
		recentItemMap[it.OrderID] = append(recentItemMap[it.OrderID], it)
	}

	type RecentOrderRow struct {
		OrderID    uint    `json:"order_id"`
		DisplayID  string  `json:"display_id"`
		Status     string  `json:"status"`
		BuyerName  string  `json:"buyer_name"`
		ItemName   string  `json:"item_name"`
		BrandTotal float64 `json:"brand_total"`
		CreatedAt  string  `json:"created_at"`
	}

	recentOrderRows := make([]RecentOrderRow, 0, len(recentOrders))
	for _, o := range recentOrders {
		items := recentItemMap[o.ID]
		var brandTotal float64
		itemName := ""
		for i, it := range items {
			brandTotal += it.TotalPrice
			if i == 0 {
				itemName = it.ProductName
			}
		}
		if len(items) > 1 {
			itemName += fmt.Sprintf(" +%d more", len(items)-1)
		}
		buyerName := "Guest"
		if o.UserID != nil {
			if name, ok := buyerNameMap[*o.UserID]; ok {
				buyerName = name
			}
		}
		recentOrderRows = append(recentOrderRows, RecentOrderRow{
			OrderID:    o.ID,
			DisplayID:  o.DisplayID,
			Status:     string(o.Status),
			BuyerName:  buyerName,
			ItemName:   itemName,
			BrandTotal: brandTotal,
			CreatedAt:  o.CreatedAt.Format(time.RFC3339),
		})
	}

	// ──────────────────────────────────────────────────────────────────────────
	// 4. TOP PRODUCTS (By Sales Count, Top 10)
	// ──────────────────────────────────────────────────────────────────────────
	type TopProduct struct {
		ProductID    uint    `json:"product_id"`
		Name         string  `json:"name"`
		Price        float64 `json:"price"`
		Status       string  `json:"status"`
		PrimaryImage string  `json:"primary_image"`
		TotalSales   int     `json:"total_sales"`
	}
	var topProducts []TopProduct
	database.DB.Raw(`
		SELECT p.id as product_id, p.name, p.price, p.status,
		       COALESCE((SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1), '') as primary_image,
		       COALESCE(SUM(oi.quantity), 0) as total_sales
		FROM products p
		LEFT JOIN order_items oi ON oi.product_id = p.id
		WHERE p.brand_id = ? AND p.deleted_at IS NULL
		GROUP BY p.id
		ORDER BY total_sales DESC, p.created_at DESC
		LIMIT 10
	`, brand.ID).Scan(&topProducts)

	// Load sizes for each top product
	type TopProductWithSizes struct {
		TopProduct
		Sizes []models.ProductSize `json:"sizes,omitempty"`
	}
	topProductsWithSizes := make([]TopProductWithSizes, len(topProducts))
	for i, tp := range topProducts {
		var sizes []models.ProductSize
		database.DB.Where("product_id = ?", tp.ProductID).Find(&sizes)
		topProductsWithSizes[i] = TopProductWithSizes{
			TopProduct: tp,
			Sizes:      sizes,
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// RESPONSE
	// ──────────────────────────────────────────────────────────────────────────
	utils.OK(c, "Overview fetched", gin.H{
		"stats": gin.H{
			"total_revenue":     totalRevenue,
			"pending_orders":    pendingOrders,
			"conversion_rate":   conversionRate,
			"total_orders":      totalOrders,
			"revenue_this_month": thisMonthRevenue,
			"revenue_trend":      revenueTrend,
			"orders_this_month":  thisMonthOrders,
			"orders_trend":       orderTrend,
			"active_products":    activeProducts,
			"product_count":      productCount,
		},
		"order_breakdown": breakdown,
		"recent_orders":   recentOrderRows,
		"top_products":    topProductsWithSizes,
	})
}

// ── GET /api/brand/analytics ──────────────────────────────────────────────────
// Returns detailed analytics: monthly revenue + sales for last 12 months,
// top products by revenue, and summary stats.
func BrandAnalytics(c *gin.Context) {
	userID := c.GetUint("userID")

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	now := time.Now()

	// ── Monthly revenue + units for last 12 months ────────────────────────────
	type MonthlyRow struct {
		Month   string  `json:"month"`  // "Jan", "Feb", ...
		Revenue float64 `json:"revenue"`
		Units   int     `json:"units"`
	}
	monthly := make([]MonthlyRow, 12)
	for i := 11; i >= 0; i-- {
		t := now.AddDate(0, -i, 0)
		monthStart := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, now.Location())
		monthEnd := monthStart.AddDate(0, 1, 0)

		var row struct {
			Revenue float64
			Units   int
		}
		database.DB.Raw(`
			SELECT COALESCE(SUM(oi.total_price), 0) as revenue,
			       COALESCE(SUM(oi.quantity), 0) as units
			FROM order_items oi
			JOIN orders o ON o.id = oi.order_id
			WHERE oi.brand_id = ?
			  AND o.status NOT IN ('cancelled','refunded')
			  AND o.created_at >= ? AND o.created_at < ?
		`, brand.ID, monthStart, monthEnd).Scan(&row)

		monthly[11-i] = MonthlyRow{
			Month:   t.Format("Jan"),
			Revenue: row.Revenue,
			Units:   row.Units,
		}
	}

	// ── All-time totals ───────────────────────────────────────────────────────
	var totals struct {
		TotalRevenue float64
		TotalUnits   int
		TotalOrders  int
	}
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.total_price), 0) as total_revenue,
		       COALESCE(SUM(oi.quantity), 0) as total_units,
		       COUNT(DISTINCT oi.order_id) as total_orders
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ? AND o.status NOT IN ('cancelled','refunded')
	`, brand.ID).Scan(&totals)

	// ── This month vs last month ──────────────────────────────────────────────
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	lastMonth := startOfMonth.AddDate(0, -1, 0)

	var thisMonth struct {
		Revenue float64
		Units   int
	}
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.total_price), 0) as revenue,
		       COALESCE(SUM(oi.quantity), 0) as units
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ?
		  AND o.status NOT IN ('cancelled','refunded')
		  AND o.created_at >= ?
	`, brand.ID, startOfMonth).Scan(&thisMonth)

	var lastMonthData struct {
		Revenue float64
		Units   int
	}
	database.DB.Raw(`
		SELECT COALESCE(SUM(oi.total_price), 0) as revenue,
		       COALESCE(SUM(oi.quantity), 0) as units
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		WHERE oi.brand_id = ?
		  AND o.status NOT IN ('cancelled','refunded')
		  AND o.created_at >= ? AND o.created_at < ?
	`, brand.ID, lastMonth, startOfMonth).Scan(&lastMonthData)

	revenueTrend := 0.0
	if lastMonthData.Revenue > 0 {
		revenueTrend = ((thisMonth.Revenue - lastMonthData.Revenue) / lastMonthData.Revenue) * 100
	}
	unitsTrend := 0.0
	if lastMonthData.Units > 0 {
		unitsTrend = (float64(thisMonth.Units-lastMonthData.Units) / float64(lastMonthData.Units)) * 100
	}

	// ── Top 5 products by revenue ─────────────────────────────────────────────
	type TopProductAnalytics struct {
		ProductID    uint    `json:"product_id"`
		Name         string  `json:"name"`
		Price        float64 `json:"price"`
		PrimaryImage string  `json:"primary_image"`
		TotalRevenue float64 `json:"total_revenue"`
		TotalUnits   int     `json:"total_units"`
	}
	var topByRevenue []TopProductAnalytics
	database.DB.Raw(`
		SELECT p.id as product_id, p.name, p.price,
		       COALESCE((SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1), '') as primary_image,
		       COALESCE(SUM(oi.total_price), 0) as total_revenue,
		       COALESCE(SUM(oi.quantity), 0) as total_units
		FROM products p
		LEFT JOIN order_items oi ON oi.product_id = p.id
		LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled','refunded')
		WHERE p.brand_id = ? AND p.deleted_at IS NULL
		GROUP BY p.id
		ORDER BY total_revenue DESC
		LIMIT 5
	`, brand.ID).Scan(&topByRevenue)

	utils.OK(c, "Analytics fetched", gin.H{
		"monthly": monthly,
		"summary": gin.H{
			"total_revenue":      totals.TotalRevenue,
			"total_units_sold":   totals.TotalUnits,
			"total_orders":       totals.TotalOrders,
			"revenue_this_month": thisMonth.Revenue,
			"units_this_month":   thisMonth.Units,
			"revenue_trend":      revenueTrend,
			"units_trend":        unitsTrend,
		},
		"top_products": topByRevenue,
	})
}