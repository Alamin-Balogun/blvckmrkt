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
          AND b.verification_status = 'verified'
		GROUP BY
			b.id, b.display_id, b.brand_name, b.slug, b.description,
			b.logo_url, b.banner_url, b.website, b.category,
			b.verification_status, b.subscription_plan, b.subscription_status,
			u.city, u.state_name, u.country_name, b.is_exclusive, b.featured_rank
		ORDER BY
			CASE WHEN b.featured_rank IS NULL THEN 1 ELSE 0 END ASC,
			b.featured_rank ASC,
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

	// Optional animated garment showcase — empty strings when the brand
	// hasn't opted in, so the frontend falls back to the plain static banner.
	Garment1FrontImageURL string `json:"garment_1_front_image_url"`
	Garment1BackImageURL  string `json:"garment_1_back_image_url"`
	Garment1LeftImageURL  string `json:"garment_1_left_image_url"`
	Garment1RightImageURL string `json:"garment_1_right_image_url"`
	Garment2FrontImageURL string `json:"garment_2_front_image_url"`
	Garment2BackImageURL  string `json:"garment_2_back_image_url"`
	Garment2LeftImageURL  string `json:"garment_2_left_image_url"`
	Garment2RightImageURL string `json:"garment_2_right_image_url"`
	Garment3FrontImageURL string `json:"garment_3_front_image_url"`
	Garment3BackImageURL  string `json:"garment_3_back_image_url"`
	Garment3LeftImageURL  string `json:"garment_3_left_image_url"`
	Garment3RightImageURL string `json:"garment_3_right_image_url"`
	StoryLine1         string `json:"story_line_1"`
	StoryLine2         string `json:"story_line_2"`
	StoryLine3         string `json:"story_line_3"`
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
			COALESCE(b.phone, '')     AS phone,
			COALESCE(b.garment_1_front_image_url, '') AS garment_1_front_image_url,
			COALESCE(b.garment_1_back_image_url, '')  AS garment_1_back_image_url,
			COALESCE(b.garment_1_left_image_url, '')  AS garment_1_left_image_url,
			COALESCE(b.garment_1_right_image_url, '') AS garment_1_right_image_url,
			COALESCE(b.garment_2_front_image_url, '') AS garment_2_front_image_url,
			COALESCE(b.garment_2_back_image_url, '')  AS garment_2_back_image_url,
			COALESCE(b.garment_2_left_image_url, '')  AS garment_2_left_image_url,
			COALESCE(b.garment_2_right_image_url, '') AS garment_2_right_image_url,
			COALESCE(b.garment_3_front_image_url, '') AS garment_3_front_image_url,
			COALESCE(b.garment_3_back_image_url, '')  AS garment_3_back_image_url,
			COALESCE(b.garment_3_left_image_url, '')  AS garment_3_left_image_url,
			COALESCE(b.garment_3_right_image_url, '') AS garment_3_right_image_url,
			COALESCE(b.story_line_1, '') AS story_line_1,
			COALESCE(b.story_line_2, '') AS story_line_2,
			COALESCE(b.story_line_3, '') AS story_line_3
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
			b.instagram, b.facebook, b.twitter, b.tik_tok, b.phone,
			b.garment_1_front_image_url, b.garment_1_back_image_url, b.garment_1_left_image_url, b.garment_1_right_image_url,
			b.garment_2_front_image_url, b.garment_2_back_image_url, b.garment_2_left_image_url, b.garment_2_right_image_url,
			b.garment_3_front_image_url, b.garment_3_back_image_url, b.garment_3_left_image_url, b.garment_3_right_image_url,
			b.story_line_1, b.story_line_2, b.story_line_3
	`, slug).Scan(&brand).Error

	if err != nil || brand.ID == 0 {
		utils.NotFound(c, "Brand not found")
		return
	}

	utils.OK(c, "Brand fetched", brand)
}