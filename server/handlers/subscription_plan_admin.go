package handlers

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── helpers ───────────────────────────────────────────────────────────────────

// planUsageCounts returns a map of plan slug → active/trial subscriber count.
func planUsageCounts() map[string]int {
	type row struct {
		Plan  string
		Count int
	}
	var rows []row
	database.DB.Raw(`
		SELECT plan_slug AS plan, COUNT(*) AS count
		FROM subscriptions
		WHERE status IN ('active', 'trial')
		  AND deleted_at IS NULL
		GROUP BY plan_slug
	`).Scan(&rows)

	m := make(map[string]int, len(rows))
	for _, r := range rows {
		m[r.Plan] = r.Count
	}
	return m
}

// enrichPlans attaches usage counts and marks the most-subscribed plan as
// is_popular.  An admin can force-set is_popular in the DB; that flag is
// only overridden if there is clear data showing a different plan leads.
// Rule: whichever plan has the most active/trial subscribers wins.
// Tie or no data → preserve the admin's manual is_popular setting.
func enrichPlans(plans []models.SubscriptionPlanConfig) []models.SubscriptionPlanConfig {
	usage := planUsageCounts()

	// Find top-usage slug
	maxCount := 0
	topSlug := ""
	for slug, count := range usage {
		if count > maxCount {
			maxCount = count
			topSlug = slug
		}
	}

	for i := range plans {
		plans[i].UsageCount = usage[plans[i].Slug]
		if maxCount > 0 {
			// Auto-set: the plan with most subscribers is the popular one
			plans[i].IsPopular = (plans[i].Slug == topSlug)
		}
		// If there's no subscription data at all, keep the admin's manual choice
	}
	return plans
}

// parseFeatureLines converts the admin's textarea format into PlanFeature slice.
// Each line should start with + (included) or - (excluded):
//
//	+Browse all verified listings
//	-Early drop access
func parseFeatureLines(raw string) []models.PlanFeature {
	lines := strings.Split(strings.ReplaceAll(raw, "\r\n", "\n"), "\n")
	var out []models.PlanFeature
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "+") {
			out = append(out, models.PlanFeature{Text: strings.TrimSpace(line[1:]), Included: true})
		} else if strings.HasPrefix(line, "-") {
			out = append(out, models.PlanFeature{Text: strings.TrimSpace(line[1:]), Included: false})
		} else {
			// No prefix → treat as included
			out = append(out, models.PlanFeature{Text: line, Included: true})
		}
	}
	return out
}

// featuresToLines converts a PlanFeature slice back to the admin textarea format.
func featuresToLines(features []models.PlanFeature) string {
	var sb strings.Builder
	for _, f := range features {
		if f.Included {
			sb.WriteString("+" + f.Text + "\n")
		} else {
			sb.WriteString("-" + f.Text + "\n")
		}
	}
	return strings.TrimSpace(sb.String())
}

// ── GET /api/subscription-plans  (public) ─────────────────────────────────────
// Returns all active plans sorted by sort_order, with usage counts attached
// and is_popular auto-calculated from live subscriber data.
func GetPublicSubscriptionPlans(c *gin.Context) {
	var plans []models.SubscriptionPlanConfig
	database.DB.
		Where("is_active = ?", true).
		Order("sort_order ASC, id ASC").
		Find(&plans)

	plans = enrichPlans(plans)
	utils.OK(c, "Plans fetched", gin.H{"plans": plans})
}

// ── GET /api/admin/subscription-plans  (admin) ────────────────────────────────
func AdminListSubscriptionPlans(c *gin.Context) {
	var plans []models.SubscriptionPlanConfig
	database.DB.Unscoped().Order("sort_order ASC, id ASC").Find(&plans)
	plans = enrichPlans(plans)
	utils.OK(c, "Plans fetched", gin.H{
		"plans": plans,
		"total": len(plans),
	})
}

// ── POST /api/admin/subscription-plans  (admin) ───────────────────────────────
func AdminCreateSubscriptionPlan(c *gin.Context) {
	var req struct {
		Name         string  `json:"name"          binding:"required"`
		Slug         string  `json:"slug"          binding:"required"`
		Description  string  `json:"description"`
		PlanType     string  `json:"plan_type"`    // "buyer" | "brand"
		MonthlyPrice float64 `json:"monthly_price"`
		AnnualPrice  float64 `json:"annual_price"`
		// Features as +/- prefixed lines from the admin textarea
		FeaturesRaw  string  `json:"features_raw"`
		IconName     string  `json:"icon_name"`
		SortOrder    int     `json:"sort_order"`
		IsActive     *bool   `json:"is_active"`
		Tagline      string  `json:"tagline"`
		Tag          string  `json:"tag"`
		CtaText      string  `json:"cta_text"`
		CtaLink      string  `json:"cta_link"`
		// TrialDays: 0 = no trial, 7 = 1 week free, 30 = 1 month free, 365 = 1 year free
		TrialDays    int     `json:"trial_days"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "name and slug are required", nil)
		return
	}

	planType := "none"
	if req.PlanType == "buyer" || req.PlanType == "brand" {
		planType = req.PlanType
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	iconName := req.IconName
	if iconName == "" {
		iconName = "user"
	}

	// Parse feature lines → JSON
	features := parseFeatureLines(req.FeaturesRaw)
	featuresJSON, _ := models.EncodeFeatures(features)

	plan := models.SubscriptionPlanConfig{
		Name:         strings.TrimSpace(req.Name),
		Slug:         strings.TrimSpace(strings.ToLower(req.Slug)),
		Description:  req.Description,
		PlanType:     planType,
		MonthlyPrice: req.MonthlyPrice,
		AnnualPrice:  req.AnnualPrice,
		Features:     featuresJSON,
		IconName:     iconName,
		SortOrder:    req.SortOrder,
		IsActive:     isActive,
		Tagline:      req.Tagline,
		Tag:          req.Tag,
		CtaText:      req.CtaText,
		CtaLink:      req.CtaLink,
		TrialDays:    req.TrialDays,
	}

	if err := database.DB.Create(&plan).Error; err != nil {
		utils.InternalError(c, "Failed to create plan")
		return
	}

	utils.Created(c, "Plan created", plan)
}

// ── PUT /api/admin/subscription-plans/:id  (admin) ────────────────────────────
func AdminUpdateSubscriptionPlan(c *gin.Context) {
	var plan models.SubscriptionPlanConfig
	if err := database.DB.First(&plan, c.Param("id")).Error; err != nil {
		utils.NotFound(c, "Plan not found")
		return
	}

	var req struct {
		Name         string  `json:"name"`
		Slug         string  `json:"slug"`
		Description  string  `json:"description"`
		PlanType     string  `json:"plan_type"`
		MonthlyPrice float64 `json:"monthly_price"`
		AnnualPrice  float64 `json:"annual_price"`
		FeaturesRaw  string  `json:"features_raw"`
		IconName     string  `json:"icon_name"`
		SortOrder    int     `json:"sort_order"`
		IsActive     *bool   `json:"is_active"`
		Tagline      string  `json:"tagline"`
		Tag          string  `json:"tag"`
		CtaText      string  `json:"cta_text"`
		CtaLink      string  `json:"cta_link"`
		TrialDays    int     `json:"trial_days"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	updates := map[string]interface{}{}

	if req.Name != "" {
		updates["name"] = strings.TrimSpace(req.Name)
	}
	if req.Slug != "" {
		updates["slug"] = strings.ToLower(strings.TrimSpace(req.Slug))
	}
	updates["description"]   = req.Description
	updates["tagline"]        = req.Tagline
	updates["tag"]            = req.Tag
	updates["cta_text"]       = req.CtaText
	updates["cta_link"]       = req.CtaLink
	updates["monthly_price"]  = req.MonthlyPrice
	updates["annual_price"]   = req.AnnualPrice
	updates["sort_order"]     = req.SortOrder
	updates["trial_days"]     = req.TrialDays

	if req.PlanType == "none" || req.PlanType == "buyer" || req.PlanType == "brand" {
		updates["plan_type"] = req.PlanType
	}
	if req.IconName != "" {
		updates["icon_name"] = req.IconName
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}
	if req.FeaturesRaw != "" {
		features := parseFeatureLines(req.FeaturesRaw)
		featuresJSON, _ := models.EncodeFeatures(features)
		updates["features"] = featuresJSON
	}

	database.DB.Model(&plan).Updates(updates)
	database.DB.First(&plan, plan.ID)

	// Attach features_raw for the admin UI to repopulate the textarea
	parsedFeatures := plan.ParseFeatures()
	utils.OK(c, "Plan updated", gin.H{
		"plan":         plan,
		"features_raw": featuresToLines(parsedFeatures),
	})
}

// ── DELETE /api/admin/subscription-plans/:id  (admin) ─────────────────────────
func AdminDeleteSubscriptionPlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid plan ID", nil)
		return
	}

	var plan models.SubscriptionPlanConfig
	if err := database.DB.Unscoped().First(&plan, id).Error; err != nil {
		utils.NotFound(c, "Plan not found")
		return
	}

	data, _ := json.Marshal(plan)
	adminID := int(c.GetUint("admin_id"))
	ip := c.ClientIP()
	database.DB.Create(&models.AuditLog{
		Table:      "subscription_plans",
		RecordID:   int(plan.ID),
		RecordData: string(data),
		DeletedBy:  &adminID,
		CanRestore: true,
		IPAddress:  &ip,
	})

	if err := database.DB.Unscoped().Delete(&plan).Error; err != nil {
		utils.InternalError(c, "Failed to delete plan")
		return
	}

	utils.OK(c, "Plan deleted", nil)
}

// ── GET /api/admin/subscription-plans/:id  (admin) — returns features_raw ─────
func AdminGetSubscriptionPlan(c *gin.Context) {
	var plan models.SubscriptionPlanConfig
	if err := database.DB.First(&plan, c.Param("id")).Error; err != nil {
		utils.NotFound(c, "Plan not found")
		return
	}

	parsedFeatures := plan.ParseFeatures()
	usage := planUsageCounts()
	plan.UsageCount = usage[plan.Slug]

	// Also decode the raw features JSON to a typed slice so the frontend
	// can decide how to display them.
	var featuresSlice []map[string]interface{}
	_ = json.Unmarshal([]byte(plan.Features), &featuresSlice)

	utils.OK(c, "Plan fetched", gin.H{
		"plan":         plan,
		"features_raw": featuresToLines(parsedFeatures),
	})
}