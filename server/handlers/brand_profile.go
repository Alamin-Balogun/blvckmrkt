package handlers

import (
	"log"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// helper: load brand row for the authenticated user
func getBrandForUser(userID uint) (*models.Brand, error) {
	var brand models.Brand
	if err := database.DB.Where("user_id = ?", userID).First(&brand).Error; err != nil {
		return nil, err
	}
	return &brand, nil
}

// ── GET /api/brand/profile ────────────────────────────────────────────────────
func GetBrandProfile(c *gin.Context) {
	userID := c.GetUint("userID")

	var user models.User
	if err := database.DB.Select("*").First(&user, userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand profile not found")
		return
	}

	utils.OK(c, "Brand profile fetched", buildBrandProfileResponse(user, *brand))
}

// ── PUT /api/brand/profile ────────────────────────────────────────────────────
func UpdateBrandProfile(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		// Brand fields
		BrandName   string `json:"brand_name"`
		Description string `json:"description"`
		LogoURL     string `json:"logo_url"`
		BannerURL   string `json:"banner_url"`
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
		Website     string `json:"website"`
		Category    string `json:"category"`
		Instagram   string `json:"instagram"`
		Facebook    string `json:"facebook"`
		Twitter     string `json:"twitter"`
		TikTok      string `json:"tiktok"`
		Phone       string `json:"phone"`
		// User fields
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		AvatarURL string `json:"avatar_url"`
		// Location fields (saved to users table)
		CountryCode string `json:"country_code"`
		CountryName string `json:"country_name"`
		StateCode   string `json:"state_code"`
		StateName   string `json:"state_name"`
		City        string `json:"city"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	// ── Update users table via raw SQL ────────────────────────────────────────
	userSQL := `UPDATE users SET updated_at = NOW()`
	userArgs := []interface{}{}

	if req.FirstName != "" {
		userSQL += ", first_name = ?"
		userArgs = append(userArgs, strings.TrimSpace(req.FirstName))
	}
	if req.LastName != "" {
		userSQL += ", last_name = ?"
		userArgs = append(userArgs, strings.TrimSpace(req.LastName))
	}
	if req.AvatarURL != "" {
		userSQL += ", avatar_url = ?"
		userArgs = append(userArgs, req.AvatarURL)
	}
	if req.CountryCode != "" {
		userSQL += ", country_code = ?, country_name = ?, state_code = ?, state_name = ?, city = ?"
		userArgs = append(userArgs,
			strings.TrimSpace(req.CountryCode),
			strings.TrimSpace(req.CountryName),
			strings.TrimSpace(req.StateCode),
			strings.TrimSpace(req.StateName),
			strings.TrimSpace(req.City),
		)
	}
	userSQL += " WHERE id = ?"
	userArgs = append(userArgs, userID)

	if err := database.DB.Exec(userSQL, userArgs...).Error; err != nil {
		log.Printf("[UpdateBrandProfile] user row update failed: %v", err)
	} else {
		log.Printf("[UpdateBrandProfile] user %d updated — country=%q state=%q city=%q",
			userID, req.CountryCode, req.StateCode, req.City)
	}

// ── Update brands table ───────────────────────────────────────────────────
log.Printf("[UpdateBrandProfile] updating brand for user %d", userID)
if err := database.DB.Exec(`UPDATE brands SET brand_name = ?, logo_url = ?, banner_url = ?, garment_1_front_image_url = ?, garment_1_back_image_url = ?, garment_1_left_image_url = ?, garment_1_right_image_url = ?, garment_2_front_image_url = ?, garment_2_back_image_url = ?, garment_2_left_image_url = ?, garment_2_right_image_url = ?, garment_3_front_image_url = ?, garment_3_back_image_url = ?, garment_3_left_image_url = ?, garment_3_right_image_url = ?, story_line_1 = ?, story_line_2 = ?, story_line_3 = ?, description = ?, website = ?, category = ?, instagram = ?, facebook = ?, twitter = ?, tik_tok = ?, phone = ?, updated_at = NOW() WHERE user_id = ? AND deleted_at IS NULL`,
    strings.TrimSpace(req.BrandName),
    req.LogoURL,
    req.BannerURL,
    req.Garment1FrontImageURL,
    req.Garment1BackImageURL,
    req.Garment1LeftImageURL,
    req.Garment1RightImageURL,
    req.Garment2FrontImageURL,
    req.Garment2BackImageURL,
    req.Garment2LeftImageURL,
    req.Garment2RightImageURL,
    req.Garment3FrontImageURL,
    req.Garment3BackImageURL,
    req.Garment3LeftImageURL,
    req.Garment3RightImageURL,
    strings.TrimSpace(req.StoryLine1),
    strings.TrimSpace(req.StoryLine2),
    strings.TrimSpace(req.StoryLine3),
    strings.TrimSpace(req.Description),
    strings.TrimSpace(req.Website),
    strings.TrimSpace(req.Category),
    strings.TrimSpace(req.Instagram),
    strings.TrimSpace(req.Facebook),
    strings.TrimSpace(req.Twitter),
    strings.TrimSpace(req.TikTok),
    strings.TrimSpace(req.Phone),
    userID,
).Error; err != nil {
    log.Printf("[UpdateBrandProfile] SQL error: %v", err)
    utils.InternalError(c, "Failed to update brand profile")
    return
}

	// Return updated profile
	var user models.User
	database.DB.Select("*").First(&user, userID)
	brand, _ := getBrandForUser(userID)

	utils.OK(c, "Brand profile updated", buildBrandProfileResponse(user, *brand))
}

// ── BrandProfileResponse ──────────────────────────────────────────────────────
type BrandProfileResponse struct {
	// User fields
	UserID    uint   `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	// Brand fields
	BrandID            uint                      `json:"brand_id"`
	DisplayID          string                    `json:"display_id"`
	BrandName          string                    `json:"brand_name"`
	Slug               string                    `json:"slug"`
	Description        string                    `json:"description"`
	LogoURL            string                    `json:"logo_url"`
	BannerURL          string                    `json:"banner_url"`
	Garment1FrontImageURL string                  `json:"garment_1_front_image_url"`
	Garment1BackImageURL  string                  `json:"garment_1_back_image_url"`
	Garment1LeftImageURL  string                  `json:"garment_1_left_image_url"`
	Garment1RightImageURL string                  `json:"garment_1_right_image_url"`
	Garment2FrontImageURL string                  `json:"garment_2_front_image_url"`
	Garment2BackImageURL  string                  `json:"garment_2_back_image_url"`
	Garment2LeftImageURL  string                  `json:"garment_2_left_image_url"`
	Garment2RightImageURL string                  `json:"garment_2_right_image_url"`
	Garment3FrontImageURL string                  `json:"garment_3_front_image_url"`
	Garment3BackImageURL  string                  `json:"garment_3_back_image_url"`
	Garment3LeftImageURL  string                  `json:"garment_3_left_image_url"`
	Garment3RightImageURL string                  `json:"garment_3_right_image_url"`
	StoryLine1         string                    `json:"story_line_1"`
	StoryLine2         string                    `json:"story_line_2"`
	StoryLine3         string                    `json:"story_line_3"`
	Website            string                    `json:"website"`
	Category           string                    `json:"category"`
	Instagram          string                    `json:"instagram"`
	Facebook           string                    `json:"facebook"`
	Twitter            string                    `json:"twitter"`
	TikTok             string                    `json:"tiktok"`
	Phone              string                    `json:"phone"`
	VerificationStatus models.VerificationStatus `json:"verification_status"`

	// ✅ Partnership fields
	PartnershipSigned   bool       `json:"partnership_signed"`
	PartnershipSignedAt *time.Time `json:"partnership_signed_at,omitempty"`

	// Subscription
	SubscriptionPlan    string                    `json:"subscription_plan"`
	SubscriptionStatus  models.SubscriptionStatus `json:"subscription_status"`
	SubscriptionBilling string                    `json:"subscription_billing"`
	TrialEndsAt         interface{}               `json:"trial_ends_at"`
	CurrentPeriodEnd    interface{}               `json:"current_period_end"`

	// Location (from users table)
	CountryCode string `json:"country_code"`
	CountryName string `json:"country_name"`
	StateCode   string `json:"state_code"`
	StateName   string `json:"state_name"`
	City        string `json:"city"`
}

func buildBrandProfileResponse(user models.User, brand models.Brand) BrandProfileResponse {
	str := func(p *string) string {
		if p != nil {
			return *p
		}
		return ""
	}

	return BrandProfileResponse{
		UserID:              user.ID,
		FirstName:           user.FirstName,
		LastName:            user.LastName,
		Email:               user.Email,
		AvatarURL:           user.AvatarURL,
		BrandID:             brand.ID,
		DisplayID:           brand.DisplayID,
		BrandName:           brand.BrandName,
		Slug:                brand.Slug,
		Description:         brand.Description,
		LogoURL:             brand.LogoURL,
		BannerURL:           brand.BannerURL,
		Garment1FrontImageURL: brand.Garment1FrontImageURL,
		Garment1BackImageURL:  brand.Garment1BackImageURL,
		Garment1LeftImageURL:  brand.Garment1LeftImageURL,
		Garment1RightImageURL: brand.Garment1RightImageURL,
		Garment2FrontImageURL: brand.Garment2FrontImageURL,
		Garment2BackImageURL:  brand.Garment2BackImageURL,
		Garment2LeftImageURL:  brand.Garment2LeftImageURL,
		Garment2RightImageURL: brand.Garment2RightImageURL,
		Garment3FrontImageURL: brand.Garment3FrontImageURL,
		Garment3BackImageURL:  brand.Garment3BackImageURL,
		Garment3LeftImageURL:  brand.Garment3LeftImageURL,
		Garment3RightImageURL: brand.Garment3RightImageURL,
		StoryLine1:          brand.StoryLine1,
		StoryLine2:          brand.StoryLine2,
		StoryLine3:          brand.StoryLine3,
		Website:             brand.Website,
		Category:            brand.Category,
		Instagram:           brand.Instagram,
		Facebook:            brand.Facebook,
		Twitter:             brand.Twitter,
		TikTok:              brand.TikTok,
		Phone:               brand.Phone,
		VerificationStatus:  brand.VerificationStatus,
		// ✅ Map partnership fields
		PartnershipSigned:   brand.PartnershipSigned,
		PartnershipSignedAt: brand.PartnershipSignedAt,
		SubscriptionPlan:    brand.SubscriptionPlan,
		SubscriptionStatus:  brand.SubscriptionStatus,
		SubscriptionBilling: brand.SubscriptionBilling,
		TrialEndsAt:         brand.TrialEndsAt,
		CurrentPeriodEnd:    brand.CurrentPeriodEnd,
		CountryCode:         str(user.CountryCode),
		CountryName:         str(user.CountryName),
		StateCode:           str(user.StateCode),
		StateName:           str(user.StateName),
		City:                str(user.City),
	}
}

// ── PATCH /api/auth/location ──────────────────────────────────────────────────
func UpdateUserLocation(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		CountryCode string `json:"country_code"`
		CountryName string `json:"country_name"`
		StateCode   string `json:"state_code"`
		StateName   string `json:"state_name"`
		City        string `json:"city"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}
	if req.CountryCode == "" {
		utils.BadRequest(c, "country_code is required", nil)
		return
	}

	sql := `UPDATE users SET
		country_code = ?,
		country_name = ?,
		state_code   = ?,
		state_name   = ?,
		city         = ?,
		updated_at   = NOW()
	WHERE id = ?`

	if err := database.DB.Exec(sql,
		strings.TrimSpace(req.CountryCode),
		strings.TrimSpace(req.CountryName),
		strings.TrimSpace(req.StateCode),
		strings.TrimSpace(req.StateName),
		strings.TrimSpace(req.City),
		userID,
	).Error; err != nil {
		log.Printf("[UpdateUserLocation] failed for user %d: %v", err)
		utils.InternalError(c, "Failed to update location")
		return
	}

	log.Printf("[UpdateUserLocation] user %d → country=%q state=%q city=%q",
		userID, req.CountryCode, req.StateCode, req.City)
	utils.OK(c, "Location updated", nil)
}