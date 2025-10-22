-- MySQL version of IT_CONF_OUTSES (Outlet Business Periods)
-- Updated to match frontend OutletBusinessPeriods.js form fields exactly
CREATE TABLE IF NOT EXISTS IT_CONF_OUTSES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Form fields - exact match with OutletBusinessPeriods.js frontend
    applicable_from DATE NOT NULL,               -- Applicable From date
    outlet_code VARCHAR(10) NOT NULL,            -- Outlet Code (links to IT_CONF_OUTSET)
    period_code VARCHAR(10) NOT NULL UNIQUE,     -- Period Code (unique identifier)
    period_name VARCHAR(50) NOT NULL,            -- Period Name
    short_name VARCHAR(20),                      -- Short Name
    start_time TIME NOT NULL,                    -- Start Time (HH:MM:SS)
    end_time TIME NOT NULL,                      -- End Time (HH:MM:SS)
    active_days JSON,                            -- Active Days (sunday, monday, etc.)
    is_active BOOLEAN DEFAULT TRUE,              -- Active status
    
    -- Relationships and indexes
    INDEX idx_outlet_code (outlet_code),
    INDEX idx_period_code (period_code),
    INDEX idx_applicable_from (applicable_from),
    INDEX idx_is_active (is_active),
    
    -- Foreign key constraint to outlet setup table
    FOREIGN KEY (outlet_code) REFERENCES IT_CONF_OUTSET(outlet_code) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
