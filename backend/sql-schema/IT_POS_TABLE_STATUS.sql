-- Live table occupancy state (separate from IT_CONF_TBLMAS config)
CREATE TABLE IF NOT EXISTS IT_POS_TABLE_STATUS (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_date DECIMAL(8,0) NOT NULL,
  outlet_code VARCHAR(10) NOT NULL,
  table_code VARCHAR(10) NOT NULL,
  status ENUM('VACANT','OCCUPIED','RESERVED') NOT NULL DEFAULT 'VACANT',
  guest_count INT NOT NULL DEFAULT 0,
  opened_at DATETIME NULL,
  opened_by_user_code VARCHAR(10) NULL,
  check_id INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_business_table (business_date, outlet_code, table_code),
  INDEX idx_outlet_status (outlet_code, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
