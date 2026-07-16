// handlers/admin_payout.go
package handlers

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/services"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// ── GET /api/admin/orders/:id/payout-info ─────────────────────────────────────
func AdminGetOrderPayoutInfo(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	var order models.Order
	if err := database.DB.Preload("Items").First(&order, orderID).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	type BrandInfo struct {
		BrandID        uint                     `json:"brand_id"`
		BrandName      string                   `json:"brand_name"`
		BrandEmail     string                   `json:"brand_email"`
		Amount         float64                  `json:"amount"`
		Items          []models.OrderItem       `json:"items"`
		HasBankAccount bool                     `json:"has_bank_account"`
		BankAccount    *models.BrandBankAccount `json:"bank_account,omitempty"`
	}

	brandMap := make(map[uint]BrandInfo)
	for _, item := range order.Items {
		entry := brandMap[item.BrandID]
		entry.BrandID = item.BrandID
		entry.Amount += item.TotalPrice
		entry.Items = append(entry.Items, item)
		brandMap[item.BrandID] = entry
	}

	brands := make([]BrandInfo, 0, len(brandMap))
	for brandID, entry := range brandMap {
		var brand models.Brand
		if database.DB.First(&brand, brandID).Error != nil {
			continue
		}
		entry.BrandName = brand.BrandName

		var user models.User
		if database.DB.Select("email").First(&user, brand.UserID).Error == nil {
			entry.BrandEmail = user.Email
		}

		var bankAccount models.BrandBankAccount
		if err := database.DB.Where("brand_id = ? AND is_active = ?", brandID, true).
			First(&bankAccount).Error; err == nil {
			entry.HasBankAccount = true
			entry.BankAccount = &bankAccount
		} else {
			entry.HasBankAccount = false
		}

		brands = append(brands, entry)
	}

	suggestedGateway := "paystack"
	switch strings.ToLower(order.PaymentMethod) {
	case "paystack":
		suggestedGateway = "paystack"
	case "flutterwave":
		suggestedGateway = "flutterwave"
	case "transfer", "manual_transfer", "bank_transfer":
		suggestedGateway = "manual"
	}

	log.Printf("📊 Order %s paid via '%s' → suggesting gateway: '%s'",
		order.DisplayID, order.PaymentMethod, suggestedGateway)

	utils.OK(c, "Payout info fetched", gin.H{
		"display_id":        order.DisplayID,
		"total":             order.Total,
		"subtotal":          order.Subtotal,
		"shipping_fee":      order.ShippingFee,
		"brands":            brands,
		"payment_method":    order.PaymentMethod,
		"suggested_gateway": suggestedGateway,
	})
}

// ── POST /api/admin/orders/:id/initiate-payout ────────────────────────────────
func AdminInitiatePayout(c *gin.Context) {
	orderID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid order ID", nil)
		return
	}

	adminID := c.GetUint("adminID")

	var req struct {
		BrandID uint   `json:"brand_id" binding:"required"`
		Gateway string `json:"gateway" binding:"required,oneof=paystack flutterwave manual"`
		Notes   string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "Invalid request. Provide brand_id and gateway.", nil)
		return
	}

	var order models.Order
	if err := database.DB.Preload("Items").First(&order, orderID).Error; err != nil {
		utils.NotFound(c, "Order not found")
		return
	}

	if order.PaymentStatus != models.PaymentPaid {
		utils.Conflict(c, "Order payment is not confirmed yet")
		return
	}

	var existingPayout models.BrandPayout
	if database.DB.Where("order_id = ? AND brand_id = ? AND status NOT IN ?",
		orderID, req.BrandID, []string{"failed", "reversed"}).
		First(&existingPayout).Error == nil {
		utils.Conflict(c, fmt.Sprintf("Payout already exists with status: %s", existingPayout.Status))
		return
	}

	var bankAccount models.BrandBankAccount
	if err := database.DB.Where("brand_id = ? AND is_active = ?", req.BrandID, true).
		First(&bankAccount).Error; err != nil {
		utils.NotFound(c, "Brand has no active bank account")
		return
	}

	if !bankAccount.IsVerified {
		utils.Conflict(c, "Brand's bank account is not verified yet")
		return
	}

	var amount float64
	for _, item := range order.Items {
		if item.BrandID == req.BrandID {
			amount += item.TotalPrice
		}
	}

	if amount <= 0 {
		utils.BadRequest(c, "No items found for this brand in the order", nil)
		return
	}

	reference := fmt.Sprintf("PAYOUT-%s-B%d-%d", order.DisplayID, req.BrandID, time.Now().Unix())

	payout := models.BrandPayout{
		BrandID:       req.BrandID,
		OrderID:       uint(orderID),
		BankAccountID: bankAccount.ID,
		Amount:        amount,
		Currency:      order.Currency,
		Gateway:       models.PayoutGateway(req.Gateway),
		Status:        models.PayoutPending,
		Reference:     reference,
		RecipientName: bankAccount.AccountName,
		AccountNumber: bankAccount.AccountNumber,
		BankName:      bankAccount.BankName,
		InitiatedBy:   adminID,
		AdminNotes:    req.Notes,
	}

	if req.Gateway == "manual" {
		payout.Status = models.PayoutProcessing
		if err := database.DB.Create(&payout).Error; err != nil {
			log.Printf("❌ Failed to create manual payout: %v", err)
			utils.InternalError(c, "Failed to create payout record")
			return
		}
		log.Printf("✅ Manual payout created: %s for %.2f to brand %d", reference, amount, req.BrandID)
		utils.OK(c, "Manual payout created. Complete the bank transfer and mark as complete.", gin.H{
			"payout_id": payout.ID,
			"reference": reference,
			"amount":    amount,
			"bank_account": gin.H{
				"bank_name":      bankAccount.BankName,
				"account_number": bankAccount.AccountNumber,
				"account_name":   bankAccount.AccountName,
			},
		})
		return
	}

	if err := database.DB.Create(&payout).Error; err != nil {
		log.Printf("❌ Failed to create payout record: %v", err)
		utils.InternalError(c, "Failed to create payout record")
		return
	}

	now := time.Now()
	database.DB.Model(&payout).Updates(map[string]interface{}{
		"status":       models.PayoutProcessing,
		"processed_at": &now,
	})

	var transferResult *services.TransferResult
	var transferErr error

	if req.Gateway == "paystack" {
		if bankAccount.PaystackRecipientCode == "" {
			database.DB.Model(&payout).Updates(map[string]interface{}{
				"status":         models.PayoutFailed,
				"failure_reason": "Bank account has no Paystack recipient code",
			})
			utils.Conflict(c, "Bank account is not set up for Paystack transfers")
			return
		}
		transferResult, transferErr = services.InitiatePaystackTransfer(services.TransferRequest{
			Amount:    amount,
			Recipient: bankAccount.PaystackRecipientCode,
			Reference: reference,
			Reason:    fmt.Sprintf("Payout for order %s", order.DisplayID),
			Currency:  order.Currency,
		})
		if transferErr == nil && transferResult != nil {
			database.DB.Model(&payout).Updates(map[string]interface{}{
				"transfer_code": transferResult.TransferCode,
				"status":        models.PayoutCompleted,
				"completed_at":  time.Now(),
			})
		}

	} else if req.Gateway == "flutterwave" {
		transferResult, transferErr = services.InitiateFlutterwaveTransfer(services.TransferRequest{
			BankCode:      bankAccount.FlutterwaveBankCode,
			AccountNumber: bankAccount.AccountNumber,
			Amount:        amount,
			Currency:      order.Currency,
			Reference:     reference,
			Narration:     fmt.Sprintf("Payout for order %s", order.DisplayID),
		})
		if transferErr == nil && transferResult != nil {
			database.DB.Model(&payout).Updates(map[string]interface{}{
				"transfer_id":  transferResult.TransferID,
				"status":       models.PayoutCompleted,
				"completed_at": time.Now(),
			})
		}
	}

	if transferErr != nil {
		log.Printf("❌ %s transfer failed: %v", req.Gateway, transferErr)
		database.DB.Model(&payout).Updates(map[string]interface{}{
			"status":         models.PayoutFailed,
			"failure_reason": transferErr.Error(),
		})
		utils.InternalError(c, fmt.Sprintf("%s transfer failed: %v", req.Gateway, transferErr))
		return
	}

	log.Printf("✅ %s payout successful: %s for %.2f to brand %d",
		req.Gateway, reference, amount, req.BrandID)

	// ── Send payout notification email to brand ────────────────────────────────
	go func() {
		var brand models.Brand
		var brandUser models.User
		if database.DB.First(&brand, req.BrandID).Error == nil &&
			database.DB.Select("email").First(&brandUser, brand.UserID).Error == nil {
			err := utils.SendPayoutEmail(utils.PayoutEmailData{
				BrandName:     brand.BrandName,
				BrandEmail:    brandUser.Email,
				Amount:        amount,
				Currency:      order.Currency,
				OrderID:       order.DisplayID,
				Reference:     reference,
				Gateway:       req.Gateway,
				AccountName:   bankAccount.AccountName,
				AccountNumber: bankAccount.AccountNumber,
				BankName:      bankAccount.BankName,
			})
			if err != nil {
				log.Printf("⚠️ Failed to send payout email to brand %d: %v", req.BrandID, err)
			} else {
				log.Printf("📧 Payout email sent to %s", brandUser.Email)
			}
		}
	}()

	entityID := uint(orderID)
	logActivity(c, "order", &entityID, "payout_initiated",
		fmt.Sprintf(`{"brand_id":%d,"amount":%.2f,"gateway":"%s","reference":"%s"}`,
			req.BrandID, amount, req.Gateway, reference))

	var transferCode, transferID string
	if transferResult != nil {
		transferCode = transferResult.TransferCode
		transferID = transferResult.TransferID
	}

	utils.OK(c, "Payout initiated successfully", gin.H{
		"payout_id":     payout.ID,
		"reference":     reference,
		"amount":        amount,
		"gateway":       req.Gateway,
		"status":        payout.Status,
		"transfer_code": transferCode,
		"transfer_id":   transferID,
	})
}

// ── GET /api/admin/payouts ────────────────────────────────────────────────────
func AdminListPayouts(c *gin.Context) {
	limit, offset := adminPageParams(c)
	status := c.Query("status")
	gateway := c.Query("gateway")

	q := database.DB.Table("brand_payouts bp").
		Select(`
			bp.id, bp.brand_id, bp.order_id, bp.amount, bp.currency,
			bp.gateway, bp.status, bp.reference, bp.transfer_code, bp.transfer_id,
			bp.recipient_name, bp.account_number, bp.bank_name,
			bp.initiated_by, bp.approved_by, bp.failure_reason,
			bp.admin_notes, bp.processed_at, bp.completed_at,
			bp.created_at, bp.updated_at,
			b.brand_name,
			o.display_id AS order_display_id
		`).
		Joins("LEFT JOIN brands b ON b.id = bp.brand_id").
		Joins("LEFT JOIN orders o ON o.id = bp.order_id").
		Where("bp.deleted_at IS NULL")

	if status != "" {
		q = q.Where("bp.status = ?", status)
	}
	if gateway != "" {
		q = q.Where("bp.gateway = ?", gateway)
	}

	var total int64
	database.DB.Model(&models.BrandPayout{}).Count(&total)

	var payouts []map[string]interface{}
	q.Order("bp.created_at DESC").Limit(limit).Offset(offset).Scan(&payouts)

	utils.OK(c, "Payouts fetched", gin.H{
		"payouts": payouts,
		"total":   total,
	})
}

// ── GET /api/admin/payouts/:id ────────────────────────────────────────────────
func AdminGetPayout(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid payout ID", nil)
		return
	}

	var payout models.BrandPayout
	if err := database.DB.First(&payout, id).Error; err != nil {
		utils.NotFound(c, "Payout not found")
		return
	}

	var brand models.Brand
	database.DB.Select("brand_name, user_id").First(&brand, payout.BrandID)

	var order models.Order
	database.DB.Select("display_id, payment_method").First(&order, payout.OrderID)

	utils.OK(c, "Payout fetched", gin.H{
		"payout":           payout,
		"brand_name":       brand.BrandName,
		"order_display_id": order.DisplayID,
		"payment_method":   order.PaymentMethod,
	})
}

// ── PATCH /api/admin/payouts/:id/complete ─────────────────────────────────────
func AdminCompletePayout(c *gin.Context) {
	payoutID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid payout ID", nil)
		return
	}

	adminID := c.GetUint("adminID")

	var payout models.BrandPayout
	if err := database.DB.First(&payout, payoutID).Error; err != nil {
		utils.NotFound(c, "Payout not found")
		return
	}

	if payout.Gateway != models.PayoutManual {
		utils.BadRequest(c, "Only manual payouts can be marked complete", nil)
		return
	}

	if payout.Status == models.PayoutCompleted {
		utils.Conflict(c, "Payout is already completed")
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"status":       models.PayoutCompleted,
		"completed_at": &now,
		"approved_by":  adminID,
	}

	if err := database.DB.Model(&payout).Updates(updates).Error; err != nil {
		utils.InternalError(c, "Failed to update payout status")
		return
	}

	log.Printf("✅ Manual payout %s marked complete by admin %d", payout.Reference, adminID)

	// ── Send payout notification email to brand ────────────────────────────────
	go func() {
		var brand models.Brand
		var brandUser models.User
		var order models.Order
		database.DB.Select("display_id, currency").First(&order, payout.OrderID)
		if database.DB.First(&brand, payout.BrandID).Error == nil &&
			database.DB.Select("email").First(&brandUser, brand.UserID).Error == nil {
			err := utils.SendPayoutEmail(utils.PayoutEmailData{
				BrandName:     brand.BrandName,
				BrandEmail:    brandUser.Email,
				Amount:        payout.Amount,
				Currency:      payout.Currency,
				OrderID:       order.DisplayID,
				Reference:     payout.Reference,
				Gateway:       "manual",
				AccountName:   payout.RecipientName,
				AccountNumber: payout.AccountNumber,
				BankName:      payout.BankName,
			})
			if err != nil {
				log.Printf("⚠️ Failed to send payout email to brand %d: %v", payout.BrandID, err)
			} else {
				log.Printf("📧 Payout email sent to %s", brandUser.Email)
			}
		}
	}()

	entityID := payout.OrderID
	logActivity(c, "order", &entityID, "payout_completed",
		fmt.Sprintf(`{"payout_id":%d,"brand_id":%d,"amount":%.2f}`,
			payoutID, payout.BrandID, payout.Amount))

	utils.OK(c, "Payout marked as complete", nil)
}