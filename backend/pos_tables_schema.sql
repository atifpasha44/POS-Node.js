-- ========================================
-- POS SYSTEM - COMPLETE DATABASE SCHEMA
-- ========================================
-- Created: October 16, 2025
-- Description: Complete table structure for POS system
-- Usage: Run this script to create all required tables

-- ========================================
-- 1. ITEM DEPARTMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_DEPARTMENTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_code VARCHAR(4) NOT NULL UNIQUE COMMENT 'Unique 4-character department code',
    name VARCHAR(20) NOT NULL COMMENT 'Department name',
    alternate_name VARCHAR(20) COMMENT 'Alternative department name',
    inactive BOOLEAN DEFAULT 0 COMMENT '0=Active, 1=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_department_code (department_code),
    INDEX idx_inactive (inactive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Item Departments Configuration';

-- ========================================
-- 2. ITEM CATEGORIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_CATEGORIES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(4) NOT NULL UNIQUE COMMENT 'Unique 4-character category code',
    name VARCHAR(20) NOT NULL COMMENT 'Category name',
    alternate_name VARCHAR(20) COMMENT 'Alternative category name',
    item_department_code VARCHAR(4) COMMENT 'Reference to department',
    item_department_name VARCHAR(20) COMMENT 'Department name for display',
    display_sequence INT COMMENT 'Display order sequence',
    inactive BOOLEAN DEFAULT 0 COMMENT '0=Active, 1=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_code (category_code),
    INDEX idx_department_code (item_department_code),
    INDEX idx_inactive (inactive),
    FOREIGN KEY (item_department_code) REFERENCES IT_CONF_ITEM_DEPARTMENTS(department_code) 
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Item Categories Configuration';

-- ========================================
-- 3. OUTLET SETUP TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_OUTSET (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicable_from DATE NOT NULL COMMENT 'Effective date',
    outlet_code VARCHAR(4) NOT NULL COMMENT 'Unique outlet code',
    outlet_name VARCHAR(30) NOT NULL COMMENT 'Outlet name',
    short_name VARCHAR(10) COMMENT 'Short outlet name',
    outlet_type ENUM('Restaurant','Bar','Both') DEFAULT 'Restaurant' COMMENT 'Type of outlet',
    bill_initial VARCHAR(2) COMMENT 'Bill number prefix',
    outlet_setting JSON COMMENT 'Outlet payment settings (cash, card, etc.)',
    options JSON COMMENT 'Outlet configuration options',
    inactive BOOLEAN DEFAULT 0 COMMENT '0=Active, 1=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_outlet_date (outlet_code, applicable_from),
    INDEX idx_outlet_code (outlet_code),
    INDEX idx_applicable_from (applicable_from),
    INDEX idx_inactive (inactive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Outlet Setup Configuration';

-- ========================================
-- 4. TAX CODES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_TAXCODE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tax_code VARCHAR(3) NOT NULL UNIQUE COMMENT 'Unique 3-character tax code',
    tax_name VARCHAR(25) NOT NULL COMMENT 'Tax name',
    tax_name_alternate VARCHAR(25) COMMENT 'Alternative tax name',
    tax_group_name VARCHAR(25) COMMENT 'Tax group classification',
    tax_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Tax percentage rate',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tax_code (tax_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tax Codes Configuration';

-- ========================================
-- 5. TAX STRUCTURE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_TAXSTRUCTURE (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tax_structure_code VARCHAR(6) NOT NULL UNIQUE COMMENT 'Unique tax structure code',
    tax_structure_name VARCHAR(30) NOT NULL COMMENT 'Tax structure name',
    outlet_code VARCHAR(4) COMMENT 'Associated outlet',
    menu_type VARCHAR(15) COMMENT 'Menu type classification',
    serial_number INT COMMENT 'Sequence number',
    short_tax VARCHAR(3) COMMENT 'Short tax reference',
    tax_code VARCHAR(3) COMMENT 'Tax code reference',
    calculation_type ENUM('Percentage','Amount') DEFAULT 'Percentage' COMMENT 'Tax calculation method',
    amount DECIMAL(15,3) DEFAULT 0 COMMENT 'Tax amount or percentage',
    target_tax INT DEFAULT 0 COMMENT 'Target tax reference',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tax_structure_code (tax_structure_code),
    INDEX idx_outlet_code (outlet_code),
    INDEX idx_tax_code (tax_code),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (outlet_code) REFERENCES IT_CONF_OUTSET(outlet_code) 
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (tax_code) REFERENCES IT_CONF_TAXCODE(tax_code) 
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tax Structure Configuration';

-- ========================================
-- 6. UNIT OF MEASUREMENT TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_UOM (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uom_code VARCHAR(8) NOT NULL UNIQUE COMMENT 'Unique UOM code',
    uom_name VARCHAR(20) NOT NULL COMMENT 'Unit name',
    container_unit VARCHAR(5) COMMENT 'Container unit type',
    container_size DECIMAL(18,4) COMMENT 'Container size',
    contained_unit VARCHAR(8) COMMENT 'Contained unit type',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uom_code (uom_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Unit of Measurement Configuration';

-- ========================================
-- 7. USER GROUPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_USER_GROUPS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_code VARCHAR(6) NOT NULL UNIQUE COMMENT 'Unique group code',
    group_name VARCHAR(20) NOT NULL COMMENT 'Group name',
    group_details VARCHAR(30) COMMENT 'Group description',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_group_code (group_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User Groups Configuration';

-- ========================================
-- 8. USER SETUP TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_USER_SETUP (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_code VARCHAR(6) NOT NULL UNIQUE COMMENT 'Unique user code',
    user_name VARCHAR(20) NOT NULL COMMENT 'User name',
    password VARCHAR(20) NOT NULL COMMENT 'User password',
    user_group VARCHAR(6) COMMENT 'User group reference',
    user_department VARCHAR(4) COMMENT 'User department',
    user_designation VARCHAR(6) COMMENT 'User designation',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_code (user_code),
    INDEX idx_user_group (user_group),
    INDEX idx_is_active (is_active),
    FOREIGN KEY (user_group) REFERENCES IT_CONF_USER_GROUPS(group_code) 
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='User Setup Configuration';

-- ========================================
-- 9. REASON CODES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_REASONS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reason_code VARCHAR(4) NOT NULL UNIQUE COMMENT 'Unique reason code',
    reason_name VARCHAR(20) NOT NULL COMMENT 'Reason name',
    reason_type ENUM('Discount','Void','Return','Complimentary') NOT NULL COMMENT 'Type of reason',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_reason_code (reason_code),
    INDEX idx_reason_type (reason_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Reason Codes Configuration';

-- ========================================
-- 10. CREDIT CARD MANAGER TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_CCM (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_code VARCHAR(4) NOT NULL UNIQUE COMMENT 'Unique card code',
    card_name VARCHAR(20) NOT NULL COMMENT 'Credit card name',
    commission_percentage DECIMAL(5,2) DEFAULT 0 COMMENT 'Commission percentage',
    settlement_days INT DEFAULT 0 COMMENT 'Settlement period in days',
    is_active BOOLEAN DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_card_code (card_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Credit Card Manager Configuration';

-- ========================================
-- 11. ITEM MASTER TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_MASTER (
    id INT AUTO_INCREMENT PRIMARY KEY,
    select_outlets JSON COMMENT 'Array of selected outlet codes',
    item_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Unique item code',
    item_name VARCHAR(50) NOT NULL COMMENT 'Item name',
    short_name VARCHAR(20) COMMENT 'Short item name',
    item_department VARCHAR(4) COMMENT 'Item department reference',
    applicable_from DATE NOT NULL COMMENT 'Effective date',
    inventory_code VARCHAR(20) COMMENT 'Inventory tracking code',
    alternate_name VARCHAR(50) COMMENT 'Alternative item name',
    tax_code VARCHAR(3) COMMENT 'Tax code reference',
    item_category VARCHAR(4) COMMENT 'Item category reference',
    item_price_1 DECIMAL(10,2) DEFAULT 0 COMMENT 'Price level 1',
    item_price_2 DECIMAL(10,2) DEFAULT 0 COMMENT 'Price level 2',
    item_price_3 DECIMAL(10,2) DEFAULT 0 COMMENT 'Price level 3',
    item_price_4 DECIMAL(10,2) DEFAULT 0 COMMENT 'Price level 4',
    item_printer_1 VARCHAR(20) COMMENT 'Primary printer assignment',
    item_printer_2 VARCHAR(20) COMMENT 'Secondary printer assignment',
    item_printer_3 VARCHAR(20) COMMENT 'Tertiary printer assignment',
    set_menu ENUM('Yes','No') DEFAULT 'No' COMMENT 'Is set menu item',
    item_modifier_group VARCHAR(20) COMMENT 'Modifier group assignment',
    unit VARCHAR(10) COMMENT 'Unit of measurement',
    print_group VARCHAR(20) COMMENT 'Print group assignment',
    cost DECIMAL(10,2) DEFAULT 0 COMMENT 'Item cost',
    in_active BOOLEAN DEFAULT 0 COMMENT '0=Active, 1=Inactive',
    item_logo VARCHAR(256) COMMENT 'Item image filename',
    item_logo_url VARCHAR(256) COMMENT 'Item image URL',
    created_by VARCHAR(64) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64) DEFAULT 'admin',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item_code (item_code),
    INDEX idx_item_department (item_department),
    INDEX idx_item_category (item_category),
    INDEX idx_tax_code (tax_code),
    INDEX idx_in_active (in_active),
    FOREIGN KEY (item_department) REFERENCES IT_CONF_ITEM_DEPARTMENTS(department_code) 
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (item_category) REFERENCES IT_CONF_ITEM_CATEGORIES(category_code) 
        ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (tax_code) REFERENCES IT_CONF_TAXCODE(tax_code) 
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Item Master Configuration';

-- ========================================
-- SAMPLE DATA INSERTION
-- ========================================

-- Sample Item Departments
INSERT IGNORE INTO IT_CONF_ITEM_DEPARTMENTS (department_code, name, alternate_name, created_by) VALUES
('FOOD', 'Food Items', 'Food', 'system'),
('BEVR', 'Beverages', 'Drinks', 'system'),
('DESS', 'Desserts', 'Sweets', 'system'),
('APPR', 'Appetizers', 'Starters', 'system');

-- Sample Item Categories
INSERT IGNORE INTO IT_CONF_ITEM_CATEGORIES (category_code, name, item_department_code, item_department_name, created_by) VALUES
('SOUP', 'Soups', 'FOOD', 'Food Items', 'system'),
('MAIN', 'Main Course', 'FOOD', 'Food Items', 'system'),
('SIDE', 'Side Dishes', 'FOOD', 'Food Items', 'system'),
('SOFT', 'Soft Drinks', 'BEVR', 'Beverages', 'system'),
('ALCO', 'Alcoholic', 'BEVR', 'Beverages', 'system'),
('CAKE', 'Cakes', 'DESS', 'Desserts', 'system'),
('SALA', 'Salads', 'APPR', 'Appetizers', 'system');

-- Sample Tax Codes
INSERT IGNORE INTO IT_CONF_TAXCODE (tax_code, tax_name, tax_percentage, created_by) VALUES
('VAT', 'VAT 5%', 5.00, 'system'),
('GST', 'GST 18%', 18.00, 'system'),
('SRV', 'Service Tax', 10.00, 'system');

-- Sample UOM
INSERT IGNORE INTO IT_CONF_UOM (uom_code, uom_name, created_by) VALUES
('PCS', 'Pieces', 'system'),
('KG', 'Kilograms', 'system'),
('LTR', 'Liters', 'system'),
('BOX', 'Boxes', 'system');

-- Sample Outlet Setup
INSERT IGNORE INTO IT_CONF_OUTSET (applicable_from, outlet_code, outlet_name, short_name, outlet_type, created_by) VALUES
('2025-01-01', 'ABCR', 'ABC Restaurant', 'Restaurant', 'Restaurant', 'system'),
('2025-01-01', 'ABAR', 'ABC Bar', 'Bar', 'Bar', 'system');

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Create additional composite indexes for common queries
CREATE INDEX idx_item_dept_category ON IT_CONF_ITEM_MASTER(item_department, item_category);
CREATE INDEX idx_outlet_date ON IT_CONF_OUTSET(outlet_code, applicable_from);
CREATE INDEX idx_category_dept ON IT_CONF_ITEM_CATEGORIES(item_department_code, category_code);

-- ========================================
-- VIEWS FOR EASIER QUERYING
-- ========================================

-- View for Item Master with related data
CREATE OR REPLACE VIEW v_item_master AS
SELECT 
    im.*,
    dept.name as department_name,
    cat.name as category_name,
    tc.tax_name,
    uom.uom_name as unit_name
FROM IT_CONF_ITEM_MASTER im
LEFT JOIN IT_CONF_ITEM_DEPARTMENTS dept ON im.item_department = dept.department_code
LEFT JOIN IT_CONF_ITEM_CATEGORIES cat ON im.item_category = cat.category_code
LEFT JOIN IT_CONF_TAXCODE tc ON im.tax_code = tc.tax_code
LEFT JOIN IT_CONF_UOM uom ON im.unit = uom.uom_code;

-- View for active items only
CREATE OR REPLACE VIEW v_active_items AS
SELECT * FROM v_item_master WHERE in_active = 0;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================
SELECT 'POS Database Schema Created Successfully!' as Status;
SELECT 'Tables Created: 11' as Tables_Count;
SELECT 'Sample Data Inserted' as Sample_Data;
SELECT 'Views Created: 2' as Views_Count;