// handlers/admin_bank_account.go
package handlers

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/services"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/bank-accounts ──────────────────────────────────────────────
func AdminListBankAccounts(c *gin.Context) {
	limit, offset := adminPageParams(c)
	search := c.Query("search")
	verified := c.Query("verified")

	type EnhancedAccount struct {
		ID                     uint                   `json:"id"`
		BrandID                uint                   `json:"brand_id"`
		BrandName              string                 `json:"brand_name"`
		BrandEmail             string                 `json:"brand_email"`
		BrandPhone             string                 `json:"brand_phone,omitempty"`
		BankName               string                 `json:"bank_name"`
		PaystackBankCode       string                 `json:"paystack_bank_code"`
		FlutterwaveBankCode    string                 `json:"flutterwave_bank_code"`
		AccountNumber          string                 `json:"account_number"`
		AccountName            string                 `json:"account_name"`
		AccountType            models.BankAccountType `json:"account_type"`
		Currency               string                 `json:"currency"`
		Country                string                 `json:"country"`
		PaystackRecipientCode  string                 `json:"paystack_recipient_code"`
		FlutterwaveRecipientID string                 `json:"flutterwave_recipient_id"`
		IsVerified             bool                   `json:"is_verified"`
		IsActive               bool                   `json:"is_active"`
		Notes                  string                 `json:"notes"`
		VerifiedAt             *time.Time             `json:"verified_at"`
		CreatedAt              time.Time              `json:"created_at"`
		UpdatedAt              time.Time              `json:"updated_at"`
	}

	q := database.DB.Table("brand_bank_accounts bba").
		Select(`
			bba.id, bba.brand_id, b.brand_name,
			u.email AS brand_email,
			b.phone AS brand_phone,
			bba.bank_name, bba.paystack_bank_code, bba.flutterwave_bank_code,
			bba.account_number, bba.account_name,
			bba.account_type, bba.currency, bba.country,
			bba.paystack_recipient_code, bba.flutterwave_recipient_id,
			bba.is_verified, bba.is_active, bba.notes,
			bba.verified_at, bba.created_at, bba.updated_at
		`).
		Joins("LEFT JOIN brands b ON b.id = bba.brand_id").
		Joins("LEFT JOIN users u ON u.id = b.user_id").
		Where("bba.deleted_at IS NULL")

	if search != "" {
		like := "%" + search + "%"
		q = q.Where(`
			b.brand_name LIKE ? OR 
			u.email LIKE ? OR 
			bba.account_number LIKE ? OR
			bba.account_name LIKE ?
		`, like, like, like, like)
	}

	if verified == "true" {
		q = q.Where("bba.is_verified = ?", true)
	} else if verified == "false" {
		q = q.Where("bba.is_verified = ?", false)
	}

	var total int64
	countQ := database.DB.Table("brand_bank_accounts bba").
		Joins("LEFT JOIN brands b ON b.id = bba.brand_id").
		Joins("LEFT JOIN users u ON u.id = b.user_id").
		Where("bba.deleted_at IS NULL")

	if search != "" {
		like := "%" + search + "%"
		countQ = countQ.Where(`
			b.brand_name LIKE ? OR 
			u.email LIKE ? OR 
			bba.account_number LIKE ? OR
			bba.account_name LIKE ?
		`, like, like, like, like)
	}
	if verified == "true" {
		countQ = countQ.Where("bba.is_verified = ?", true)
	} else if verified == "false" {
		countQ = countQ.Where("bba.is_verified = ?", false)
	}
	countQ.Count(&total)

	var accounts []EnhancedAccount
	q.Order("bba.created_at DESC").
		Limit(limit).
		Offset(offset).
		Scan(&accounts)

	utils.OK(c, "Bank accounts fetched", gin.H{
		"accounts": accounts,
		"total":    total,
	})
}

// ── GET /api/admin/bank-accounts/:id ──────────────────────────────────────────
func AdminGetBankAccountByID(c *gin.Context) {
	accountID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid account ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.First(&account, accountID).Error; err != nil {
		utils.NotFound(c, "Bank account not found")
		return
	}

	var brand models.Brand
	database.DB.Select("id, brand_name, user_id, phone").First(&brand, account.BrandID)

	var user models.User
	database.DB.Select("email").First(&user, brand.UserID)

	response := gin.H{
		"id":                       account.ID,
		"brand_id":                 account.BrandID,
		"brand_name":               brand.BrandName,
		"brand_email":              user.Email,
		"brand_phone":              brand.Phone,
		"bank_name":                account.BankName,
		"paystack_bank_code":       account.PaystackBankCode,
		"flutterwave_bank_code":    account.FlutterwaveBankCode,
		"account_number":           account.AccountNumber,
		"account_name":             account.AccountName,
		"account_type":             account.AccountType,
		"currency":                 account.Currency,
		"country":                  account.Country,
		"paystack_recipient_code":  account.PaystackRecipientCode,
		"flutterwave_recipient_id": account.FlutterwaveRecipientID,
		"is_verified":              account.IsVerified,
		"is_active":                account.IsActive,
		"notes":                    account.Notes,
		"verified_at":              account.VerifiedAt,
		"created_at":               account.CreatedAt,
		"updated_at":               account.UpdatedAt,
	}

	utils.OK(c, "Bank account fetched", response)
}

// ── PATCH /api/admin/bank-accounts/:id ────────────────────────────────────────
func AdminUpdateBankAccount(c *gin.Context) {
	accountID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid account ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.First(&account, accountID).Error; err != nil {
		utils.NotFound(c, "Bank account not found")
		return
	}

	var req struct {
		BankName            string `json:"bank_name"`
		PaystackBankCode    string `json:"paystack_bank_code"`
		FlutterwaveBankCode string `json:"flutterwave_bank_code"`
		AccountNumber       string `json:"account_number"`
		AccountName         string `json:"account_name"`
		AccountType         string `json:"account_type"`
		Currency            string `json:"currency"`
		Notes               string `json:"notes"`
		IsActive            *bool  `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request", nil)
		return
	}

	updates := map[string]interface{}{}
	detailsChanged := false

	if req.BankName != "" {
		updates["bank_name"] = req.BankName
	}
	if req.PaystackBankCode != "" {
		updates["paystack_bank_code"] = req.PaystackBankCode
		detailsChanged = true
	}
	if req.FlutterwaveBankCode != "" {
		updates["flutterwave_bank_code"] = req.FlutterwaveBankCode
		detailsChanged = true
	}
	if req.AccountNumber != "" {
		updates["account_number"] = req.AccountNumber
		detailsChanged = true
	}
	if req.AccountName != "" {
		updates["account_name"] = req.AccountName
		detailsChanged = true
	}
	if req.AccountType != "" {
		updates["account_type"] = req.AccountType
	}
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.Notes != "" {
		updates["notes"] = req.Notes
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if detailsChanged && account.IsVerified {
		updates["is_verified"] = false
		updates["verified_at"] = nil
		updates["paystack_recipient_code"] = ""
		updates["flutterwave_recipient_id"] = ""
	}

	if len(updates) == 0 {
		utils.BadRequest(c, "No fields to update", nil)
		return
	}

	if err := database.DB.Model(&account).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to update bank account")
		return
	}

	entityID := account.BrandID
	logActivity(c, "brand", &entityID, "admin_updated_bank_account",
		fmt.Sprintf(`{"account_id":%d,"fields_updated":%d}`, accountID, len(updates)))

	utils.OK(c, "Bank account updated successfully", nil)
}

// ── DELETE /api/admin/bank-accounts/:id ───────────────────────────────────────
func AdminDeleteBankAccount(c *gin.Context) {
	accountID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid account ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.First(&account, accountID).Error; err != nil {
		utils.NotFound(c, "Bank account not found")
		return
	}

	var pendingPayouts int64
	database.DB.Model(&models.BrandPayout{}).
		Where("bank_account_id = ? AND status IN ?", accountID,
			[]string{"pending", "processing"}).
		Count(&pendingPayouts)

	if pendingPayouts > 0 {
		utils.Conflict(c, fmt.Sprintf(
			"Cannot delete: %d pending/processing payout(s) exist for this account",
			pendingPayouts,
		))
		return
	}

	if err := database.DB.Delete(&account).Error; err != nil {
		utils.InternalError(c, "Failed to delete bank account")
		return
	}

	entityID := account.BrandID
	logActivity(c, "brand", &entityID, "admin_deleted_bank_account",
		fmt.Sprintf(`{"account_id":%d,"account_number":"%s","bank":"%s"}`,
			accountID, account.AccountNumber, account.BankName))

	utils.OK(c, "Bank account deleted successfully", nil)
}

// ── POST /api/admin/bank-accounts/:id/verify ──────────────────────────────────
func AdminVerifyBankAccountByID(c *gin.Context) {
	accountID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid account ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.First(&account, accountID).Error; err != nil {
		utils.NotFound(c, "Bank account not found")
		return
	}

	if account.IsVerified {
		utils.Conflict(c, "Bank account is already verified")
		return
	}

	// ✅ VALIDATE BANK DETAILS
	if account.BankName == "" || account.PaystackBankCode == "" ||
		account.FlutterwaveBankCode == "" || account.AccountNumber == "" ||
		account.AccountName == "" {
		utils.BadRequest(c, "Incomplete bank account details. Cannot verify.", nil)
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"is_verified":              true,
		"verified_at":              &now,
		"paystack_recipient_code":  "",
		"flutterwave_recipient_id": "",
	}

	var warnings []string
	paystackSuccess := false

	// ✅ Paystack — requires a recipient code to initiate transfers
	paystackCode, paystackErr := services.CreatePaystackRecipient(services.RecipientRequest{
		Type:          "nuban",
		Name:          account.AccountName,
		AccountNumber: account.AccountNumber,
		BankCode:      account.PaystackBankCode,
		Currency:      account.Currency,
	})

	if paystackErr != nil {
		log.Printf("❌ Paystack recipient creation failed: %v", paystackErr)
		warnings = append(warnings, fmt.Sprintf("Paystack: %v", paystackErr))
	} else {
		updates["paystack_recipient_code"] = paystackCode
		paystackSuccess = true
		log.Printf("✅ Created Paystack recipient: %s", paystackCode)
	}

	// ✅ Flutterwave — does NOT use a pre-created beneficiary ID.
	// Transfers go direct via account_number + bank_code (see InitiateFlutterwaveTransfer).
	// We store a marker so we know this account is Flutterwave-ready.
	flwMarker := fmt.Sprintf("FLW-%s-%s", account.FlutterwaveBankCode, account.AccountNumber)
	updates["flutterwave_recipient_id"] = flwMarker
	flutterwaveSuccess := true
	log.Printf("✅ Flutterwave marked ready for direct transfer: %s", flwMarker)

	if err := database.DB.Model(&account).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to save verification status")
		return
	}

	entityID := account.BrandID
	logActivity(c, "brand", &entityID, "admin_verified_bank_account",
		fmt.Sprintf(`{"account_id":%d,"account_number":"%s","bank":"%s","paystack_success":%v,"flutterwave_success":%v}`,
			accountID, account.AccountNumber, account.BankName, paystackSuccess, flutterwaveSuccess))

	message := "Bank account verified successfully"
	if len(warnings) > 0 {
		message = "Bank account verified with warnings. Paystack setup failed — Paystack payouts may not work until resolved."
	}

	utils.OK(c, message, gin.H{
		"verified_at":                   now,
		"paystack_recipient_created":    paystackSuccess,
		"flutterwave_recipient_created": flutterwaveSuccess,
		"warnings":                      warnings,
		"message":                       message,
	})
}

// ── POST /api/admin/bank-accounts/:id/unverify ────────────────────────────────
func AdminUnverifyBankAccount(c *gin.Context) {
	accountID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid account ID", nil)
		return
	}

	var account models.BrandBankAccount
	if err := database.DB.First(&account, accountID).Error; err != nil {
		utils.NotFound(c, "Bank account not found")
		return
	}

	if !account.IsVerified {
		utils.Conflict(c, "Bank account is not verified")
		return
	}

	updates := map[string]interface{}{
		"is_verified": false,
		"verified_at": nil,
	}

	if err := database.DB.Model(&account).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to unverify bank account")
		return
	}

	entityID := account.BrandID
	logActivity(c, "brand", &entityID, "admin_unverified_bank_account",
		fmt.Sprintf(`{"account_id":%d,"account_number":"%s","bank":"%s"}`,
			accountID, account.AccountNumber, account.BankName))

	utils.OK(c, "Bank account unverified successfully", nil)
}