// handlers/site_visits.go
//
// Lightweight site-visit analytics. The frontend fires one tracking call per
// route change (see the client-side router hook); this just records path +
// referrer + a session ID, aggregated for the admin dashboard.
package handlers

import (
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── POST /api/track/visit ─────────────────────────────────────────────────────
// Public, unauthenticated, fire-and-forget.
func TrackVisit(c *gin.Context) {
	var req struct {
		Path      string `json:"path" binding:"required"`
		Referrer  string `json:"referrer"`
		SessionID string `json:"session_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		// Analytics beacon — never worth surfacing an error to the caller.
		c.Status(204)
		return
	}

	// Trim to column limits rather than rejecting — this is best-effort logging.
	path := req.Path
	if len(path) > 255 {
		path = path[:255]
	}
	referrer := req.Referrer
	if len(referrer) > 255 {
		referrer = referrer[:255]
	}
	sessionID := req.SessionID
	if len(sessionID) > 64 {
		sessionID = sessionID[:64]
	}

	database.DB.Create(&models.SiteVisit{
		Path:      path,
		Referrer:  referrer,
		SessionID: sessionID,
	})

	c.Status(204)
}

// ── GET /api/admin/analytics/visits?days=30 ───────────────────────────────────
func AdminVisitAnalytics(c *gin.Context) {
	days := 30
	if v := c.Query("days"); v != "" {
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
	since := time.Now().AddDate(0, 0, -days)

	var totalVisits int64
	database.DB.Model(&models.SiteVisit{}).Where("created_at >= ?", since).Count(&totalVisits)

	var uniqueVisitors int64
	database.DB.Model(&models.SiteVisit{}).
		Where("created_at >= ?", since).
		Distinct("session_id").
		Count(&uniqueVisitors)

	type DailyRow struct {
		Day      string `json:"day"`
		Visits   int64  `json:"visits"`
		Visitors int64  `json:"visitors"`
	}
	var daily []DailyRow
	database.DB.Model(&models.SiteVisit{}).
		Select("DATE(created_at) as day, COUNT(*) as visits, COUNT(DISTINCT session_id) as visitors").
		Where("created_at >= ?", since).
		Group("DATE(created_at)").
		Order("day ASC").
		Scan(&daily)

	type PathRow struct {
		Path   string `json:"path"`
		Visits int64  `json:"visits"`
	}
	var topPaths []PathRow
	database.DB.Model(&models.SiteVisit{}).
		Select("path, COUNT(*) as visits").
		Where("created_at >= ?", since).
		Group("path").
		Order("visits DESC").
		Limit(10).
		Scan(&topPaths)

	type ReferrerRow struct {
		Referrer string `json:"referrer"`
		Visits   int64  `json:"visits"`
	}
	var topReferrers []ReferrerRow
	database.DB.Model(&models.SiteVisit{}).
		Select("referrer, COUNT(*) as visits").
		Where("created_at >= ? AND referrer != ''", since).
		Group("referrer").
		Order("visits DESC").
		Limit(10).
		Scan(&topReferrers)

	utils.OK(c, "Visit analytics fetched", gin.H{
		"total_visits":    totalVisits,
		"unique_visitors": uniqueVisitors,
		"daily":           daily,
		"top_paths":       topPaths,
		"top_referrers":   topReferrers,
		"days":            days,
	})
}
