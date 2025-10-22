-- MySQL version of IT_CONF_OUTSET (Outlet Setup)
-- Updated to match frontend OutletSetup.js form fields exactly
CREATE TABLE IF NOT EXISTS IT_CONF_OUTSET (
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
