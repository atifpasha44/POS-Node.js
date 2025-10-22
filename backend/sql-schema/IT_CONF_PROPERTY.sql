-- MySQL version of IT_CONF_PROPERTY (Property Code)
-- Updated to match frontend form fields exactly

CREATE TABLE IF NOT EXISTS IT_CONF_PROPERTY (
    -- Primary key and metadata
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Form fields - exact match with frontend PropertyCode.js initialState
    applicable_from DATE,
    property_code VARCHAR(32) NOT NULL UNIQUE,
    property_name VARCHAR(128) NOT NULL,
    nick_name VARCHAR(64),
    owner_name VARCHAR(128),
    address_name VARCHAR(256),
    gst_number VARCHAR(32),
    pan_number VARCHAR(32),
    group_name VARCHAR(64),
    local_currency VARCHAR(16) DEFAULT 'USD',
    currency_format VARCHAR(16) DEFAULT 'en-US',
    symbol VARCHAR(8) DEFAULT '$',
    decimal_places INT DEFAULT 2,
    date_format VARCHAR(16) DEFAULT 'MM/DD/YYYY',
    round_off VARCHAR(16) DEFAULT '0.01',
    property_logo VARCHAR(512),
    
    -- Indexes for performance
    INDEX idx_property_code (property_code),
    INDEX idx_applicable_from (applicable_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
