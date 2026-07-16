package models

import "time"

// AuditLog stores all deleted records from any table
type AuditLog struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Table      string    `gorm:"column:table_name;type:varchar(50);not null;index:idx_table_record" json:"table_name"`
	RecordID   int       `gorm:"column:record_id;not null;index:idx_table_record" json:"record_id"`
	RecordData string    `gorm:"column:record_data;type:json;not null" json:"record_data"`
	DeletedBy  *int      `gorm:"column:deleted_by;index:idx_deleted_by" json:"deleted_by,omitempty"`
	DeletedAt  time.Time `gorm:"column:deleted_at;default:CURRENT_TIMESTAMP;index:idx_deleted_at" json:"deleted_at"`
	Reason     *string   `gorm:"column:reason;type:varchar(255)" json:"reason,omitempty"`
	CanRestore bool      `gorm:"column:can_restore;default:true" json:"can_restore"`
	IPAddress  *string   `gorm:"column:ip_address;type:varchar(45)" json:"ip_address,omitempty"`
}

// TableName specifies the MySQL table name
func (AuditLog) TableName() string {
	return "audit_log"
}

// AuditLogResponse for frontend
type AuditLogResponse struct {
	ID         uint      `json:"id"`
	Table      string    `json:"table_name"`
	RecordID   int       `json:"record_id"`
	RecordData string    `json:"record_data"`
	DeletedBy  *int      `json:"deleted_by,omitempty"`
	DeletedAt  time.Time `json:"deleted_at"`
	Reason     *string   `json:"reason,omitempty"`
	CanRestore bool      `json:"can_restore"`
	IPAddress  *string   `json:"ip_address,omitempty"`
}

func (a *AuditLog) ToResponse() AuditLogResponse {
	return AuditLogResponse{
		ID:         a.ID,
		Table:      a.Table,
		RecordID:   a.RecordID,
		RecordData: a.RecordData,
		DeletedBy:  a.DeletedBy,
		DeletedAt:  a.DeletedAt,
		Reason:     a.Reason,
		CanRestore: a.CanRestore,
		IPAddress:  a.IPAddress,
	}
}
