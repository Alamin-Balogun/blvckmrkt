package main

import (
	"fmt"
	"log"
	"os"

	"github.com/Alamin-Balogun/blvckmrkt/config"
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/handlers"
	"github.com/Alamin-Balogun/blvckmrkt/middleware"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/routes"
	"github.com/gin-gonic/gin"
)

func init() {
	// Force Go to use the system DNS resolver on Windows.
	// Without this, Go's built-in DNS resolver fails to resolve
	// some external hosts (e.g. api.flutterwave.com) even when
	// the system network works fine.
	os.Setenv("GODEBUG", "netdns=cgo")
}

func main() {
	config.Load()

	// 1. Connect DB
	database.Connect()

	log.Println("[boot] DB connected:", database.DB != nil)

	// 2. MIGRATIONS
	if err := database.Migrate(
		// USERS & AUTH
		&models.User{},
		&models.Admin{},
		&models.Employee{},
		&models.EmployeeReferralLog{},
		&models.Partner{},
		&models.AdminActivityLog{},
		&models.Subscription{},
		&models.EmailVerification{},
		&models.BlacklistedToken{}, // ✅ ADD THIS - For logout token blacklisting

		// SHOP CORE
		&models.Brand{},
		&models.Buyer{},
		&models.Address{},
		&models.Category{},
		&models.Product{},
		&models.ProductImage{},
		&models.ProductSize{},
		&models.Review{},
		&models.BrandFollow{},

		// BLOG
		&models.BlogCategory{},
		&models.Blog{},
		&models.BlogComment{},

		// COMMUNITY
		&models.CommunityPost{},
		&models.CommunityComment{},
		&models.CommunityLike{},
		&models.CommunityReport{},

		// DROPS
		&models.Drop{},
		&models.DropProduct{},

		// CART & ORDERS
		&models.CartItem{},
		&models.WishlistItem{},
		&models.Order{},
		&models.OrderItem{},
		
		// ✅ ORDER DELIVERY DETAILS
		&models.OrderPickup{},
		&models.OrderZoneDelivery{},
		&models.OrderLocalDelivery{},
		
		// ✅ ORDER PAYMENT DETAILS
		&models.OrderPaymentTransfer{},
		&models.OrderPaymentGateway{},

		// ✅ HOSTED CHECKOUT PAYMENT INTENTS (redirect-based gateway flow)
		&models.PaymentIntent{},

		// CMS / SETTINGS
		&models.SitePage{},
		&models.AdminSetting{},
		&models.RolePrivilege{},
		&models.UserPrivilege{},

		// SHIPPING
		&models.ShippingZone{},
		&models.ShippingZoneLocation{},
		&models.ShippingMethod{},

		// PLATFORM SHIPPING HELPERS
		&models.LocalShippingRate{},
		&models.PickupLocation{},

		// NOTIFICATIONS
		&models.Notification{},

		// BUYER <-> BRAND MESSAGING
		&models.Message{},

		// SITE VISIT ANALYTICS
		&models.SiteVisit{},

		// ✅ SUBSCRIPTION PLANS
		&models.SubscriptionPlanConfig{},

		// ✅ NEWSLETTER
		&models.NewsletterSubscriber{},
		&models.Newsletter{},
		&models.NewsletterSend{},
		
		// ✅ BRAND PAYOUTS & BANK ACCOUNTS
		&models.BrandBankAccount{},
		&models.BrandPayout{},

		// ── AUDIT LOG
		&models.AuditLog{},
	); err != nil {
		log.Fatalf("[migration failed] %v", err)
	}

	log.Println("[boot] migrations completed successfully")

	// 3. SEED DATA
	database.Seed(database.DB)

	// 4. Background jobs
	go handlers.StartDropExpiryJob()
	go database.CleanupBlacklistedTokens() // ✅ ADD THIS - Cleanup expired tokens

	// 5. GIN SETUP
	if config.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
          
        r.GET("/", func(c *gin.Context) {
            c.JSON(200, gin.H{
                "message": "Backend Is Working",
          })
        })

	routes.Register(r)
	routes.RegisterAdmin(r)

	addr := fmt.Sprintf(":%s", config.App.Port)
	log.Printf("[server] running on http://localhost%s", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("[server] failed to start: %v", err)
	}
}
