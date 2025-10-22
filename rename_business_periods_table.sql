-- ================================================
-- RENAME OUTLET BUSINESS PERIODS TABLE
-- ================================================
-- Change table name from IT_CONF_OUTSES to IT_CONF_BUSINESS_PERIODS
-- to better match the form name "Outlet Business Periods"

-- 1. BACKUP EXISTING TABLE
-- ================================================
DROP TABLE IF EXISTS IT_CONF_OUTSES_OLD_BACKUP;
CREATE TABLE IT_CONF_OUTSES_OLD_BACKUP AS SELECT * FROM IT_CONF_OUTSES WHERE 1=1;

-- 2. CREATE NEW TABLE WITH BETTER NAME
-- ================================================
DROP TABLE IF EXISTS IT_CONF_BUSINESS_PERIODS;

CREATE TABLE IT_CONF_BUSINESS_PERIODS (
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

-- 3. MIGRATE DATA (IF ANY EXISTS)
-- ================================================
INSERT INTO IT_CONF_BUSINESS_PERIODS (
    applicable_from, outlet_code, period_code, period_name, short_name,
    start_time, end_time, active_days, is_active, created_at, updated_at
)
SELECT 
    applicable_from, outlet_code, period_code, period_name, short_name,
    start_time, end_time, active_days, is_active, created_at, updated_at
FROM IT_CONF_OUTSES
WHERE 1=1;

-- 4. DROP OLD TABLE
-- ================================================
DROP TABLE IT_CONF_OUTSES;

-- 5. VERIFICATION
-- ================================================
DESCRIBE IT_CONF_BUSINESS_PERIODS;
SELECT COUNT(*) as record_count FROM IT_CONF_BUSINESS_PERIODS;

-- ================================================
-- SUMMARY:
-- OLD TABLE: IT_CONF_OUTSES
-- NEW TABLE: IT_CONF_BUSINESS_PERIODS
-- 
-- This better matches the form name "Outlet Business Periods"
-- and makes the codebase more readable and maintainable.
-- ================================================