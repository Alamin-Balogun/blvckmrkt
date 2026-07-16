package routes

import (
	"github.com/Alamin-Balogun/blvckmrkt/handlers"
	"github.com/Alamin-Balogun/blvckmrkt/middleware"
	"github.com/gin-gonic/gin"
)

func RegisterAdmin(r *gin.Engine) {

	// ══════════════════════════════════════════════════════════════════════════
	// ADMIN AUTHENTICATION (Public - No Auth Required)
	// ══════════════════════════════════════════════════════════════════════════

	auth := r.Group("/api/admin/auth")
	{
		auth.POST("/bootstrap",  handlers.AdminBootstrap)
		auth.POST("/login",      handlers.AdminLogin)
		auth.POST("/verify-otp", handlers.AdminVerifyOTP)
	}

	// ══════════════════════════════════════════════════════════════════════════
	// PROTECTED ADMIN ROUTES (Admin JWT Required)
	// ══════════════════════════════════════════════════════════════════════════

	api := r.Group("/api/admin", middleware.RequireAdmin())
	{
		// ── Authentication ────────────────────────────────────────────────────
		api.GET("/auth/me", handlers.AdminMe)
		api.POST("/upload",   handlers.UploadImage)

		// ── Dashboard & Analytics ─────────────────────────────────────────────
		api.GET("/stats",    handlers.AdminStats)
		api.GET("/activity", handlers.AdminActivity)

		// Analytics
		api.GET("/analytics/overview", handlers.AdminAnalyticsOverview)
		api.GET("/analytics/weekly",   handlers.AdminAnalyticsWeekly)
		api.GET("/analytics/revenue",  handlers.AdminAnalyticsRevenue)
		api.GET("/analytics/users",    handlers.AdminAnalyticsUsers)

		// ── User Management ───────────────────────────────────────────────────
		api.GET("/users",             handlers.AdminListUsers)
		api.POST("/users/create",     handlers.AdminCreateUser)
		api.GET("/users/:id",         handlers.AdminGetUser)
		api.PATCH("/users/:id",       handlers.AdminUpdateUser)
		api.DELETE("/users/:id",      handlers.AdminDeleteUser)
		api.POST("/users/:id/ban",    handlers.AdminBanUser)
		api.POST("/users/:id/unban",  handlers.AdminUnbanUser)
		api.POST("/users/:id/verify", handlers.AdminVerifyUser)

		// ── Buyer Management ──────────────────────────────────────────────────
		api.PATCH("/buyers/:id", handlers.AdminUpdateBuyer)

		// ── Brand Management ──────────────────────────────────────────────────
		api.GET("/brands",                            handlers.AdminListBrands)
		api.GET("/brands/:id",                        handlers.AdminGetBrand)
		api.PATCH("/brands/:id",                      handlers.AdminUpdateBrand)
		api.PATCH("/brands/:id/verification",         handlers.AdminUpdateBrandVerification)
		api.PATCH("/brands/:id/subscription",         handlers.AdminUpdateBrandSubscription)
		api.PATCH("/brands/:id/commission",           handlers.AdminUpdateBrandCommission)
		api.DELETE("/brands/:id",                     handlers.AdminDeleteBrand)
		api.POST("/brands/:id/approve",               handlers.AdminApproveBrand)
		api.POST("/brands/:id/suspend",               handlers.AdminSuspendBrand)
		api.POST("/brands/:id/featured",              handlers.AdminToggleFeaturedBrand)
		
		// Brand-specific bank account (legacy - kept for backwards compatibility)
		api.GET("/brands/:id/bank-account",           handlers.AdminGetBrandBankAccount)
		api.POST("/brands/:id/verify-bank-account", handlers.AdminVerifyBrandBankAccount)  // ✅ Fixed

		// ── Product Management ────────────────────────────────────────────────
		api.GET("/products",        handlers.AdminListProducts)
		api.GET("/products/:id",    handlers.AdminGetProduct)
		api.POST("/products",       handlers.AdminCreateProduct)
		api.PATCH("/products/:id",  handlers.AdminUpdateProduct)
		api.DELETE("/products/:id", handlers.AdminDeleteProduct)

		// ── Order Management ──────────────────────────────────────────────────
		api.POST("/orders",                     handlers.AdminCreateOrder)
		api.GET("/orders",                      handlers.AdminListOrders)
		api.GET("/orders/:id",                  handlers.AdminGetOrder)
		api.PATCH("/orders/:id",                handlers.AdminUpdateOrder)
		api.DELETE("/orders/:id",               handlers.AdminDeleteOrder)
		api.POST("/orders/:id/confirm-payment", handlers.AdminConfirmPayment)
		api.POST("/orders/:id/reject-payment",  handlers.AdminRejectPayment)
		
		// Order Payout Management
		api.GET("/orders/:id/payout-info",      handlers.AdminGetOrderPayoutInfo)
		api.POST("/orders/:id/initiate-payout", handlers.AdminInitiatePayout)

		// ── Payout Management ─────────────────────────────────────────────────
		api.GET("/payouts",                handlers.AdminListPayouts)
		api.GET("/payouts/:id",            handlers.AdminGetPayout)
		api.PATCH("/payouts/:id/complete", handlers.AdminCompletePayout)

// ── Bank Account Management ───────────────────────────────────────────────
api.GET("/bank-accounts",               handlers.AdminListBankAccounts)
api.GET("/bank-accounts/:id",           handlers.AdminGetBankAccountByID)
api.PATCH("/bank-accounts/:id",         handlers.AdminUpdateBankAccount)
api.DELETE("/bank-accounts/:id",        handlers.AdminDeleteBankAccount)
api.POST("/bank-accounts/:id/verify",   handlers.AdminVerifyBankAccountByID)  // ✅ Fixed
api.POST("/bank-accounts/:id/unverify", handlers.AdminUnverifyBankAccount)

		// ── Drop Management ───────────────────────────────────────────────────
		api.GET("/drops",        handlers.AdminListDrops)
		api.GET("/drops/:id",    handlers.AdminGetDrop)
		api.POST("/drops",       handlers.AdminCreateDrop)
		api.PATCH("/drops/:id",  handlers.AdminUpdateDrop)
		api.DELETE("/drops/:id", handlers.AdminDeleteDrop)

		// ── Category Management (Product Categories) ──────────────────────────
		api.GET("/categories",        handlers.AdminListCategories)
		api.POST("/categories",       handlers.AdminCreateCategory)
		api.PATCH("/categories/:id",  handlers.AdminUpdateCategory)
		api.DELETE("/categories/:id", handlers.AdminDeleteCategory)

		// ── Review Management ─────────────────────────────────────────────────
		api.GET("/reviews",                            handlers.AdminListReviews)
		api.GET("/reviews/:id",                        handlers.AdminGetReview)
		api.DELETE("/reviews/:id",                     handlers.AdminDeleteReview)
		api.POST("/reviews/:id/flag",                  handlers.AdminFlagReview)
		api.GET("/reviews/:id/comments",               handlers.AdminListReviewComments)
		api.POST("/reviews/:id/comments",              handlers.AdminAddReviewComment)
		api.DELETE("/reviews/:id/comments/:commentId", handlers.AdminDeleteReviewComment)

		// ── Notification Management ───────────────────────────────────────────
		api.GET("/notifications",        handlers.AdminListNotifications)
		api.POST("/notifications",       handlers.AdminSendNotification)
		api.DELETE("/notifications/:id", handlers.AdminDeleteNotification)

		// ── Subscription Management ───────────────────────────────────────────
		// Brand subscriptions
		api.GET("/subscriptions",       handlers.AdminListSubscriptions)
		api.PATCH("/subscriptions/:id", handlers.AdminUpdateSubscription)

		// Subscription plan definitions
		api.GET("/subscription-plans",        handlers.AdminListSubscriptionPlans)
		api.POST("/subscription-plans",       handlers.AdminCreateSubscriptionPlan)
		api.GET("/subscription-plans/:id",    handlers.AdminGetSubscriptionPlan)
		api.PUT("/subscription-plans/:id",    handlers.AdminUpdateSubscriptionPlan)
		api.DELETE("/subscription-plans/:id", handlers.AdminDeleteSubscriptionPlan)

		// ── Newsletter Management ─────────────────────────────────────────────
		// Newsletter subscribers
		api.GET("/newsletter",        handlers.AdminListNewsletterSubscribers)
		api.DELETE("/newsletter/:id", handlers.AdminDeleteNewsletterSubscriber)
		api.PATCH("/newsletter/:id",  handlers.AdminUpdateNewsletterSubscriber)

		// Newsletter campaigns
		api.GET("/newsletters",           handlers.AdminListNewsletters)
		api.POST("/newsletters",          handlers.AdminCreateNewsletter)
		api.GET("/newsletters/:id",       handlers.AdminGetNewsletter)
		api.PATCH("/newsletters/:id",     handlers.AdminUpdateNewsletter)
		api.POST("/newsletters/:id/send", handlers.AdminSendNewsletter)
		api.DELETE("/newsletters/:id",    handlers.AdminDeleteNewsletter)

		// ── Address Management ────────────────────────────────────────────────
		api.GET("/addresses",        handlers.AdminListAddresses)
		api.POST("/addresses",       handlers.AdminCreateAddress)
		api.PATCH("/addresses/:id",  handlers.AdminUpdateAddress)
		api.DELETE("/addresses/:id", handlers.AdminDeleteAddress)

		// ── Site Pages Management ─────────────────────────────────────────────
		api.GET("/pages",         handlers.AdminListSitePages)
		api.GET("/pages/:slug",   handlers.AdminGetSitePage)
		api.PATCH("/pages/:slug", handlers.AdminUpdateSitePage)

		// ── Settings Management ───────────────────────────────────────────────
		api.GET("/settings",   handlers.AdminGetSettings)
		api.PATCH("/settings", handlers.AdminSaveSettings)

		// ── Privilege Management ──────────────────────────────────────────────
		// Role privileges
		api.GET("/privileges/roles",         handlers.AdminGetRolePrivileges)
		api.PATCH("/privileges/roles/:role", handlers.AdminSaveRolePrivileges)

		// User-specific privileges
		api.GET("/privileges/users/:id",   handlers.AdminGetUserPrivileges)
		api.PATCH("/privileges/users/:id", handlers.AdminSaveUserPrivileges)

		// ── Employee Management ───────────────────────────────────────────────
		api.GET("/employees",                handlers.AdminListEmployees)
		api.POST("/employees",               handlers.AdminCreateEmployee)
		api.GET("/employees/:id",            handlers.AdminGetEmployee)
		api.PATCH("/employees/:id",          handlers.AdminUpdateEmployee)
		api.DELETE("/employees/:id",         handlers.AdminDeleteEmployee)
		api.POST("/employees/:id/suspend",   handlers.AdminSuspendEmployee)
		api.POST("/employees/:id/reinstate", handlers.AdminReinstateEmployee)
		api.GET("/employees/:id/referrals",  handlers.AdminGetEmployeeReferrals)

		// ── Partner Management ────────────────────────────────────────────────
		api.GET("/partners",        handlers.AdminListPartners)
		api.POST("/partners",       handlers.AdminCreatePartner)
		api.GET("/partners/:id",    handlers.AdminGetPartner)
		api.PATCH("/partners/:id",  handlers.AdminUpdatePartner)
		api.DELETE("/partners/:id", handlers.AdminDeletePartner)

		// ── Shipping Management ───────────────────────────────────────────────
		// Shipping zones
		api.GET("/shipping/zones",              handlers.AdminListShippingZones)
		api.POST("/shipping/zones",             handlers.AdminCreateShippingZone)
		api.PATCH("/shipping/zones/:id",        handlers.AdminUpdateShippingZone)
		api.DELETE("/shipping/zones/:id",       handlers.AdminDeleteShippingZone)

		// Shipping methods
		api.POST("/shipping/zones/:id/methods",  handlers.AdminCreateShippingMethod)
		api.PATCH("/shipping/methods/:id",       handlers.AdminUpdateShippingMethod)
		api.DELETE("/shipping/methods/:id",      handlers.AdminDeleteShippingMethod)
		api.POST("/shipping/methods/:id/toggle", handlers.AdminToggleShippingMethod)

		// Local shipping rates
		api.GET("/local-shipping",        handlers.AdminListLocalShippingRates)
		api.GET("/local-shipping/:id",    handlers.AdminGetLocalShippingRate)
		api.POST("/local-shipping",       handlers.AdminCreateLocalShippingRate)
		api.PATCH("/local-shipping/:id",  handlers.AdminUpdateLocalShippingRate)
		api.DELETE("/local-shipping/:id", handlers.AdminDeleteLocalShippingRate)

		// Pickup locations
		api.GET("/pickup-locations",        handlers.AdminListPickupLocations)
		api.POST("/pickup-locations",       handlers.AdminCreatePickupLocation)
		api.PATCH("/pickup-locations/:id",  handlers.AdminUpdatePickupLocation)
		api.DELETE("/pickup-locations/:id", handlers.AdminDeletePickupLocation)

		// ── Blog Management ───────────────────────────────────────────────────
		// Blog categories
		api.GET("/blog/categories",        handlers.AdminListBlogCategories)
		api.POST("/blog/categories",       handlers.AdminCreateBlogCategory)
		api.PATCH("/blog/categories/:id",  handlers.AdminUpdateBlogCategory)
		api.DELETE("/blog/categories/:id", handlers.AdminDeleteBlogCategory)

		// Blog posts
		api.GET("/blog/posts",          handlers.AdminListBlogPosts)
		api.POST("/blog/posts",         handlers.AdminCreateBlogPost)
		api.GET("/blog/posts/:id",      handlers.AdminGetBlogPost)
		api.PATCH("/blog/posts/:id",    handlers.AdminUpdateBlogPost)
		api.DELETE("/blog/posts/:id",   handlers.AdminDeleteBlogPost)

		// Blog comments
		api.GET("/blog/posts/:id/comments",               handlers.AdminListBlogComments)
		api.DELETE("/blog/posts/:id/comments/:commentId", handlers.AdminDeleteBlogComment)

		// ── Audit Log ─────────────────────────────────────────────────────────
		api.GET("/audit-logs", handlers.AdminGetAuditLogs)
		api.POST("/audit-logs/:id/restore", handlers.AdminRestoreAuditLog)

		// ── Danger Zone ───────────────────────────────────────────────────────
		api.POST("/danger/clear-sessions", handlers.AdminClearSessions)
		api.POST("/danger/flush-cache",    handlers.AdminFlushCache)
		api.GET("/danger/export",          handlers.AdminExportData)
	}
}