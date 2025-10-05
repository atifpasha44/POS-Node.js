-- IT_CONF_ITEM_CATEGORIES table for Item Categories management
-- This table stores item category information with relationships to item departments

CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_CATEGORIES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(4) NOT NULL UNIQUE COMMENT 'Unique 4-character category code',
    name VARCHAR(20) NOT NULL COMMENT 'Category name (max 20 characters)',
    alternate_name VARCHAR(20) COMMENT 'Optional alternate name for the category',
    item_department_code VARCHAR(4) NOT NULL COMMENT 'Department code this category belongs to',
    display_sequence INT COMMENT 'Display order sequence (lower number = higher priority)',
    inactive BOOLEAN DEFAULT 0 COMMENT 'Whether category is inactive (0=active, 1=inactive)',
    created_by VARCHAR(64) COMMENT 'User who created this record',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    modified_by VARCHAR(64) COMMENT 'User who last modified this record',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last modification timestamp',
    FOREIGN KEY (item_department_code) REFERENCES IT_CONF_ITEM_DEPARTMENTS(department_code) ON UPDATE CASCADE COMMENT 'Link to item departments table'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Item Categories configuration table';

-- Create indexes for better performance
CREATE INDEX idx_category_code ON IT_CONF_ITEM_CATEGORIES(category_code);
CREATE INDEX idx_department_code ON IT_CONF_ITEM_CATEGORIES(item_department_code);
CREATE INDEX idx_display_sequence ON IT_CONF_ITEM_CATEGORIES(display_sequence);
CREATE INDEX idx_inactive ON IT_CONF_ITEM_CATEGORIES(inactive);