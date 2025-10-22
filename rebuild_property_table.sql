-- Property Code Table Rebuild Script
-- This script will drop the existing table and recreate it with the correct schema
-- to match the frontend form fields exactly

USE pos_db;

-- Drop the existing table (this will remove all existing data)
DROP TABLE IF EXISTS IT_CONF_PROPERTY;

-- Recreate the table with the correct schema that matches the frontend form fields
CREATE TABLE IT_CONF_PROPERTY (
    -- Primary key and metadata
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Form fields - exact match with frontend PropertyCode.js
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

-- Insert sample data to verify the table structure
INSERT INTO IT_CONF_PROPERTY 
(applicable_from, property_code, property_name, nick_name, owner_name, address_name, 
 gst_number, pan_number, group_name, local_currency, currency_format, symbol, 
 decimal_places, date_format, round_off, property_logo) 
VALUES 
-- Sample Property 1
('2024-01-01', 'HOTEL001', 'ABC Hotel', 'ABC Hotel', 'Hotel Owner', '123 Main Street, City', 
 'GST123456789', 'ABCDE1234F', 'Hotel Group', 'USD', 'en-US', '$', 
 2, 'MM/DD/YYYY', '0.01', ''),

-- Sample Property 2  
('2024-02-01', 'REST001', 'Downtown Restaurant', 'Downtown Restaurant', 'Restaurant Owner', '456 Food Street, Downtown', 
 'GST987654321', 'FGHIJ5678K', 'Restaurant Group', 'USD', 'en-US', '$', 
 2, 'MM/DD/YYYY', '0.01', ''),

-- Sample Property 3
('2024-03-01', 'CAFE001', 'City Cafe', 'City Cafe', 'Cafe Owner', '789 Coffee Lane, City Center', 
 'GST456789123', 'KLMNO9012P', 'Cafe Group', 'USD', 'en-US', '$', 
 2, 'MM/DD/YYYY', '0.01', '');

-- Verify the table structure and data
SELECT 
    'Table Structure Check' as status,
    COUNT(*) as sample_records_inserted
FROM IT_CONF_PROPERTY;

-- Display all records to verify
SELECT 
    id,
    applicable_from,
    property_code,
    property_name,
    nick_name,
    owner_name,
    address_name,
    gst_number,
    pan_number,
    group_name,
    local_currency,
    currency_format,
    symbol,
    decimal_places,
    date_format,
    round_off,
    created_at
FROM IT_CONF_PROPERTY 
ORDER BY property_code;

-- Show table structure
DESCRIBE IT_CONF_PROPERTY;