-- Property Code Records Restoration Script
-- Run this SQL script to restore the missing property records

USE pos_db;

-- Clear existing data if any (optional - remove this line if you want to keep existing data)
-- DELETE FROM IT_CONF_PROPERTY WHERE property_code IN ('HOTEL001', 'REST001', 'CAFE001');

-- Insert Property Code Records
INSERT INTO IT_CONF_PROPERTY 
(applicable_from, property_code, property_name, nick_name, owner_name, address_name, 
 gst_number, pan_number, group_name, local_currency, currency_format, symbol, 
 decimal_places, date_format, round_off, property_logo) 
VALUES 
-- Hotel Property
('2024-01-01', 'HOTEL001', 'ABC Hotel', 'ABC Hotel', 'Hotel Owner', '123 Main Street, City', 
 'GST123456789', 'ABCDE1234F', 'Hotel Group', 'USD', 'en-US', '$', 
 2, 'MM/DD/YYYY', '0.01', ''),

-- Restaurant Property
('2024-02-01', 'REST001', 'Downtown Restaurant', 'Downtown Restaurant', 'Restaurant Owner', '456 Food Street, Downtown', 
 'GST987654321', 'FGHIJ5678K', 'Restaurant Group', 'USD', 'en-US', '$', 
 2, 'MM/DD/YYYY', '0.01', ''),

-- Cafe Property
('2024-03-01', 'CAFE001', 'City Cafe', 'City Cafe', 'Cafe Owner', '789 Coffee Lane, City Center', 
 'GST456789123', 'KLMNO9012P', 'Cafe Group', 'USD', 'en-US', '$', 
 2, 'MM/DD/YYYY', '0.01', '');

-- Verify the insertion
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

-- Expected result: 3 records (HOTEL001, REST001, CAFE001)