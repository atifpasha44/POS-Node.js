-- ================================================
-- OUTLET BUSINESS PERIODS TABLE REBUILD SCRIPT
-- ================================================
-- This script rebuilds IT_CONF_OUTSES to match OutletBusinessPeriods.js frontend form fields exactly
-- Converts from localStorage to database-first architecture

-- 1. BACKUP AND DROP EXISTING TABLE
-- ================================================
DROP TABLE IF EXISTS IT_CONF_OUTSES_BACKUP;

-- Create backup of existing data (if any important data exists)
CREATE TABLE IT_CONF_OUTSES_BACKUP AS 
SELECT * FROM IT_CONF_OUTSES WHERE 1=1;

-- Drop the problematic table
DROP TABLE IF EXISTS IT_CONF_OUTSES;

-- 2. CREATE NEW TABLE WITH CORRECT SCHEMA  
-- ================================================
CREATE TABLE IT_CONF_OUTSES (
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

-- 3. NO SAMPLE DATA (AS REQUESTED)
-- ================================================
-- User requested to keep tables clean without sample data

-- 4. VERIFICATION QUERIES
-- ================================================
-- Verify table structure
DESCRIBE IT_CONF_OUTSES;

-- Verify empty table (clean state)
SELECT COUNT(*) as record_count FROM IT_CONF_OUTSES;

-- ================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT:
-- ================================================
-- ✅ Business periods will save to database properly  
-- ✅ All form fields will map correctly
-- ✅ Clean table with 0 records (no sample data)
-- ✅ Foreign key relationship with Outlet Setup
-- ✅ Business period data will persist after form refresh
-- ✅ Database-first architecture (no localStorage dependency)
-- ================================================