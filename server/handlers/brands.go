package handlers

import (
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// PublicBrandRow — flattened brand + user location + live product count
type PublicBrandRow struct {
	ID                 uint   `json:"id"`
	DisplayID          string `json:"display_id"`
	BrandName          string `json:"brand_name"`
	Slug               string `json:"slug"`
	Description        string `json:"description"`
	LogoURL            string `json:"logo_url"`
	BannerURL          string `json:"banner_url"`
	Website            string `json:"website"`
	Category           string `json:"category"`
	VerificationStatus string `json:"verification_status"`
	SubscriptionPlan   string `json:"subscription_plan"`
	SubscriptionStatus string `json:"subscription_status"`

	// Location — joined from users table
	City        string `json:"city"`
	StateName   string `json:"state_name"`
	CountryName string `json:"country_name"`

	// Live active product count
	ProductCount int `json:"product_count"`

	// Discovery — admin-controlled placement (see models/brand.go)
	IsExclusive  bool `json:"is_exclusive"`
	FeaturedRank *int `json:"featured_rank,omitempty"`
}

// GET /api/brands
// Public — no auth required.
// Returns all non-deleted brands with location (from users table) and
// a live product count. Manually pinned brands (featured_rank) sort first,
// then brands with an active subscription, then alphabetically.
func GetPublicBrands(c *gin.Context) {
	var brands []PublicBrandRow

	database.DB.Raw(`
		SELECT
			b.id,
			b.display_id,
			b.brand_name,
			b.slug,
			COALESCE(b.description, '')        AS description,
			COALESCE(b.logo_url, '')            AS logo_url,
			COALESCE(b.banner_url, '')          AS banner_url,
			COALESCE(b.website, '')             AS website,
			COALESCE(b.category, '')            AS category,
			b.verification_status,
			COALESCE(b.subscription_plan, '')   AS subscription_plan,
			COALESCE(b.subscription_status, '') AS subscription_status,
			COALESCE(u.city, '')         AS city,
			COALESCE(u.state_name, '')   AS state_name,
			COALESCE(u.country_name, '') AS country_name,
			COUNT(DISTINCT p.id)         AS product_count,
			b.is_exclusive               AS is_exclusive,
			b.featured_rank              AS featured_rank
		FROM brands b
		LEFT JOIN users u    ON u.id = b.user_id
		LEFT JOIN products p ON p.brand_id = b.id
			AND p.status     = 'active'
			AND p.deleted_at IS NULL
		WHERE b.deleted_at IS NULL
          AND b.verification_status IN ('verified', 'pending')
          AND b.subscription_status  IN ('active', 'trial')
		GROUP BY
			b.id, b.display_id, b.brand_name, b.slug, b.description,
			b.logo_url, b.banner_url, b.website, b.category,
			b.verification_status, b.subscription_plan, b.subscription_status,
			u.city, u.state_name, u.country_name, b.is_exclusive, b.featured_rank
		ORDER BY
			CASE WHEN b.featured_rank IS NULL THEN 1 ELSE 0 END ASC,
			b.featured_rank ASC,
			CASE
				WHEN b.subscription_status = 'active'
				 AND b.subscription_plan  != 'none'
				 AND b.subscription_plan  != ''
				THEN 0 ELSE 1
			END ASC,
			b.brand_name ASC
	`).Scan(&brands)

	if brands == nil {
		brands = []PublicBrandRow{}
	}

	utils.OK(c, "Brands fetched", gin.H{"brands": brands})
}

// PublicBrandProfile — everything a shareable brand profile page needs.
type PublicBrandProfile struct {
	PublicBrandRow
	Instagram string `json:"instagram"`
	Facebook  string `json:"facebook"`
	Twitter   string `json:"twitter"`
	TikTok    string `json:"tiktok"`
	Phone     string `json:"phone"`
}

// GET /api/brands/:slug
// Public — no auth required. Products for the profile are fetched
// separately via the existing GET /api/shop/products?brand_id=... .
func GetPublicBrandBySlug(c *gin.Context) {
	slug := c.Param("slug")

	var brand PublicBrandProfile
	err := database.DB.Raw(`
		SELECT
			b.id, b.display_id, b.brand_name, b.slug,
			COALESCE(b.description, '')        AS description,
			COALESCE(b.logo_url, '')            AS logo_url,
			COALESCE(b.banner_url, '')          AS banner_url,
			COALESCE(b.website, '')             AS website,
			COALESCE(b.category, '')            AS category,
			b.verification_status,
			COALESCE(b.subscription_plan, '')   AS subscription_plan,
			COALESCE(b.subscription_status, '') AS subscription_status,
			COALESCE(u.city, '')         AS city,
			COALESCE(u.state_name, '')   AS state_name,
			COALESCE(u.country_name, '') AS country_name,
			COUNT(DISTINCT p.id)         AS product_count,
			COALESCE(b.instagram, '') AS instagram,
			COALESCE(b.facebook, '')  AS facebook,
			COALESCE(b.twitter, '')   AS twitter,
			COALESCE(b.tik_tok, '')   AS tiktok,
			COALESCE(b.phone, '')     AS phone
		FROM brands b
		LEFT JOIN users u    ON u.id = b.user_id
		LEFT JOIN products p ON p.brand_id = b.id
			AND p.status     = 'active'
			AND p.deleted_at IS NULL
		WHERE b.deleted_at IS NULL AND b.slug = ?
		GROUP BY
			b.id, b.display_id, b.brand_name, b.slug, b.description,
			b.logo_url, b.banner_url, b.website, b.category,
			b.verification_status, b.subscription_plan, b.subscription_status,
			u.city, u.state_name, u.country_name,
			b.instagram, b.facebook, b.twitter, b.tik_tok, b.phone
	`, slug).Scan(&brand).Error

	if err != nil || brand.ID == 0 {
		utils.NotFound(c, "Brand not found")
		return
	}

	utils.OK(c, "Brand fetched", brand)
}