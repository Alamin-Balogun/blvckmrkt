package handlers

import (
	"strings"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// ── Merged profile response (user + buyer fields) ─────────────────────────────
type ProfileResponse struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	Phone     string `json:"phone"`       // from buyers table
	AccountType string `json:"account_type"`
}

// buildProfileResponse loads user + their buyer row and merges into one response
func buildProfileResponse(userID uint) (ProfileResponse, error) {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return ProfileResponse{}, err
	}

	var buyer models.Buyer
	database.DB.Where("user_id = ?", userID).First(&buyer) // soft-fail — buyer row may not exist yet

	return ProfileResponse{
		ID:          user.ID,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		Email:       user.Email,
		AvatarURL:   user.AvatarURL,
		Phone:       buyer.Phone,            // from buyers table
		AccountType: string(user.AccountType),
	}, nil
}

// ── GET /api/buyer/profile ────────────────────────────────────────────────────
// Returns the full buyer profile merging users + buyers tables.
func GetProfile(c *gin.Context) {
	userID := c.GetUint("userID")

	profile, err := buildProfileResponse(userID)
	if err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.OK(c, "Profile fetched", profile)
}

// ── PUT /api/buyer/profile ────────────────────────────────────────────────────
// Updates user + buyer rows and returns the merged profile (including phone).
func UpdateProfile(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
		Phone     string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request body", nil)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// If email changed, check it's not taken by another account
	if req.Email != "" {
		var clash models.User
		if res := database.DB.Where("email = ? AND id != ?", req.Email, userID).First(&clash); res.Error == nil {
			utils.Conflict(c, "That email is already in use by another account")
			return
		}
	}

	// ── Update users table ────────────────────────────────────────────────────
	userUpdates := map[string]interface{}{}
	if req.FirstName != "" { userUpdates["first_name"] = strings.TrimSpace(req.FirstName) }
	if req.LastName  != "" { userUpdates["last_name"]  = strings.TrimSpace(req.LastName)  }
	if req.Email     != "" { userUpdates["email"]      = req.Email                        }
	if req.AvatarURL != "" { userUpdates["avatar_url"] = req.AvatarURL                   }

	if len(userUpdates) > 0 {
		if err := database.DB.Model(&models.User{}).Where("id = ?", userID).Updates(userUpdates).Error; err != nil {
			utils.InternalError(c, "Failed to update profile")
			return
		}
	}

	// ── Update buyers table (phone) ───────────────────────────────────────────
	// Use Updates with map so GORM doesn't skip zero-values,
	// and allow clearing phone with an explicit empty string if needed.
	if req.Phone != "" {
		database.DB.Model(&models.Buyer{}).Where("user_id = ?", userID).Update("phone", strings.TrimSpace(req.Phone))
	}

	// ── Return merged profile (user + buyer) so frontend has phone immediately ─
	profile, err := buildProfileResponse(userID)
	if err != nil {
		utils.InternalError(c, "Profile updated but failed to fetch")
		return
	}

	utils.OK(c, "Profile updated", profile)
}

// ── POST /api/auth/change-password ────────────────────────────────────────────
func ChangePassword(c *gin.Context) {
	userID := c.GetUint("userID")

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password"     binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Current and new password (min 8 chars) are required", nil)
		return
	}

	var user models.User
	database.DB.First(&user, userID)

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword)); err != nil {
		utils.BadRequest(c, "Current password is incorrect", map[string]string{
			"current_password": "Incorrect password",
		})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalError(c, "Failed to process password")
		return
	}

	database.DB.Model(&models.User{}).Where("id = ?", userID).Update("password", string(hashed))
	utils.OK(c, "Password updated successfully", nil)
}