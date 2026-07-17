package routes

import (
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/handlers"
	"github.com/Alamin-Balogun/blvckmrkt/middleware"
	"github.com/gin-gonic/gin"
)

func Register(r *gin.Engine) {
	api := r.Group("/api")

	// ── Health ─────────────────────────────────────────────────────────────────
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "blvckmrkt-api"})
	})

	// ── Webhooks ───────────────────────────────────────────────
        api.POST("/paystack/webhook", handlers.PaystackWebhook)
        api.POST("/flutterwave/webhook", handlers.FlutterwaveWebhook)

	// ── Image upload (any logged-in account) ───────────────────────────────────
	api.POST("/upload", middleware.Auth(), handlers.UploadImage)

	// ── Subscription Plans (public) ────────────────────────────────────────────
	api.GET("/subscription-plans", handlers.GetPublicSubscriptionPlans)

	// ── Auth (public) ──────────────────────────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/send-verification", handlers.SendVerification)
		auth.POST("/register",          handlers.Register)
		auth.POST("/login",             handlers.Login)
		auth.POST("/forgot-password",   handlers.ForgotPassword)
		auth.POST("/reset-password",    handlers.ResetPassword)

		protected := auth.Group("", middleware.Auth())
		{
			protected.GET("/me",               handlers.Me)
			protected.POST("/logout",          handlers.Logout)
			protected.PUT("/update-profile",   handlers.UpdateProfile)
			protected.POST("/change-password", handlers.ChangePassword)
		}
	}

	// ── Newsletter (public) ────────────────────────────────────────────────────
	newsletter := api.Group("/newsletter")
	{
		newsletter.POST("/subscribe",   handlers.NewsletterSubscribe)
		newsletter.POST("/unsubscribe", handlers.NewsletterUnsubscribe)
	}

	// ── Public brands page ─────────────────────────────────────────────────────
	api.GET("/brands", handlers.GetPublicBrands)
	api.GET("/brands/:slug", handlers.GetPublicBrandBySlug)

	// ── Public drops ───────────────────────────────────────────────────────────
	api.GET("/drops", handlers.GetPublicDrops)

	// ── Public blog ────────────────────────────────────────────────────────────
	blog := api.Group("/blog")
	{
		blog.GET("/categories",           handlers.GetBlogCategories)
		blog.GET("/posts",                handlers.ListBlogPosts)
		blog.GET("/posts/:slug",          handlers.GetBlogPost)
		blog.GET("/posts/:slug/comments", handlers.ListBlogComments)
	}

	// ── Shop (public — read-only) ───────────────────────────────────────────────
	shop := api.Group("/shop")
	{
		shop.GET("/showcase",                     handlers.GetShowcaseProducts)
		shop.GET("/products",                     handlers.ListProducts)
		shop.GET("/products/:id",                 handlers.GetProduct)
		shop.GET("/products/:id/reviews",         handlers.ShopListProductReviews)
		shop.GET("/brands",                       handlers.ListBrands)
		shop.GET("/brands/:brandId/shipping",     handlers.GetShopShipping)
		shop.GET("/categories",                   handlers.ListCategories)
		shop.GET("/counts",                       handlers.GetShopCounts)
	}

	// ── Site Pages (public CMS) ────────────────────────────────────────────────
	pages := api.Group("/pages")
	{
		pages.GET("/:slug", handlers.AdminGetSitePage)
	}

	// ── Cart, Wishlist, Reviews — all logged-in users ─────────────────────────
	userShop := api.Group("/user", middleware.Auth())
	{
		userShop.GET("/cart",                   handlers.GetCart)
		userShop.POST("/cart",                  handlers.AddToCart)
		userShop.PUT("/cart/:id",               handlers.UpdateCartItem)
		userShop.DELETE("/cart/:id",            handlers.RemoveFromCart)
		userShop.DELETE("/cart",                handlers.ClearCart)
		userShop.POST("/orders",                handlers.CreateOrder)

		// Hosted-checkout (redirect / new-tab) payment flow
		userShop.POST("/payments/flutterwave/initiate", handlers.InitiateFlutterwavePayment)
		userShop.POST("/payments/flutterwave/finalize", handlers.FinalizeFlutterwavePayment)
		userShop.POST("/payments/paystack/initiate",    handlers.InitiatePaystackPayment)
		userShop.POST("/payments/paystack/finalize",    handlers.FinalizePaystackPayment)
		userShop.GET("/payments/status",                handlers.GetPaymentIntentStatus)

		userShop.GET("/wishlist",               handlers.ListWishlist)
		userShop.POST("/wishlist",              handlers.AddToWishlist)
		userShop.DELETE("/wishlist/:productId", handlers.RemoveFromWishlist)

		userShop.GET("/reviews",                handlers.ListMyReviews)
		userShop.POST("/reviews",               handlers.CreateReview)
		userShop.PUT("/reviews/:id",            handlers.UpdateReview)
		userShop.DELETE("/reviews/:id",         handlers.DeleteReview)

		// Blog comments
		userShop.POST("/blog/:slug/comments",   handlers.CreateBlogComment)
		userShop.DELETE("/blog/comments/:id",   handlers.DeleteOwnBlogComment)
	}

	// ── Guest checkout (public, no account required) ────────────────────────────
	// Rate-limited since it's unauthenticated and can trigger real
	// payment-gateway verification calls.
	guest := api.Group("/guest", middleware.RateLimit(10, 10*time.Minute))
	{
		guest.POST("/orders", handlers.CreateGuestOrder)
	}

	// ── Buyer dashboard ─────────────────────────────────────────────────────────
	buyer := api.Group("/buyer", middleware.Auth(), middleware.RequireBuyer())
	{
		buyer.GET("/profile",          handlers.GetProfile)
		buyer.PUT("/profile",          handlers.UpdateProfile)
		buyer.POST("/change-password", handlers.ChangePassword)

		buyer.POST("/upgrade-to-brand", handlers.UpgradeToBrand)

		buyer.GET("/orders",             handlers.ListOrders)
		buyer.GET("/orders/:id",         handlers.GetOrder)
		buyer.POST("/orders/:id/cancel", handlers.CancelOrder)

		// Buyer <-> brand messaging
		buyer.GET("/messages",            handlers.BuyerListConversations)
		buyer.GET("/messages/:brandId",   handlers.BuyerGetThread)
		buyer.POST("/messages/:brandId",  handlers.BuyerSendMessage)

		buyer.GET("/addresses",               handlers.ListAddresses)
		buyer.POST("/addresses",              handlers.CreateAddress)
		buyer.PUT("/addresses/:id",           handlers.UpdateAddress)
		buyer.DELETE("/addresses/:id",        handlers.DeleteAddress)
		buyer.PATCH("/addresses/:id/default", handlers.SetDefaultAddress)

		buyer.GET("/notifications",           handlers.ListNotifications)
		buyer.PATCH("/notifications/:id/read", handlers.MarkNotificationRead)
		buyer.PATCH("/notifications/read-all", handlers.MarkAllNotificationsRead)
		buyer.DELETE("/notifications/:id",    handlers.BuyerDeleteNotification)

		// ✅ Buyer self-delete (archived to audit log, restorable by admin only)
		buyer.DELETE("/delete-account", handlers.BuyerDeleteOwnAccount)
		buyer.GET("/follows",             handlers.ListFollows)
		buyer.POST("/follows",            handlers.FollowBrand)
		buyer.DELETE("/follows/:brandId", handlers.UnfollowBrand)
	}

	// ── Subscription ────────────────────────────────────────────────────────────
	sub := api.Group("/subscription", middleware.Auth())
	{
		sub.POST("/verify-billing", handlers.VerifyBilling)
		sub.POST("/activate",       handlers.ActivateSubscription)
		sub.GET("/status",          handlers.GetSubscriptionStatus)
	}

	// ── Brand routes that don't require an active subscription ───────────────────
brandNoGuard := api.Group("/brand", middleware.Auth(), middleware.RequireBrand())
{
    brandNoGuard.POST("/partnership/sign", handlers.SignPartnershipAgreement)
    brandNoGuard.GET("/profile",           handlers.GetBrandProfile)
    brandNoGuard.PUT("/profile",           handlers.UpdateBrandProfile)
	brandNoGuard.DELETE("/delete-account", handlers.BrandDeleteOwnAccount)
}

	// ── Brand dashboard ─────────────────────────────────────────────────────────
	brand := api.Group("/brand", middleware.Auth(), middleware.RequireBrand(), middleware.SubscriptionGuard(),)
	{
		brand.GET("/platform-settings", handlers.BrandGetPlatformSettings)

		brand.GET("/overview", handlers.BrandOverview)

		brand.GET("/products",              handlers.BrandListProducts)
		brand.POST("/products",             handlers.BrandCreateProduct)
		brand.GET("/products/:id",          handlers.BrandGetProduct)
		brand.PUT("/products/:id",          handlers.BrandUpdateProduct)
		brand.PATCH("/products/:id/status", handlers.BrandUpdateProductStatus)
		brand.DELETE("/products/:id",       handlers.BrandDeleteProduct)

		brand.GET("/drop",                                handlers.BrandGetActiveDrop)
		brand.POST("/drop/products",                      handlers.BrandAddProductToDrop)
		brand.DELETE("/drop/:dropId/products/:productId", handlers.BrandRemoveProductFromDrop)

		brand.GET("/orders",              handlers.BrandListOrders)
		brand.GET("/orders/:id",          handlers.BrandGetOrder)
		brand.PATCH("/orders/:id/status", handlers.BrandUpdateOrderStatus)
		brand.GET("/my-orders",           handlers.BrandGetMyOrders)

		// Buyer <-> brand messaging
		brand.GET("/messages",           handlers.BrandListConversations)
		brand.GET("/messages/:buyerId",  handlers.BrandGetThread)
		brand.POST("/messages/:buyerId", handlers.BrandSendMessage)

		brand.GET("/analytics", handlers.BrandAnalytics)

		brand.GET("/wishlist",               handlers.BrandListWishlist)
		brand.POST("/wishlist",              middleware.PurchasesEnabled(), handlers.BrandAddToWishlist)
		brand.DELETE("/wishlist/:productId", handlers.BrandRemoveFromWishlist)

		brand.GET("/notifications",            handlers.BrandListNotifications)
		brand.PATCH("/notifications/:id/read", handlers.BrandMarkNotificationRead)
		brand.PATCH("/notifications/read-all", handlers.BrandMarkAllNotificationsRead)
		brand.DELETE("/notifications/:id",     handlers.BrandDeleteNotification)

		brand.GET("/addresses",               handlers.BrandListAddresses)
		brand.POST("/addresses",              handlers.BrandCreateAddress)
		brand.PUT("/addresses/:id",           handlers.BrandUpdateAddress)
		brand.DELETE("/addresses/:id",        handlers.BrandDeleteAddress)
		brand.PATCH("/addresses/:id/default", handlers.BrandSetDefaultAddress)

		// ✅ Brand Bank Account Management
		brand.GET("/bank-account",    handlers.BrandGetBankAccount)
		brand.POST("/bank-account",   handlers.BrandCreateBankAccount)
		brand.PATCH("/bank-account",  handlers.BrandUpdateBankAccount)

		shipping := brand.Group("/shipping")
		{
			shipping.GET("/zones",                  handlers.BrandListShippingZones)
			shipping.POST("/zones",                 handlers.BrandCreateShippingZone)
			shipping.PUT("/zones/:id",              handlers.BrandUpdateShippingZone)
			shipping.DELETE("/zones/:id",           handlers.BrandDeleteShippingZone)
			shipping.POST("/zones/:zoneId/methods", handlers.BrandCreateShippingMethod)
			shipping.PUT("/methods/:id",            handlers.BrandUpdateShippingMethod)
			shipping.DELETE("/methods/:id",         handlers.BrandDeleteShippingMethod)
			shipping.PATCH("/methods/:id/toggle",   handlers.BrandToggleShippingMethod)

			shipping.GET("/local",        handlers.BrandListLocalShippingRates)
			shipping.POST("/local",       handlers.BrandSaveLocalShippingRate)
			shipping.DELETE("/local/:id", handlers.BrandDeleteLocalShippingRate)
		}

		brand.GET("/pickup-locations",        handlers.BrandListPickupLocations)
		brand.POST("/pickup-locations",       handlers.BrandCreatePickupLocation)
		brand.PUT("/pickup-locations/:id",    handlers.BrandUpdatePickupLocation)
		brand.DELETE("/pickup-locations/:id", handlers.BrandDeletePickupLocation)
	}
}
