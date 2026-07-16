// handlers/brand_bank_account.go
package handlers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── Brand endpoints (for brand to manage their own bank account) ──────────────

// GET /api/brand/bank-account
func BrandGetBankAccount(c *gin.Context) {
	userID := c.GetUint("userID")
	
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.Where("brand_id = ?", brand.ID).First(&account).Error; err != nil {
		utils.NotFound(c, "No bank account on file")
		return
	}

	utils.OK(c, "Bank account fetched", account)
}

// POST /api/brand/bank-account
func BrandCreateBankAccount(c *gin.Context) {
	userID := c.GetUint("userID")
	
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var req struct {
		BankName            string `json:"bank_name" binding:"required"`
		PaystackBankCode    string `json:"paystack_bank_code" binding:"required"`
		FlutterwaveBankCode string `json:"flutterwave_bank_code" binding:"required"`
		AccountNumber       string `json:"account_number" binding:"required"`
		AccountName         string `json:"account_name" binding:"required"`
		AccountType         string `json:"account_type"`
		Currency            string `json:"currency"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request. All bank codes are required.", nil)
		return
	}

	// Check if account already exists
	var existing models.BrandBankAccount
	if database.DB.Where("brand_id = ?", brand.ID).First(&existing).Error == nil {
		utils.Conflict(c, "Bank account already exists. Use PATCH to update.")
		return
	}

	// Create account
	account := models.BrandBankAccount{
		BrandID:             brand.ID,
		BankName:            req.BankName,
		PaystackBankCode:    req.PaystackBankCode,
		FlutterwaveBankCode: req.FlutterwaveBankCode,
		AccountNumber:       req.AccountNumber,
		AccountName:         req.AccountName,
		AccountType:         models.BankAccountType(req.AccountType),
		Currency:            req.Currency,
		IsActive:            true,
	}

	if req.Currency == "" {
		account.Currency = "NGN"
	}
	if req.AccountType == "" {
		account.AccountType = models.BankAccountSavings
	}

	if err := database.DB.Create(&account).Error; err != nil {
		utils.InternalError(c, "Failed to save bank account")
		return
	}

	utils.Created(c, "Bank account added successfully", account)
}

// PATCH /api/brand/bank-account
func BrandUpdateBankAccount(c *gin.Context) {
	userID := c.GetUint("userID")
	
	brand, err := getBrandForUser(userID)
	if err != nil {
		utils.NotFound(c, "Brand not found")
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.Where("brand_id = ?", brand.ID).First(&account).Error; err != nil {
		utils.NotFound(c, "No bank account found")
		return
	}

	var req struct {
		BankName            string `json:"bank_name"`
		PaystackBankCode    string `json:"paystack_bank_code"`
		FlutterwaveBankCode string `json:"flutterwave_bank_code"`
		AccountNumber       string `json:"account_number"`
		AccountName         string `json:"account_name"`
		AccountType         string `json:"account_type"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request", nil)
		return
	}

	updates := map[string]interface{}{}
	if req.BankName != ""            { updates["bank_name"] = req.BankName }
	if req.PaystackBankCode != ""    { updates["paystack_bank_code"] = req.PaystackBankCode }
	if req.FlutterwaveBankCode != "" { updates["flutterwave_bank_code"] = req.FlutterwaveBankCode }
	if req.AccountNumber != ""       { updates["account_number"] = req.AccountNumber }
	if req.AccountName != ""         { updates["account_name"] = req.AccountName }
	if req.AccountType != ""         { updates["account_type"] = req.AccountType }

	// Reset verification when account details change
	if len(updates) > 0 {
		updates["is_verified"] = false
		updates["verified_at"] = nil
		updates["paystack_recipient_code"] = ""
		updates["flutterwave_recipient_id"] = ""
	}

	database.DB.Model(&account).Updates(updates)

	utils.OK(c, "Bank account updated", nil)
}

// ── Admin endpoints ────────────────────────────────────────────────────────────

// GET /api/admin/brands/:id/bank-account
func AdminGetBrandBankAccount(c *gin.Context) {
	brandID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.Where("brand_id = ?", brandID).First(&account).Error; err != nil {
		utils.NotFound(c, "No bank account found for this brand")
		return
	}

	utils.OK(c, "Bank account fetched", account)
}

// POST /api/admin/brands/:id/verify-bank-account
func AdminVerifyBrandBankAccount(c *gin.Context) {
	brandID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid brand ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.Where("brand_id = ?", brandID).First(&account).Error; err != nil {
		utils.NotFound(c, "No bank account found")
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"is_verified": true,
		"verified_at": &now,
	}

	database.DB.Model(&account).Updates(updates)

	entityID := uint(brandID)
	logActivity(c, "brand", &entityID, "verified_bank_account",
		fmt.Sprintf(`{"account_number":"%s","bank":"%s"}`, account.AccountNumber, account.BankName))

	utils.OK(c, "Bank account verified", nil)
}