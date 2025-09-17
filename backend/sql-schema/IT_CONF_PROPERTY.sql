-- MySQL version of IT_CONF_PROPERTY (Property Code)
CREATE TABLE IF NOT EXISTS IT_CONF_PROPERTY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicable_from DATE,
    property_code VARCHAR(32) NOT NULL UNIQUE,
    property_name VARCHAR(128) NOT NULL,
    nick_name VARCHAR(64),
    owner_name VARCHAR(128),
    address_name VARCHAR(256),
    gst_number VARCHAR(32),
    pan_number VARCHAR(32),
    group_name VARCHAR(64),
    local_currency VARCHAR(16),
    currency_format VARCHAR(16),
    symbol VARCHAR(8),
    decimal_places INT DEFAULT 2,
    date_format VARCHAR(16),
    round_off VARCHAR(16),
    property_logo VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
