package database

import (
	"fmt"
	"log"
	"time"

	"github.com/Alamin-Balogun/blvckmrkt/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Seed inserts test data only when the table is empty.
// Call Seed(DB) once after Migrate() in main.go — safe to re-run.
func Seed(db *gorm.DB) {
	log.Println("[seed] checking seed data...")

	// ── 1. Users ──────────────────────────────────────────────────────────────
	var userCount int64
	db.Model(&models.User{}).Count(&userCount)
	if userCount > 0 {
		log.Println("[seed] data already present, skipping")
		// Still seed admin even if other data exists — fully idempotent
		seedAdmin(db)
		return
	}

	hash := func(pw string) string {
		b, _ := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		return string(b)
	}

	buyer1 := models.User{
		FirstName:   "Alamin",
		LastName:    "Balogun",
		Email:       "buyer@blvckmrkt.com",
		Password:    hash("password123"),
		AccountType: models.AccountUser,
		AvatarURL:   "https://i.pravatar.cc/150?img=11",
	}
	db.Create(&buyer1)

	brand1User := models.User{FirstName: "James", LastName: "Jebbia", Email: "supreme@blvckmrkt.com", Password: hash("password123"), AccountType: models.AccountBrand}
	db.Create(&brand1User)
	brand2User := models.User{FirstName: "Clint", LastName: "Ogbenna", Email: "corteiz@blvckmrkt.com", Password: hash("password123"), AccountType: models.AccountBrand}
	db.Create(&brand2User)
	brand3User := models.User{FirstName: "Lev", LastName: "Tanju", Email: "palace@blvckmrkt.com", Password: hash("password123"), AccountType: models.AccountBrand}
	db.Create(&brand3User)

	log.Println("[seed] users created")

	// ── 2. Buyer profile ──────────────────────────────────────────────────────
	buyerProfile := models.Buyer{UserID: buyer1.ID, Phone: "+44 7700 900123"}
	db.Create(&buyerProfile)

	// ── 3. Brands ─────────────────────────────────────────────────────────────
	now := time.Now()
	periodEnd1 := now.AddDate(0, 1, 0) // 1 month from now
	periodEnd2 := now.AddDate(0, 1, 0)
	periodEnd3 := now.AddDate(0, 1, 0)
	
	// ✅ Changed from enum to string values for subscription_plan
	brand1 := models.Brand{
		UserID:              brand1User.ID, 
		BrandName:           "Supreme", 
		Slug:                "supreme", 
		Description:         "New York streetwear institution since 1994.", 
		LogoURL:             "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Supreme_logo.svg/400px-Supreme_logo.svg.png", 
		Phone:               "08086048944",
		VerificationStatus:  models.VerificationVerified,
		SubscriptionPlan:    "mrkt_pro",            // ✅ String instead of enum
		SubscriptionStatus:  models.SubStatusActive, 
		SubscriptionBilling: "monthly",
		CurrentPeriodEnd:    &periodEnd1,
	}
	db.Create(&brand1)
	
	brand2 := models.Brand{
		UserID:              brand2User.ID, 
		BrandName:           "Corteiz", 
		Slug:                "corteiz", 
		Description:         "Rules the world. Est. London.", 
		LogoURL:             "https://i.imgur.com/kX6HRLD.png", 
		VerificationStatus:  models.VerificationVerified,
		SubscriptionPlan:    "mrkt_pro",            // ✅ String instead of enum
		SubscriptionStatus:  models.SubStatusActive, 
		SubscriptionBilling: "monthly",
		CurrentPeriodEnd:    &periodEnd2,
	}
	db.Create(&brand2)
	
	brand3 := models.Brand{
		UserID:              brand3User.ID, 
		BrandName:           "Palace", 
		Slug:                "palace", 
		Description:         "London skateboarding and streetwear since 2009.", 
		LogoURL:             "https://i.imgur.com/OmDnFqE.png", 
		VerificationStatus:  models.VerificationVerified,
		SubscriptionPlan:    "blvck",               // ✅ String instead of enum
		SubscriptionStatus:  models.SubStatusActive, 
		SubscriptionBilling: "monthly",
		CurrentPeriodEnd:    &periodEnd3,
	}
	db.Create(&brand3)

	log.Println("[seed] brands created")

	// ── 4. Categories ─────────────────────────────────────────────────────────
	cats := []models.Category{
		{Name: "Hoodies & Sweatshirts", Slug: "hoodies",     SortOrder: 1, ImageURL: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80"},
		{Name: "T-Shirts",              Slug: "t-shirts",    SortOrder: 2, ImageURL: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"},
		{Name: "Jackets & Coats",       Slug: "jackets",     SortOrder: 3, ImageURL: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80"},
		{Name: "Trousers & Shorts",     Slug: "trousers",    SortOrder: 4, ImageURL: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80"},
		{Name: "Footwear",              Slug: "footwear",    SortOrder: 5, ImageURL: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"},
		{Name: "Accessories",           Slug: "accessories", SortOrder: 6, ImageURL: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80"},
	}
	db.Create(&cats)
	log.Println("[seed] categories created")

	// ── 5. Products ───────────────────────────────────────────────────────────
	type prodSeed struct {
		brandID    uint
		categoryID uint
		name       string
		slug       string
		desc       string
		price      float64
		img        string
		tag        string
		sizes      []string
		stocks     []int
	}

	hoodiesCatID  := cats[0].ID
	tshirtsCatID  := cats[1].ID
	jacketsCatID  := cats[2].ID
	footwearCatID := cats[4].ID
	accessCatID   := cats[5].ID

	seeds := []prodSeed{
		{brand1.ID, hoodiesCatID,  "Box Logo Crewneck",       "box-logo-crewneck",     "The iconic box logo crewneck sweatshirt.",           480, "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80", "Limited",  []string{"S","M","L","XL"},               []int{3,8,5,2}},
		{brand1.ID, tshirtsCatID,  "Supreme Tee White",       "supreme-tee-white",     "Classic Supreme box logo tee in white.",              48,  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80", "",         []string{"XS","S","M","L","XL","XXL"},    []int{10,20,25,18,12,5}},
		{brand1.ID, jacketsCatID,  "Cargo Jacket Olive",      "cargo-jacket-olive",    "Washed canvas cargo jacket with multiple pockets.",  398, "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80", "Sale",     []string{"S","M","L","XL"},               []int{2,4,3,1}},
		{brand2.ID, hoodiesCatID,  "Alcatraz Hoodie",         "alcatraz-hoodie",       "Corteiz Alcatraz zip-up hoodie.",                    185, "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80",   "New Drop", []string{"S","M","L","XL","XXL"},         []int{5,12,10,7,3}},
		{brand2.ID, jacketsCatID,  "Guerillaz Puffer",        "guerillaz-puffer",      "Bold oversized puffer jacket.",                      320, "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&q=80", "Hot",      []string{"S","M","L","XL"},               []int{4,6,5,3}},
		{brand2.ID, tshirtsCatID,  "Rules The World Tee",     "rules-the-world-tee",   "CRTZ Rules The World graphic tee.",                  65,  "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600&q=80", "",         []string{"XS","S","M","L","XL"},          []int{15,20,22,16,8}},
		{brand3.ID, hoodiesCatID,  "Tri-Ferg Hoodie Navy",    "tri-ferg-hoodie-navy",  "Palace tri-ferg logo hoodie in navy.",                210, "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=600&q=80", "",         []string{"S","M","L","XL"},               []int{6,10,9,4}},
		{brand3.ID, tshirtsCatID,  "Tri-Logo Tee",            "tri-logo-tee",          "Palace tri-logo tee in white.",                      95,  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80", "",         []string{"S","M","L","XL","XXL"},         []int{12,18,20,14,6}},
		{brand3.ID, footwearCatID, "Palace x Reebok Classic", "palace-reebok-classic", "Palace x Reebok Classic leather collab.",            180, "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80", "Collab",   []string{"UK7","UK8","UK9","UK10","UK11"}, []int{3,5,6,4,2}},
		{brand1.ID, accessCatID,   "Supreme 6-Panel Cap",     "supreme-6-panel-cap",   "Signature Supreme 6-panel camp cap.",                54,  "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80",   "",         []string{"One Size"},                     []int{20}},
		{brand2.ID, accessCatID,   "CRTZ Beanie",             "crtz-beanie",           "Corteiz knit beanie in black.",                      45,  "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80", "New Drop", []string{"One Size"},                     []int{15}},
		{brand3.ID, jacketsCatID,  "Palace Coach Jacket",     "palace-coach-jacket",   "Lightweight nylon coach jacket.",                    245, "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",   "",         []string{"S","M","L","XL"},               []int{4,7,6,3}},
	}

	var products []models.Product
	for _, s := range seeds {
		p := models.Product{
			BrandID: s.brandID,
			UserID: func() uint {
				if s.brandID == brand1.ID { return brand1User.ID }
				if s.brandID == brand2.ID { return brand2User.ID }
				return brand3User.ID
			}(),
			CategoryID:  &s.categoryID,
			Name:        s.name,
			Slug:        s.slug,
			Description: s.desc,
			Price:       s.price,
			Status:      models.ProductActive,
			IsFeatured:  s.tag == "New Drop" || s.tag == "Hot" || s.tag == "Limited",
			Tags:        s.tag,
		}
		db.Create(&p)
		db.Create(&models.ProductImage{ProductID: p.ID, URL: s.img, Position: 0})
		for i, sz := range s.sizes {
			db.Create(&models.ProductSize{ProductID: p.ID, Size: sz, Stock: s.stocks[i]})
		}
		products = append(products, p)
	}
	log.Println("[seed] products + images + sizes created")

	// ── 6. Buyer Addresses ────────────────────────────────────────────────────
	addr1 := models.Address{UserID: &buyer1.ID, Label: "Home", Line1: "14 Oxford Street", City: "London", State: "England", Postcode: "W1D 1AB", Country: "United Kingdom", IsDefault: true}
	addr2 := models.Address{UserID: &buyer1.ID, Label: "Work", Line1: "30 Shoreditch High St", Line2: "Floor 2", City: "London", State: "England", Postcode: "E1 6PQ", Country: "United Kingdom"}
	db.Create(&addr1)
	db.Create(&addr2)
	log.Println("[seed] addresses created")

	// ── 7. Wishlist ───────────────────────────────────────────────────────────
	for _, pid := range []uint{products[0].ID, products[3].ID, products[6].ID, products[8].ID} {
		db.Create(&models.WishlistItem{UserID: buyer1.ID, ProductID: pid})
	}
	log.Println("[seed] wishlist created")

	// ── 8. Cart ───────────────────────────────────────────────────────────────
	var sz1, sz2 models.ProductSize
	db.Where("product_id = ?", products[1].ID).First(&sz1)
	db.Where("product_id = ?", products[4].ID).First(&sz2)
	db.Create(&models.CartItem{UserID: buyer1.ID, ProductID: products[1].ID, ProductSizeID: &sz1.ID, Quantity: 1})
	db.Create(&models.CartItem{UserID: buyer1.ID, ProductID: products[4].ID, ProductSizeID: &sz2.ID, Quantity: 2})
	log.Println("[seed] cart created")

	// ── 9. Orders ─────────────────────────────────────────────────────────────
	addrID := addr1.ID

	order1 := models.Order{
		UserID:        &buyer1.ID,
		AddressID:     &addrID,
		Subtotal:      528,
		ShippingFee:   0,
		Total:         528,
		Status:        models.OrderDelivered,
		PaymentStatus: models.PaymentPaid,
		PaymentRef:    "pay_test_001",
	}
	db.Create(&order1)
	db.Create(&models.OrderItem{OrderID: order1.ID, ProductID: products[0].ID, BrandID: brand1.ID, ProductName: products[0].Name, Size: "L",        Quantity: 1, UnitPrice: 480, TotalPrice: 480, ImageURL: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80"})
	db.Create(&models.OrderItem{OrderID: order1.ID, ProductID: products[9].ID, BrandID: brand1.ID, ProductName: products[9].Name, Size: "One Size", Quantity: 1, UnitPrice: 54,  TotalPrice: 54,  ImageURL: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80"})

	order2 := models.Order{
		UserID:        &buyer1.ID,
		AddressID:     &addrID,
		Subtotal:      185,
		ShippingFee:   0,
		Total:         185,
		Status:        models.OrderShipped,
		PaymentStatus: models.PaymentPaid,
		PaymentRef:    "pay_test_002",
	}
	db.Create(&order2)
	db.Create(&models.OrderItem{OrderID: order2.ID, ProductID: products[3].ID, BrandID: brand2.ID, ProductName: products[3].Name, Size: "M", Quantity: 1, UnitPrice: 185, TotalPrice: 185, ImageURL: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80"})

	order3 := models.Order{
		UserID:        &buyer1.ID,
		AddressID:     &addrID,
		Subtotal:      210,
		ShippingFee:   5,
		Total:         215,
		Status:        models.OrderProcessing,
		PaymentStatus: models.PaymentPaid,
		PaymentRef:    "pay_test_003",
	}
	db.Create(&order3)
	db.Create(&models.OrderItem{OrderID: order3.ID, ProductID: products[6].ID, BrandID: brand3.ID, ProductName: products[6].Name, Size: "L", Quantity: 1, UnitPrice: 210, TotalPrice: 210, ImageURL: "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=600&q=80"})

	log.Println("[seed] orders + items created")

	// ── 10. Notifications ─────────────────────────────────────────────────────
	refID1    := order2.ID
	refID2    := order3.ID
	dropRefID := uint(1)
	notifs := []models.Notification{
		{UserID: buyer1.ID, Type: models.NotifOrder,  Title: "Order Shipped",        Body: fmt.Sprintf("Your order %s is on its way!", order2.DisplayID),                          IsRead: false, RefID: &refID1,    RefType: "order"},
		{UserID: buyer1.ID, Type: models.NotifOrder,  Title: "Order Processing",     Body: fmt.Sprintf("We've received your order %s and it's being prepared.", order3.DisplayID), IsRead: false, RefID: &refID2,    RefType: "order"},
		{UserID: buyer1.ID, Type: models.NotifDrop,   Title: "New Corteiz Drop",     Body: "Alcatraz Hoodie just dropped — limited stock available now.",                          IsRead: false, RefID: &dropRefID, RefType: "drop"},
		{UserID: buyer1.ID, Type: models.NotifDrop,   Title: "Supreme Restock",      Body: "Box Logo Crewneck back in select sizes.",                                               IsRead: true},
		{UserID: buyer1.ID, Type: models.NotifNews,   Title: "Palace SS26 Preview",  Body: "Early lookbook images are now live on the Palace brand page.",                         IsRead: true},
		{UserID: buyer1.ID, Type: models.NotifSystem, Title: "Welcome to BLVCKMRKT", Body: "Your account is all set. Start browsing the latest drops.",                            IsRead: true},
	}
	db.Create(&notifs)
	log.Println("[seed] notifications created")

	// ── 11. Brand Follows ─────────────────────────────────────────────────────
	db.Create(&[]models.BrandFollow{
		{UserID: buyer1.ID, BrandID: brand1.ID},
		{UserID: buyer1.ID, BrandID: brand2.ID},
		{UserID: buyer1.ID, BrandID: brand3.ID},
	})
	log.Println("[seed] brand follows created")

	// ── 12. Reviews ───────────────────────────────────────────────────────────
	orderIDRef := order1.ID
	db.Create(&models.Review{UserID: buyer1.ID, ProductID: products[0].ID, OrderID: &orderIDRef, Rating: 5, Title: "Absolutely fire", Body: "The quality on this crewneck is unreal. Heavy weight cotton, perfect fit."})
	db.Create(&models.Review{UserID: buyer1.ID, ProductID: products[9].ID, OrderID: &orderIDRef, Rating: 4, Title: "Clean cap",        Body: "Good quality 6-panel, runs slightly large."})
	log.Println("[seed] reviews created")

	log.Println("[seed] ✓ all seed data inserted successfully")
	log.Println("[seed] test login → email: buyer@blvckmrkt.com  password: password123")

	// ── 13. Admin ─────────────────────────────────────────────────────────────
	seedAdmin(db)
}

// seedAdmin creates the default admin account if one doesn't already exist.
// Extracted as its own function so it also runs when seed data is already
// present (the early-return path at the top of Seed calls it too).
func seedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.Admin{}).Count(&count)
	if count > 0 {
		return // admin already exists — nothing to do
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := models.Admin{
		FirstName: "Super",
		LastName:  "Admin",
		Email:     "admin@blvckmrkt.com",
		Password:  string(hash),
		Status:    "active",
	}
	db.Create(&admin)
	log.Println("[seed] ✓ admin account created")
	log.Println("[seed] admin login  → email: admin@blvckmrkt.com  password: admin123")
	log.Println("[seed] ⚠  change the admin password after your first login!")
}