-- ================================================
-- OUTLET SETUP TABLE REBUILD SCRIPT
-- ================================================
-- This script rebuilds IT_CONF_OUTSET table to match the frontend form fields exactly
-- Fixes: Property codes not showing, field mapping issues, removes unnecessary sample data

-- 1. BACKUP AND DROP EXISTING TABLE
-- ================================================
DROP TABLE IF EXISTS IT_CONF_OUTSET_BACKUP;

-- Create backup of existing data (if any important data exists)
CREATE TABLE IT_CONF_OUTSET_BACKUP AS 
SELECT * FROM IT_CONF_OUTSET WHERE 1=1;

-- Drop the problematic table
DROP TABLE IF EXISTS IT_CONF_OUTSET;

-- 2. CREATE NEW TABLE WITH CORRECT SCHEMA
-- ================================================
CREATE TABLE IT_CONF_OUTSET (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Form fields - exact match with OutletSetup.js frontend
    property VARCHAR(32) NOT NULL,                    -- Property Code dropdown selection
    applicable_from DATE NOT NULL,                    -- Applicable From date
    outlet_code VARCHAR(10) NOT NULL UNIQUE,         -- Outlet Code (unique identifier)
    outlet_name VARCHAR(100) NOT NULL,               -- Outlet Name
    short_name VARCHAR(20),                          -- Short Name
    outlet_type VARCHAR(50) DEFAULT 'Restaurant',    -- Outlet Type dropdown
    item_price_level VARCHAR(50) DEFAULT 'Price 1', -- Item Price Level dropdown
    check_prefix VARCHAR(10),                        -- Check Prefix
    check_format VARCHAR(50),                        -- Check Format
    receipt_format VARCHAR(50),                      -- Receipt Format  
    kitchen_format VARCHAR(50),                      -- Kitchen Format
    inactive BOOLEAN DEFAULT FALSE,                  -- Inactive checkbox
    options JSON,                                    -- Options object (cash, card, etc.)
    
    -- Relationships
    INDEX idx_property (property),
    INDEX idx_outlet_code (outlet_code),
    INDEX idx_applicable_from (applicable_from),
    
    -- Foreign key constraint to property codes table
    FOREIGN KEY (property) REFERENCES IT_CONF_PROPERTY(property_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. INSERT SAMPLE DATA (MINIMAL - NO UNNECESSARY DATES)
-- ================================================
-- Note: Only add minimal sample data, user specifically requested to remove unnecessary sample data

-- Sample outlets linked to existing property codes (assuming they exist from property rebuild)
INSERT INTO IT_CONF_OUTSET (
    property,
    applicable_from,
    outlet_code,
    outlet_name,
    short_name,
    outlet_type,
    item_price_level,
    check_prefix,
    check_format,
    receipt_format,
    kitchen_format,
    inactive,
    options
) VALUES 
-- Main Restaurant for Hotel
('HOTEL001', '2025-01-01', 'REST001', 'Main Restaurant', 'Rest', 'Restaurant', 'Price 1', 'R', 'R001-####', 'Standard Receipt', 'Kitchen Copy', FALSE, 
 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', true, 'staff', false, 'bill_on_hold', true, 'credit', false, 'void', true)),

-- Bar for Hotel  
('HOTEL001', '2025-01-01', 'BAR001', 'Hotel Bar', 'Bar', 'Bar', 'Price 2', 'B', 'B001-####', 'Bar Receipt', 'Bar Kitchen', FALSE,
 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', true, 'staff', false, 'bill_on_hold', true, 'credit', true, 'void', true)),

-- Coffee Shop for Restaurant Property
('REST001', '2025-01-01', 'CAFE001', 'Coffee Corner', 'Cafe', 'Coffee Shop', 'Price 1', 'C', 'C001-####', 'Cafe Receipt', 'Cafe Kitchen', FALSE,
 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', false, 'staff', true, 'bill_on_hold', false, 'credit', false, 'void', true));

-- 4. VERIFICATION QUERIES
-- ================================================
-- Verify table structure
DESCRIBE IT_CONF_OUTSET;

-- Verify data
SELECT 
    property,
    outlet_code,
    outlet_name,
    outlet_type,
    inactive
FROM IT_CONF_OUTSET;

-- Verify property relationship
SELECT 
    o.outlet_code,
    o.outlet_name,
    o.property,
    p.property_name
FROM IT_CONF_OUTSET o
LEFT JOIN IT_CONF_PROPERTY p ON o.property = p.property_code;

-- ================================================
-- EXPECTED RESULTS AFTER RUNNING THIS SCRIPT:
-- ================================================
-- ✅ Property codes will show in OutletSetup dropdown
-- ✅ All form fields will save properly  
-- ✅ No unnecessary sample data
-- ✅ Clean table structure matching frontend exactly
-- ✅ Foreign key relationship with Property table
-- ✅ Outlet data will persist after form refresh
-- ================================================