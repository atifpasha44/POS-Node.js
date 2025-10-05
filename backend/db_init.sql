CREATE DATABASE IF NOT EXISTS pos_db;
USE pos_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  tin VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  profile_img VARCHAR(255)
);

INSERT INTO users (email, password, tin, name, profile_img) VALUES
('admin@pos.com', 'admin123', '123456789', 'Admin User', 'profile.png');

-- Item Master Configuration Table
CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_MASTER (
  id INT AUTO_INCREMENT PRIMARY KEY,
  select_outlets JSON,
  applicable_from DATE NOT NULL,
  item_code VARCHAR(20) NOT NULL UNIQUE,
  inventory_code VARCHAR(20),
  item_name VARCHAR(50) NOT NULL,
  short_name VARCHAR(20),
  alternate_name VARCHAR(100),
  tax_code VARCHAR(10),
  item_price_1 DECIMAL(10,2),
  item_price_2 DECIMAL(10,2),
  item_price_3 DECIMAL(10,2),
  item_price_4 DECIMAL(10,2),
  item_printer_1 VARCHAR(20),
  item_printer_2 VARCHAR(20),
  item_printer_3 VARCHAR(20),
  print_group VARCHAR(50),
  item_department VARCHAR(4) NOT NULL,
  item_category VARCHAR(10) NOT NULL,
  cost DECIMAL(10,2),
  unit VARCHAR(20),
  set_menu VARCHAR(50),
  item_modifier_group VARCHAR(50),
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  item_logo VARCHAR(255),
  created_by VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_by VARCHAR(50),
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_code (item_code),
  INDEX idx_item_department (item_department),
  INDEX idx_item_category (item_category),
  INDEX idx_status (status),
  FOREIGN KEY (item_department) REFERENCES IT_CONF_ITEM_DEPARTMENTS(department_code) ON UPDATE CASCADE,
  FOREIGN KEY (item_category) REFERENCES IT_CONF_ITEM_CATEGORIES(category_code) ON UPDATE CASCADE
);
