package handlers

import (
	"github.com/Alamin-Balogun/blvckmrkt/database"
	"github.com/Alamin-Balogun/blvckmrkt/models"
	"github.com/Alamin-Balogun/blvckmrkt/utils"
	"github.com/gin-gonic/gin"
)

// PublicDropProduct — one product row inside a public drop response
type PublicDropProduct struct {
	ProductID    uint    `json:"product_id"`
	Name         string  `json:"name"`
	Slug         string  `json:"slug"`
	Price        float64 `json:"price"`
	ComparePrice float64 `json:"compare_price,omitempty"`
	BrandID      uint    `json:"brand_id"`
	BrandName    string  `json:"brand_name"`
	PrimaryImage string  `json:"primary_image"`
	Status       string  `json:"status"` // "live" | "scheduled" | "ended"
	EndsAt       *string `json:"ends_at,omitempty"`
}

// ── GET /api/drops ────────────────────────────────────────────────────────────
// Public — no auth required.
// Returns all active drops whose brands are shop-eligible:
//   verification_status = 'verified'
//   subscription_status IN ('active', 'trial')
//
// Each drop includes its live/scheduled products with full product details.
// Ended products (status = 'ended') are excluded.
func GetPublicDrops(c *gin.Context) {
	// Fetch all drops that belong to eligible brands (joined via drop_products → products → brands)
	type DropRow struct {
		DropID   uint   `gorm:"column:drop_id"`
		DropName string `gorm:"column:drop_name"`
	}

	// Get distinct drop IDs from eligible brands
	var dropRows []DropRow
	database.DB.Raw(`
		SELECT DISTINCT d.id AS drop_id, d.name AS drop_name
		FROM drops d
		JOIN drop_products dp ON dp.drop_id = d.id
		JOIN products p       ON p.id       = dp.product_id
		JOIN brands b         ON b.id       = p.brand_id
		  AND b.deleted_at         IS NULL
		  AND b.verification_status = 'verified'
		  AND b.subscription_status IN ('active', 'trial')
		WHERE d.deleted_at  IS NULL
		  AND dp.status     != ?
		  AND p.status       = ?
		  AND p.deleted_at  IS NULL
	`, string(models.DropEnded), string(models.ProductActive)).Scan(&dropRows)

	if len(dropRows) == 0 {
		utils.OK(c, "Drops fetched", gin.H{"drops": []interface{}{}})
		return
	}

	// Collect all drop IDs
	dropIDs := make([]uint, len(dropRows))
	for i, r := range dropRows {
		dropIDs[i] = r.DropID
	}

	// Fetch full drop records
	var drops []models.Drop
	database.DB.Where("id IN ?", dropIDs).Order("created_at DESC").Find(&drops)

	// Fetch all drop_products for these drops (non-ended only)
	var dropProducts []models.DropProduct
	database.DB.
		Where("drop_id IN ? AND status != ?", dropIDs, models.DropEnded).
		Find(&dropProducts)

	// Collect product IDs
	productIDs := make([]uint, 0, len(dropProducts))
	for _, dp := range dropProducts {
		productIDs = append(productIDs, dp.ProductID)
	}

	// Fetch products + images
	var products []models.Product
	database.DB.Where("id IN ? AND status = ? AND deleted_at IS NULL", productIDs, models.ProductActive).
		Preload("Images").Find(&products)

	// Fetch brands
	brandIDSet := map[uint]bool{}
	for _, p := range products {
		brandIDSet[p.BrandID] = true
	}
	brandIDSlice := make([]uint, 0, len(brandIDSet))
	for id := range brandIDSet {
		brandIDSlice = append(brandIDSlice, id)
	}
	var brands []models.Brand
	database.DB.Where("id IN ?", brandIDSlice).Find(&brands)
	brandMap := map[uint]string{}
	for _, b := range brands {
		brandMap[b.ID] = b.BrandName
	}

	// Build product lookup
	type prodInfo struct {
		product      models.Product
		primaryImage string
	}
	prodLookup := map[uint]prodInfo{}
	for _, p := range products {
		img := ""
		for _, i := range p.Images {
			if i.Position == 0 {
				img = i.URL
				break
			}
		}
		if img == "" && len(p.Images) > 0 {
			img = p.Images[0].URL
		}
		prodLookup[p.ID] = prodInfo{product: p, primaryImage: img}
	}

	// Build drop_products lookup: dropID → []PublicDropProduct
	dpByDrop := map[uint][]PublicDropProduct{}
	for _, dp := range dropProducts {
		info, ok := prodLookup[dp.ProductID]
		if !ok {
			continue
		}
		p := info.product
        var endsAt *string
        if dp.EndsAt != nil {
        s := dp.EndsAt.Format("2006-01-02T15:04:05Z")
        endsAt = &s
    }

    // ✅ FIX HERE
    var status string
    if dp.Status != nil {
        status = string(*dp.Status)
    }

    dpByDrop[dp.DropID] = append(dpByDrop[dp.DropID], PublicDropProduct{
        ProductID:    p.ID,
        Name:         p.Name,
        Slug:         p.Slug,
        Price:        p.Price,
        ComparePrice: p.ComparePrice,
        BrandID:      p.BrandID,
        BrandName:    brandMap[p.BrandID],
        PrimaryImage: info.primaryImage,
        Status:       status,
        EndsAt:       endsAt,
    })
	}

	// Build response
	type DropResponse struct {
		ID       uint                `json:"id"`
		Name     string              `json:"name"`
		Products []PublicDropProduct `json:"products"`
	}
	resp := make([]DropResponse, 0, len(drops))
	for _, d := range drops {
		prods := dpByDrop[d.ID]
		if prods == nil {
			prods = []PublicDropProduct{}
		}
		resp = append(resp, DropResponse{
			ID:       d.ID,
			Name:     d.Name,
			Products: prods,
		})
	}

	utils.OK(c, "Drops fetched", gin.H{"drops": resp})
}