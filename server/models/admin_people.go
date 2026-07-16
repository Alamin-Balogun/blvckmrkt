package models

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// ── ADMIN ─────────────────────────────────────────────────────────────────────

type Admin struct {
	ID          uint           `gorm:"primaryKey;autoIncrement"        json:"id"`
	DisplayID   string         `gorm:"type:varchar(16);uniqueIndex"    json:"display_id"`
	FirstName   string         `gorm:"type:varchar(100);not null"      json:"first_name"`
	LastName    string         `gorm:"type:varchar(100);not null"      json:"last_name"`
	Email       string         `gorm:"size:191;uniqueIndex"            json:"email"`
	Password    string         `gorm:"type:varchar(255);not null"      json:"-"`
	AvatarURL   string         `gorm:"type:varchar(500)"               json:"avatar_url,omitempty"`
	Status      string         `gorm:"type:enum('active','suspended');default:'active'" json:"status"`

	// 2FA
	OTPCode      string     `gorm:"type:varchar(255)"  json:"-"`
	OTPExpiresAt *time.Time `gorm:"default:null"       json:"-"`
	OTPVerified  bool       `gorm:"default:false"      json:"-"`

	// Session tracking
	LastLoginAt     *time.Time `gorm:"default:null"        json:"last_login_at,omitempty"`
	LastLoginIP     string     `gorm:"type:varchar(45)"    json:"last_login_ip,omitempty"`
	LastLoginDevice string     `gorm:"type:varchar(255)"   json:"last_login_device,omitempty"`

	// Password reset
	ResetToken        string     `gorm:"type:varchar(255)" json:"-"`
	ResetTokenExpires *time.Time `gorm:"default:null"      json:"-"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	var count int64
	tx.Model(&Admin{}).Unscoped().Count(&count)
	a.DisplayID = fmt.Sprintf("ADM-%03d", count+1)
	return nil
}

type AdminResponse struct {
	ID          uint       `json:"id"`
	DisplayID   string     `json:"display_id"`
	FirstName   string     `json:"first_name"`
	LastName    string     `json:"last_name"`
	Email       string     `json:"email"`
	AvatarURL   string     `json:"avatar_url,omitempty"`
	Status      string     `json:"status"`
	LastLoginAt *time.Time `json:"last_login_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (a *Admin) ToResponse() AdminResponse {
	return AdminResponse{
		ID:          a.ID,
		DisplayID:   a.DisplayID,
		FirstName:   a.FirstName,
		LastName:    a.LastName,
		Email:       a.Email,
		AvatarURL:   a.AvatarURL,
		Status:      a.Status,
		LastLoginAt: a.LastLoginAt,
		CreatedAt:   a.CreatedAt,
	}
}

// ── EMPLOYEE ──────────────────────────────────────────────────────────────────

type Employee struct {
	ID          uint           `gorm:"primaryKey;autoIncrement"       json:"id"`
	DisplayID   string         `gorm:"type:varchar(16);uniqueIndex"   json:"display_id"`
	FirstName   string         `gorm:"type:varchar(100);not null"     json:"first_name"`
	LastName    string         `gorm:"type:varchar(100);not null"     json:"last_name"`
	Email       string         `gorm:"size:191;uniqueIndex"           json:"email"`
	Password    string         `gorm:"type:varchar(255)"              json:"-"`
	Phone       string         `gorm:"type:varchar(30)"               json:"phone,omitempty"`
	Role        string         `gorm:"type:varchar(100);not null"     json:"role"`
	Permissions string         `gorm:"type:json"                      json:"permissions,omitempty"`
	Status      string         `gorm:"type:enum('active','invited','suspended');default:'invited'" json:"status"`
	InvitedBy   *uint          `gorm:"default:null"                   json:"invited_by,omitempty"`
	LastLoginAt *time.Time     `gorm:"default:null"                   json:"last_login_at,omitempty"`

	// Referral mechanics (null = no referral programme)
	ReferralCode    string     `gorm:"type:varchar(32);uniqueIndex"   json:"referral_code,omitempty"`
	CommissionType  string     `gorm:"type:enum('percentage','flat')" json:"commission_type,omitempty"`
	CommissionRate  float64    `gorm:"default:0.00"                   json:"commission_rate"`
	CookieDays      uint8      `gorm:"default:30"                     json:"cookie_days"`

	// Earnings (denormalised)
	TotalReferrals   uint    `gorm:"default:0"    json:"total_referrals"`
	TotalConversions uint    `gorm:"default:0"    json:"total_conversions"`
	TotalEarned      float64 `gorm:"default:0.00" json:"total_earned"`
	TotalPaidOut     float64 `gorm:"default:0.00" json:"total_paid_out"`
	PendingBalance   float64 `gorm:"default:0.00" json:"total_pending_balance"`

	// Payout
	PayoutMethod  string  `gorm:"type:enum('paystack','flutterwave','bank_transfer')" json:"payout_method,omitempty"`
	PayoutDetails string  `gorm:"type:json"                                          json:"payout_details,omitempty"`
	MinimumPayout float64 `gorm:"default:5000.00"                                    json:"minimum_payout"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (e *Employee) BeforeCreate(tx *gorm.DB) error {
	var count int64
	tx.Model(&Employee{}).Unscoped().Count(&count)
	e.DisplayID = fmt.Sprintf("EMP-%03d", count+1)
	return nil
}

type EmployeeResponse struct {
	ID               uint       `json:"id"`
	DisplayID        string     `json:"display_id"`
	FirstName        string     `json:"first_name"`
	LastName         string     `json:"last_name"`
	Email            string     `json:"email"`
	Phone            string     `json:"phone,omitempty"`
	Role             string     `json:"role"`
	Status           string     `json:"status"`
	ReferralCode     string     `json:"referral_code,omitempty"`
	CommissionType   string     `json:"commission_type,omitempty"`
	CommissionRate   float64    `json:"commission_rate"`
	TotalReferrals   uint       `json:"total_referrals"`
	TotalConversions uint       `json:"total_conversions"`
	TotalEarned      float64    `json:"total_earned"`
	PendingBalance   float64    `json:"pending_balance"`
	PayoutMethod     string     `json:"payout_method,omitempty"`
	MinimumPayout    float64    `json:"minimum_payout"`
	LastLoginAt      *time.Time `json:"last_login_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

func (e *Employee) ToResponse() EmployeeResponse {
	return EmployeeResponse{
		ID:               e.ID,
		DisplayID:        e.DisplayID,
		FirstName:        e.FirstName,
		LastName:         e.LastName,
		Email:            e.Email,
		Phone:            e.Phone,
		Role:             e.Role,
		Status:           e.Status,
		ReferralCode:     e.ReferralCode,
		CommissionType:   e.CommissionType,
		CommissionRate:   e.CommissionRate,
		TotalReferrals:   e.TotalReferrals,
		TotalConversions: e.TotalConversions,
		TotalEarned:      e.TotalEarned,
		PendingBalance:   e.PendingBalance,
		PayoutMethod:     e.PayoutMethod,
		MinimumPayout:    e.MinimumPayout,
		LastLoginAt:      e.LastLoginAt,
		CreatedAt:        e.CreatedAt,
	}
}

// ── EMPLOYEE REFERRAL LOG ─────────────────────────────────────────────────────

type EmployeeReferralLog struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	EmployeeID uint      `gorm:"not null;index"           json:"employee_id"`
	RefUserID  *uint     `gorm:"default:null"             json:"ref_user_id,omitempty"`
	RefOrderID *uint     `gorm:"default:null"             json:"ref_order_id,omitempty"`
	EventType  string    `gorm:"type:enum('click','signup','order');not null" json:"event_type"`
	OrderValue float64   `gorm:"default:0.00"             json:"order_value"`
	Commission float64   `gorm:"default:0.00"             json:"commission"`
	Status     string    `gorm:"type:enum('pending','approved','paid','rejected');default:'pending'" json:"status"`
	IPAddress  string    `gorm:"type:varchar(45)"         json:"ip_address,omitempty"`
	UserAgent  string    `gorm:"type:text"                json:"-"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ── PARTNER ───────────────────────────────────────────────────────────────────

type Partner struct {
	ID                uint           `gorm:"primaryKey;autoIncrement"       json:"id"`
	DisplayID         string         `gorm:"type:varchar(16);uniqueIndex"   json:"display_id"`
	CompanyName       string         `gorm:"type:varchar(255);not null"     json:"company_name"`
	ContactFirstName  string         `gorm:"type:varchar(100);not null"     json:"contact_first_name"`
	ContactLastName   string         `gorm:"type:varchar(100);not null"     json:"contact_last_name"`
	ContactEmail      string         `gorm:"size:191;uniqueIndex"           json:"contact_email"`
	ContactPhone      string         `gorm:"type:varchar(30)"               json:"contact_phone,omitempty"`
	Website           string         `gorm:"type:varchar(255)"              json:"website,omitempty"`
	Country           string         `gorm:"type:varchar(100)"              json:"country,omitempty"`
	Type              string         `gorm:"type:enum('investor','agency','technology','logistics','media','other');default:'other'" json:"type"`
	Stage             string         `gorm:"type:enum('prospect','active','inactive','terminated');default:'prospect'" json:"stage"`
	DealValue         *float64       `gorm:"default:null"                   json:"deal_value,omitempty"`
	EquityPct         *float64       `gorm:"default:null"                   json:"equity_pct,omitempty"`
	ContractStart     *time.Time     `gorm:"default:null"                   json:"contract_start,omitempty"`
	ContractEnd       *time.Time     `gorm:"default:null"                   json:"contract_end,omitempty"`
	ContractURL       string         `gorm:"type:varchar(500)"              json:"contract_url,omitempty"`
	LogoURL           string         `gorm:"type:varchar(500)"              json:"logo_url,omitempty"`
	Notes             string         `gorm:"type:text"                      json:"notes,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index"                          json:"-"`
}

func (p *Partner) BeforeCreate(tx *gorm.DB) error {
	var count int64
	tx.Model(&Partner{}).Unscoped().Count(&count)
	p.DisplayID = fmt.Sprintf("PTR-%03d", count+1)
	return nil
}

// ── ADMIN ACTIVITY LOG ────────────────────────────────────────────────────────

type AdminActivityLog struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	AdminID    uint      `gorm:"not null;index"           json:"admin_id"`
	AdminEmail string    `gorm:"size:191;index"           json:"admin_email"`
	EntityType string    `gorm:"type:varchar(50);index"   json:"entity_type"`
	EntityID   *uint     `gorm:"default:null"             json:"entity_id,omitempty"`
	Action     string    `gorm:"type:varchar(100);index"  json:"action"`
	Meta       string    `gorm:"type:json"                json:"meta,omitempty"`
	IPAddress  string    `gorm:"type:varchar(45)"         json:"ip_address,omitempty"`
	UserAgent  string    `gorm:"type:text"                json:"-"`
	CreatedAt  time.Time `gorm:"index"                    json:"created_at"`
}