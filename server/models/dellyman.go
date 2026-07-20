// models/dellyman.go
package models

import "time"

// DellymanShipmentStatus tracks a courier booking through its lifecycle.
type DellymanShipmentStatus string

const (
	DellymanQuoted    DellymanShipmentStatus = "quoted"    // quote obtained, order not yet booked
	DellymanBooked    DellymanShipmentStatus = "booked"    // BookOrder succeeded, awaiting pickup
	DellymanPicked    DellymanShipmentStatus = "picked"    // rider picked up the package (in transit)
	DellymanDelivered DellymanShipmentStatus = "delivered"
	DellymanCancelled DellymanShipmentStatus = "cancelled"
	DellymanFailed    DellymanShipmentStatus = "failed" // booking attempt errored
)

// OrderDellymanDelivery is a per-brand snapshot of a Dellyman courier booking
// for an order. An order can span multiple brands, and each brand ships from
// its own pickup location, so there is one row per (order, brand) pair —
// unlike OrderPickup/OrderZoneDelivery/OrderLocalDelivery which are 1:1 with
// an order today.
type OrderDellymanDelivery struct {
	ID               uint      `gorm:"primaryKey;autoIncrement"                json:"id"`
	OrderID          uint      `gorm:"not null;index"                          json:"order_id"`
	BrandID          uint      `gorm:"not null;index"                          json:"brand_id"`
	PickupLocationID uint      `gorm:"not null"                                json:"pickup_location_id"`

	// Destination snapshot (buyer)
	DeliveryContactName  string `gorm:"type:varchar(200)"                      json:"delivery_contact_name"`
	DeliveryContactPhone string `gorm:"type:varchar(50)"                       json:"delivery_contact_phone"`
	DeliveryAddress      string `gorm:"type:varchar(500);not null"             json:"delivery_address"`
	DeliveryLandmark     string `gorm:"type:varchar(200)"                      json:"delivery_landmark,omitempty"`

	// Quote/booking snapshot
	CompanyID   uint    `gorm:"not null"                                      json:"company_id"`
	CompanyName string  `gorm:"type:varchar(150)"                             json:"company_name,omitempty"`
	Vehicle     string  `gorm:"type:varchar(100)"                             json:"vehicle,omitempty"`
	Price       float64 `gorm:"type:decimal(10,2);not null"                   json:"price"`
	Currency    string  `gorm:"type:varchar(10);default:'NGN'"                json:"currency"`

	// Dellyman identifiers
	OrderRef        string `gorm:"uniqueIndex;type:varchar(64);not null"      json:"order_ref"`
	DellymanOrderID string `gorm:"type:varchar(100);index"                    json:"dellyman_order_id,omitempty"`
	OrderCode       string `gorm:"type:varchar(100)"                          json:"order_code,omitempty"`
	TrackingID      string `gorm:"type:varchar(100);index"                    json:"tracking_id,omitempty"`

	Status      DellymanShipmentStatus `gorm:"type:varchar(20);default:'quoted';index" json:"status"`
	PickedUpAt  *time.Time             `                                               json:"picked_up_at,omitempty"`
	DeliveredAt *time.Time             `                                               json:"delivered_at,omitempty"`

	// Raw last booking/webhook response, kept for support/debugging only.
	RawResponse string `gorm:"type:text"                                      json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (OrderDellymanDelivery) TableName() string { return "order_dellyman_deliveries" }
