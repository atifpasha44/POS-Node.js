// POS Backend Server
// Create company_info table and insert default data if not exists
const createCompanyInfoTableSQL = `CREATE TABLE IF NOT EXISTS company_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  licensed_name VARCHAR(255),
  legal_owner VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(255),
  subscription_start DATE,
  subscription_end DATE,
  property_code VARCHAR(255),
  db_name VARCHAR(255),
  no_of_outlets INT,
  tin VARCHAR(255),
  gstin VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  pos_version VARCHAR(32),
  subscription_expiry DATE
)`;

// Create IT_CONF_PROPERTY table
const createPropertyTableSQL = `CREATE TABLE IF NOT EXISTS IT_CONF_PROPERTY (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicable_from DATE,
    property_code VARCHAR(32) NOT NULL,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_property_date (property_code, applicable_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Create IT_CONF_ITEM_DEPARTMENTS table
const createItemDepartmentsTableSQL = `CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_DEPARTMENTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_code VARCHAR(4) NOT NULL UNIQUE,
    name VARCHAR(20) NOT NULL,
    alternate_name VARCHAR(20),
    inactive BOOLEAN DEFAULT 0,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Create IT_CONF_ITEM_CATEGORIES table
const createItemCategoriesTableSQL = `CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_CATEGORIES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_code VARCHAR(4) NOT NULL UNIQUE,
    name VARCHAR(20) NOT NULL,
    alternate_name VARCHAR(20),
    item_department_code VARCHAR(4) NOT NULL,
    display_sequence INT,
    inactive BOOLEAN DEFAULT 0,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_department_code) REFERENCES IT_CONF_ITEM_DEPARTMENTS(department_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Create IT_CONF_ITEM_SOLD table
const createItemSoldTableSQL = `CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_SOLD (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_code VARCHAR(32) NOT NULL,
    outlet_code VARCHAR(4) NOT NULL,
    item_code VARCHAR(32) NOT NULL,
    item_name VARCHAR(128) NOT NULL,
    item_sold ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
    reset_at_daily_close ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_property_outlet_item (property_code, outlet_code, item_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Create IT_CONF_ITEM_STOCK table
const createItemStockTableSQL = `CREATE TABLE IF NOT EXISTS IT_CONF_ITEM_STOCK (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_code VARCHAR(32) NOT NULL,
    outlet_code VARCHAR(4) NOT NULL,
    item_code VARCHAR(32) NOT NULL,
    item_name VARCHAR(128) NOT NULL,
    original_stock_count INT NOT NULL DEFAULT 0,
    current_stock_count INT NOT NULL DEFAULT 0,
    reset_stock_daily_close ENUM('Yes', 'No') NOT NULL DEFAULT 'No',
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_property_outlet_item_stock (property_code, outlet_code, item_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Create IT_CONF_MENU_RATE_UPDATES table
const createMenuRateUpdatesTableSQL = `CREATE TABLE IF NOT EXISTS IT_CONF_MENU_RATE_UPDATES (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_name VARCHAR(128) NOT NULL,
    outlet_name VARCHAR(128) NOT NULL,
    applicable_from DATE NOT NULL,
    price_level VARCHAR(64) NOT NULL,
    update_type ENUM('item_department', 'item_master') NOT NULL,
    from_department VARCHAR(64),
    to_department VARCHAR(64),
    from_item VARCHAR(64),
    to_item VARCHAR(64),
    calculation_type ENUM('percentage', 'amount') NOT NULL,
    rate_value DECIMAL(10,2) NOT NULL,
    operation ENUM('increase', 'decrease') NOT NULL,
    items_updated INT DEFAULT 0,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Place all code that uses 'db' after db is initialized
// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Express app configuration
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'pos_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'item-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Jaheed@9',
  database: 'ithoughts',
  port: 3307
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');

  // Now safe to use db for table creation and routes
  db.query(createCompanyInfoTableSQL, (err) => {
    if (err) console.error('Error creating company_info table:', err);
    // Insert default row if table is empty
    db.query('SELECT COUNT(*) as count FROM company_info', (err, results) => {
      if (err) return;
      if (results[0].count === 0) {
        db.query(`INSERT INTO company_info 
          (licensed_name, legal_owner, address, city, subscription_start, subscription_end, property_code, db_name, no_of_outlets, tin, gstin, phone, email, pos_version, subscription_expiry)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'ABC Hotels',
            'Mr Amitabh',
            'Moghulrajpuram',
            'Vijayawada - 520010',
            '2020-08-15',
            '2021-08-15',
            '',
            'ithoughts',
            0,
            '',
            '',
            '',
            '',
            '1.1.0',
            '2021-03-31'
          ]);
      }
    });
  });
  
  // Create property table
  db.query(createPropertyTableSQL, (err) => {
    if (err) console.error('Error creating IT_CONF_PROPERTY table:', err);
    
    // Migration: Update existing table structure to allow multiple property codes with different dates
    // Remove old unique constraint on property_code if it exists and add composite unique constraint
    db.query('SHOW INDEX FROM IT_CONF_PROPERTY WHERE Key_name = "property_code"', (err, results) => {
      if (err) {
        console.error('Error checking existing constraints:', err);
        return;
      }
      
      if (results.length > 0) {
        console.log('Removing old unique constraint on property_code...');
        db.query('ALTER TABLE IT_CONF_PROPERTY DROP INDEX property_code', (err) => {
          if (err) console.error('Error dropping old constraint:', err);
          else console.log('Old unique constraint removed successfully');
          
          // Add composite unique constraint if it doesn't exist
          db.query('SHOW INDEX FROM IT_CONF_PROPERTY WHERE Key_name = "unique_property_date"', (err, results) => {
            if (err) {
              console.error('Error checking composite constraint:', err);
              return;
            }
            
            if (results.length === 0) {
              console.log('Adding composite unique constraint...');
              db.query('ALTER TABLE IT_CONF_PROPERTY ADD UNIQUE KEY unique_property_date (property_code, applicable_from)', (err) => {
                if (err) console.error('Error adding composite constraint:', err);
                else console.log('Composite unique constraint added successfully');
              });
            }
          });
        });
      }
    });
  });

  // Create item departments table
  db.query(createItemDepartmentsTableSQL, (err) => {
    if (err) console.error('Error creating IT_CONF_ITEM_DEPARTMENTS table:', err);
    else console.log('IT_CONF_ITEM_DEPARTMENTS table created/verified successfully');
  });

  // Create item categories table
  db.query(createItemCategoriesTableSQL, (err) => {
    if (err) console.error('Error creating IT_CONF_ITEM_CATEGORIES table:', err);
    else console.log('IT_CONF_ITEM_CATEGORIES table created/verified successfully');
  });

  // Create item sold table
  db.query(createItemSoldTableSQL, (err) => {
    if (err) console.error('Error creating IT_CONF_ITEM_SOLD table:', err);
    else console.log('IT_CONF_ITEM_SOLD table created/verified successfully');
  });

  // Create item stock table
  db.query(createItemStockTableSQL, (err) => {
    if (err) console.error('Error creating IT_CONF_ITEM_STOCK table:', err);
    else console.log('IT_CONF_ITEM_STOCK table created/verified successfully');
  });

  // Create menu rate updates table
  db.query(createMenuRateUpdatesTableSQL, (err) => {
    if (err) console.error('Error creating IT_CONF_MENU_RATE_UPDATES table:', err);
    else console.log('IT_CONF_MENU_RATE_UPDATES table created/verified successfully');
  });

  // Logout endpoint to destroy session
  app.post('/api/logout', (req, res) => {
    console.log('Logout request received');
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ success: false, message: 'Session destroy failed' });
          }
          console.log('Session destroyed successfully');
          res.json({ success: true });
        });
      } else {
        console.log('No session to destroy');
        res.json({ success: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ success: false, message: 'Logout failed' });
    }
  });

  // Company Info API
  app.get('/api/company-info', (req, res) => {
    db.query('SELECT * FROM company_info LIMIT 1', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'No company info found' });
      }
      res.json({ success: true, ...results[0] });
    });
  });

  // Property Codes API endpoints
  // GET all property codes
  app.get('/api/property-codes', (req, res) => {
    console.log('Fetching all property codes...');
    db.query('SELECT id, applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal_places as `decimal`, date_format, round_off FROM IT_CONF_PROPERTY ORDER BY applicable_from DESC', (err, results) => {
      if (err) {
        console.error('DB error fetching property codes:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      console.log(`Found ${results.length} property codes`);
      res.json(results);
    });
  });

  // Debug endpoint to check existing property codes
  app.get('/api/debug/property-codes', (req, res) => {
    db.query('SELECT property_code, property_name FROM IT_CONF_PROPERTY', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ message: 'Existing property codes', data: results });
    });
  });

  // POST new property code
  app.post('/api/property-codes', (req, res) => {
    const { applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal, date_format, round_off } = req.body;
    
    // Check for duplicate property code with same applicable date
    console.log('Checking for duplicate property code and date:', property_code, applicable_from);
    db.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY WHERE property_code = ? AND applicable_from = ?', [property_code, applicable_from], (err, results) => {
      if (err) {
        console.error('DB error checking duplicate:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      console.log('Duplicate check result:', results[0]);
      if (results[0].count > 0) {
        console.log(`Property code '${property_code}' with date '${applicable_from}' already exists`);
        return res.status(400).json({ success: false, message: `Property Code '${property_code}' with the same Applicable From date already exists. Please use a different date.` });
      }
      
      // Insert new record
      db.query(`INSERT INTO IT_CONF_PROPERTY 
        (applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal_places, date_format, round_off) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal, date_format, round_off],
        (err, result) => {
          if (err) return res.status(500).json({ success: false, message: 'DB error' });
          res.json({ success: true, id: result.insertId, message: 'Property code created successfully' });
        }
      );
    });
  });

  // PUT update property code
  app.put('/api/property-codes/:id', (req, res) => {
    const { id } = req.params;
    const { applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal, date_format, round_off } = req.body;
    
    // Check for duplicate property code with same applicable date (excluding current record)
    db.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY WHERE property_code = ? AND applicable_from = ? AND id != ?', [property_code, applicable_from, id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (results[0].count > 0) {
        return res.status(400).json({ success: false, message: `Property Code '${property_code}' with the same Applicable From date already exists. Please use a different date.` });
      }
      
      // Update record
      db.query(`UPDATE IT_CONF_PROPERTY SET 
        applicable_from=?, property_code=?, property_name=?, nick_name=?, owner_name=?, address_name=?, gst_number=?, pan_number=?, group_name=?, local_currency=?, currency_format=?, symbol=?, decimal_places=?, date_format=?, round_off=? 
        WHERE id=?`,
        [applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal, date_format, round_off, id],
        (err, result) => {
          if (err) return res.status(500).json({ success: false, message: 'DB error' });
          if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Property code not found' });
          }
          res.json({ success: true, message: 'Property code updated successfully' });
        }
      );
    });
  });

  // DELETE property code
  app.delete('/api/property-codes/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM IT_CONF_PROPERTY WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Property code not found' });
      }
      res.json({ success: true, message: 'Property code deleted successfully' });
    });
  });

  // Item Departments API endpoints
  // GET all item departments
  app.get('/api/item-departments', (req, res) => {
    db.query('SELECT * FROM IT_CONF_ITEM_DEPARTMENTS ORDER BY department_code', (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // POST create new item department
  app.post('/api/item-departments', (req, res) => {
    const { department_code, name, alternate_name, inactive, created_by } = req.body;
    
    // Validation
    if (!department_code || department_code.length < 1 || department_code.length > 4) {
      return res.status(400).json({ success: false, message: 'Department Code must be 1-4 characters (alphanumeric allowed).' });
    }
    if (!name || name.length > 20) {
      return res.status(400).json({ success: false, message: 'Department Name cannot exceed 20 characters.' });
    }
    if (alternate_name && alternate_name.length > 20) {
      return res.status(400).json({ success: false, message: 'Alternate Name cannot exceed 20 characters.' });
    }
    
    const sql = 'INSERT INTO IT_CONF_ITEM_DEPARTMENTS (department_code, name, alternate_name, inactive, created_by) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [department_code, name, alternate_name || null, inactive || 0, created_by || 'admin'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Department Code already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, message: 'Item Department created successfully', id: result.insertId });
    });
  });

  // PUT update item department
  app.put('/api/item-departments/:id', (req, res) => {
    const { id } = req.params;
    const { department_code, name, alternate_name, inactive, modified_by } = req.body;
    
    // Validation
    if (!department_code || department_code.length < 1 || department_code.length > 4) {
      return res.status(400).json({ success: false, message: 'Department Code must be 1-4 characters (alphanumeric allowed).' });
    }
    if (!name || name.length > 20) {
      return res.status(400).json({ success: false, message: 'Department Name cannot exceed 20 characters.' });
    }
    if (alternate_name && alternate_name.length > 20) {
      return res.status(400).json({ success: false, message: 'Alternate Name cannot exceed 20 characters.' });
    }
    
    const sql = 'UPDATE IT_CONF_ITEM_DEPARTMENTS SET department_code = ?, name = ?, alternate_name = ?, inactive = ?, modified_by = ? WHERE id = ?';
    db.query(sql, [department_code, name, alternate_name || null, inactive || 0, modified_by || 'admin', id], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Department Code already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item Department not found' });
      }
      res.json({ success: true, message: 'Item Department updated successfully' });
    });
  });

  // DELETE item department
  app.delete('/api/item-departments/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM IT_CONF_ITEM_DEPARTMENTS WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item Department not found' });
      }
      res.json({ success: true, message: 'Item Department deleted successfully' });
    });
  });

  // Item Categories API endpoints
  // GET all item categories
  app.get('/api/item-categories', (req, res) => {
    const sql = `
      SELECT ic.*, id.name as item_department_name 
      FROM IT_CONF_ITEM_CATEGORIES ic 
      LEFT JOIN IT_CONF_ITEM_DEPARTMENTS id ON ic.item_department_code = id.department_code 
      ORDER BY ic.display_sequence ASC, ic.category_code ASC
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // POST create new item category
  app.post('/api/item-categories', (req, res) => {
    const { category_code, name, alternate_name, item_department_code, display_sequence, inactive, created_by } = req.body;
    
    // Validation
    if (!category_code || category_code.length !== 4) {
      return res.status(400).json({ success: false, message: 'Category Code must be exactly 4 characters.' });
    }
    if (!name || name.length > 20) {
      return res.status(400).json({ success: false, message: 'Category Name cannot exceed 20 characters.' });
    }
    if (alternate_name && alternate_name.length > 20) {
      return res.status(400).json({ success: false, message: 'Alternate Name cannot exceed 20 characters.' });
    }
    if (!item_department_code) {
      return res.status(400).json({ success: false, message: 'Item Department Code is required.' });
    }
    
    const sql = 'INSERT INTO IT_CONF_ITEM_CATEGORIES (category_code, name, alternate_name, item_department_code, display_sequence, inactive, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [category_code, name, alternate_name || null, item_department_code, display_sequence || null, inactive || 0, created_by || 'admin'], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Category Code already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, message: 'Item Category created successfully', id: result.insertId });
    });
  });

  // PUT update item category
  app.put('/api/item-categories/:id', (req, res) => {
    const { id } = req.params;
    const { category_code, name, alternate_name, item_department_code, display_sequence, inactive, modified_by } = req.body;
    
    // Validation
    if (!category_code || category_code.length !== 4) {
      return res.status(400).json({ success: false, message: 'Category Code must be exactly 4 characters.' });
    }
    if (!name || name.length > 20) {
      return res.status(400).json({ success: false, message: 'Category Name cannot exceed 20 characters.' });
    }
    if (alternate_name && alternate_name.length > 20) {
      return res.status(400).json({ success: false, message: 'Alternate Name cannot exceed 20 characters.' });
    }
    if (!item_department_code) {
      return res.status(400).json({ success: false, message: 'Item Department Code is required.' });
    }
    
    const sql = 'UPDATE IT_CONF_ITEM_CATEGORIES SET category_code = ?, name = ?, alternate_name = ?, item_department_code = ?, display_sequence = ?, inactive = ?, modified_by = ? WHERE id = ?';
    db.query(sql, [category_code, name, alternate_name || null, item_department_code, display_sequence || null, inactive || 0, modified_by || 'admin', id], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Category Code already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item Category not found' });
      }
      res.json({ success: true, message: 'Item Category updated successfully' });
    });
  });

  // DELETE item category
  app.delete('/api/item-categories/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM IT_CONF_ITEM_CATEGORIES WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item Category not found' });
      }
      res.json({ success: true, message: 'Item Category deleted successfully' });
    });
  });

  // Item Master API endpoints
  // GET all item master records
  app.get('/api/item-master', (req, res) => {
    const sql = `
      SELECT im.*, 
             id.name as item_department_name,
             ic.name as item_category_name
      FROM IT_CONF_ITEM_MASTER im 
      LEFT JOIN IT_CONF_ITEM_DEPARTMENTS id ON im.item_department = id.department_code 
      LEFT JOIN IT_CONF_ITEM_CATEGORIES ic ON im.item_category = ic.category_code
      ORDER BY im.item_code ASC
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // POST create new item master record
  app.post('/api/item-master', (req, res) => {
    const {
      select_outlets, applicable_from, item_code, inventory_code, item_name, short_name,
      alternate_name, tax_code, item_price_1, item_price_2, item_price_3, item_price_4,
      item_printer_1, item_printer_2, item_printer_3, print_group, item_department,
      item_category, cost, unit, set_menu, item_modifier_group, status, created_by
    } = req.body;
    
    // Validation
    if (!item_code || item_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item Code is required.' });
    }
    if (!item_name || item_name.length > 50) {
      return res.status(400).json({ success: false, message: 'Item Name cannot exceed 50 characters.' });
    }
    if (!applicable_from) {
      return res.status(400).json({ success: false, message: 'Applicable From date is required.' });
    }
    if (!item_department) {
      return res.status(400).json({ success: false, message: 'Item Department is required.' });
    }
    if (!item_category) {
      return res.status(400).json({ success: false, message: 'Item Category is required.' });
    }
    
    const sql = `INSERT INTO IT_CONF_ITEM_MASTER (
      select_outlets, applicable_from, item_code, inventory_code, item_name, short_name,
      alternate_name, tax_code, item_price_1, item_price_2, item_price_3, item_price_4,
      item_printer_1, item_printer_2, item_printer_3, print_group, item_department,
      item_category, cost, unit, set_menu, item_modifier_group, status, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [
      select_outlets || null, applicable_from, item_code, inventory_code || null,
      item_name, short_name || null, alternate_name || null, tax_code || null,
      item_price_1 || null, item_price_2 || null, item_price_3 || null, item_price_4 || null,
      item_printer_1 || null, item_printer_2 || null, item_printer_3 || null, print_group || null,
      item_department, item_category, cost || null, unit || null, set_menu || null,
      item_modifier_group || null, status || 'Active', created_by || 'admin'
    ];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Item Code already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, message: 'Item Master created successfully', id: result.insertId });
    });
  });

  // PUT update item master record
  app.put('/api/item-master/:id', (req, res) => {
    const { id } = req.params;
    const {
      select_outlets, applicable_from, item_code, inventory_code, item_name, short_name,
      alternate_name, tax_code, item_price_1, item_price_2, item_price_3, item_price_4,
      item_printer_1, item_printer_2, item_printer_3, print_group, item_department,
      item_category, cost, unit, set_menu, item_modifier_group, status, modified_by
    } = req.body;
    
    // Validation
    if (!item_code || item_code.trim() === '') {
      return res.status(400).json({ success: false, message: 'Item Code is required.' });
    }
    if (!item_name || item_name.length > 50) {
      return res.status(400).json({ success: false, message: 'Item Name cannot exceed 50 characters.' });
    }
    if (!applicable_from) {
      return res.status(400).json({ success: false, message: 'Applicable From date is required.' });
    }
    if (!item_department) {
      return res.status(400).json({ success: false, message: 'Item Department is required.' });
    }
    if (!item_category) {
      return res.status(400).json({ success: false, message: 'Item Category is required.' });
    }
    
    const sql = `UPDATE IT_CONF_ITEM_MASTER SET 
      select_outlets = ?, applicable_from = ?, item_code = ?, inventory_code = ?, item_name = ?, short_name = ?,
      alternate_name = ?, tax_code = ?, item_price_1 = ?, item_price_2 = ?, item_price_3 = ?, item_price_4 = ?,
      item_printer_1 = ?, item_printer_2 = ?, item_printer_3 = ?, print_group = ?, item_department = ?,
      item_category = ?, cost = ?, unit = ?, set_menu = ?, item_modifier_group = ?, status = ?, modified_by = ?
      WHERE id = ?`;
    
    const values = [
      select_outlets || null, applicable_from, item_code, inventory_code || null,
      item_name, short_name || null, alternate_name || null, tax_code || null,
      item_price_1 || null, item_price_2 || null, item_price_3 || null, item_price_4 || null,
      item_printer_1 || null, item_printer_2 || null, item_printer_3 || null, print_group || null,
      item_department, item_category, cost || null, unit || null, set_menu || null,
      item_modifier_group || null, status || 'Active', modified_by || 'admin', id
    ];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: 'Item Code already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item Master not found' });
      }
      res.json({ success: true, message: 'Item Master updated successfully' });
    });
  });

  // DELETE item master record
  app.delete('/api/item-master/:id', (req, res) => {
    const { id } = req.params;
    
    // First get the item to check if it has a logo file to delete
    db.query('SELECT item_logo FROM IT_CONF_ITEM_MASTER WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      
      const item = results[0];
      
      // Delete the record
      db.query('DELETE FROM IT_CONF_ITEM_MASTER WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error' });
        if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'Item Master not found' });
        }
        
        // Delete the logo file if it exists
        if (item && item.item_logo) {
          const filePath = path.join(__dirname, 'uploads', path.basename(item.item_logo));
          fs.unlink(filePath, (err) => {
            // Ignore file deletion errors, record is already deleted
            console.log('Logo file deletion:', err ? 'failed' : 'success');
          });
        }
        
        res.json({ success: true, message: 'Item Master deleted successfully' });
      });
    });
  });

  // File upload endpoint for item logos
  app.post('/api/upload-item-logo', upload.single('logo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      filename: req.file.filename
    });
  });

  // Master data API endpoints for Item Master form
  // GET outlets for multi-select dropdown
  app.get('/api/outlets', (req, res) => {
    const sql = 'SELECT outlet_code, outlet_name FROM IT_CONF_OUTSET ORDER BY outlet_name';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // GET tax codes for dropdown
  app.get('/api/tax-codes', (req, res) => {
    const sql = 'SELECT tax_code, tax_name FROM IT_CONF_TAXCODE ORDER BY tax_name';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // GET printers for dropdown
  app.get('/api/printers', (req, res) => {
    const sql = 'SELECT printer_code, printer_name FROM IT_CONF_PRINTERS ORDER BY printer_name';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // GET units of measurement for dropdown
  app.get('/api/units', (req, res) => {
    const sql = 'SELECT unit_code, unit_name FROM IT_CONF_UOM ORDER BY unit_name';
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      res.json({ success: true, data: results });
    });
  });

  // Dashboard Data API (uses company_info for now)
  app.get('/api/dashboard-data', (req, res) => {
    db.query('SELECT * FROM company_info LIMIT 1', (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ success: false, message: 'DB error or no company info' });
      }
      const info = results[0];
      res.json({
        success: true,
        dashboardData: {
          licensed_name: info.licensed_name,
          legal_owner: info.legal_owner,
          address: info.address,
          city: info.city,
          subscription_start: info.subscription_start ? info.subscription_start.toISOString().slice(0,10) : '',
          subscription_end: info.subscription_end ? info.subscription_end.toISOString().slice(0,10) : '',
          property_code: info.property_code,
          db_name: info.db_name,
          no_of_outlets: info.no_of_outlets,
          pos_version: info.pos_version,
          subscription_expiry: info.subscription_expiry ? info.subscription_expiry.toISOString().slice(0,10) : ''
        }
      });
    });
  });
  
  // Continue with more routes - keep them inside db.connect callback
function injectTablesIfNeeded(callback) {
  const createUserTableSQL = `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    tin VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    profile_img VARCHAR(255),
    role VARCHAR(32) DEFAULT 'user'
  )`;
  const createGroupTableSQL = `CREATE TABLE IF NOT EXISTS user_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) UNIQUE
  )`;
  db.query(createUserTableSQL, (err) => {
    if (err) return callback(err);
    db.query(createGroupTableSQL, (err) => {
      if (err) return callback(err);
      // Check if admin user exists
      db.query('SELECT * FROM users WHERE email = ?', ['admin@pos.com'], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) {
          db.query(
            'INSERT INTO users (email, password, tin, name, profile_img, role) VALUES (?, ?, ?, ?, ?, ?)',
            ['admin@pos.com', 'admin123', '123456789', 'Admin User', 'profile.png', 'admin'],
            callback
          );
        } else {
          callback();
        }
      });
    });
  });
}
// Admin-only: Create user group
app.post('/api/groups', (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser || (sessionUser.role !== 'admin' && !sessionUser.isAdmin)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Missing group name' });
  }
  db.query(
    'INSERT INTO user_groups (name) VALUES (?)',
    [name],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Group already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, groupId: result.insertId });
    }
  );
});



app.post('/api/login', (req, res) => {
  injectTablesIfNeeded((err) => {
    if (err) return res.status(500).json({ error: 'DB setup error' });
    const { email, password, tin } = req.body;
    if (email && password) {
      db.query(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password],
        (err, results) => {
          if (err) return res.status(500).json({ error: 'DB error' });
          if (results.length > 0) {
            req.session.user = results[0];
            res.json({ success: true, user: results[0] });
          } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
          }
        }
      );
    } else if (tin) {
      db.query(
        'SELECT * FROM users WHERE tin = ?',
        [tin],
        (err, results) => {
          if (err) return res.status(500).json({ error: 'DB error' });
          if (results.length > 0) {
            req.session.user = results[0];
            res.json({ success: true, user: results[0] });
          } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
          }
        }
      );
    } else {
      res.status(400).json({ success: false, message: 'Missing credentials' });
    }
  });
});

// Admin-only: Add new user
app.post('/api/users', (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser || (sessionUser.role !== 'admin' && !sessionUser.isAdmin)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const { email, password, tin, name, profile_img, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  db.query(
    'INSERT INTO users (email, password, tin, name, profile_img, role) VALUES (?, ?, ?, ?, ?, ?)',
    [email, password, tin || '', name, profile_img || '', role],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'User already exists' });
        }
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      res.json({ success: true, userId: result.insertId });
    }
  );
});


// Update user password by email
app.post('/api/update-password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing email or password' });
  }
  db.query(
    'UPDATE users SET password = ? WHERE email = ?',
    [password, email],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true });
    }
  );
});

  app.get('/api/profile', (req, res) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ error: 'Not logged in' });
    }
  });

  // Item Stock API endpoints
  app.get('/api/item-stock', (req, res) => {
    db.query('SELECT * FROM IT_CONF_ITEM_STOCK ORDER BY created_at DESC', (err, results) => {
      if (err) {
        console.error('Error fetching item stock:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, data: results });
    });
  });

  app.post('/api/item-stock', (req, res) => {
    const { 
      property_code, outlet_code, item_code, item_name, 
      original_stock_count, current_stock_count, reset_stock_daily_close 
    } = req.body;

    if (!property_code || !outlet_code || !item_code || !item_name || 
        original_stock_count === undefined || current_stock_count === undefined || !reset_stock_daily_close) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = `INSERT INTO IT_CONF_ITEM_STOCK 
      (property_code, outlet_code, item_code, item_name, original_stock_count, current_stock_count, reset_stock_daily_close) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [property_code, outlet_code, item_code, item_name, original_stock_count, current_stock_count, reset_stock_daily_close], (err, result) => {
      if (err) {
        console.error('Error creating item stock:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Item stock record already exists for this property, outlet, and item combination' });
        }
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, id: result.insertId });
    });
  });

  app.put('/api/item-stock/:id', (req, res) => {
    const { id } = req.params;
    const { 
      property_code, outlet_code, item_code, item_name, 
      original_stock_count, current_stock_count, reset_stock_daily_close 
    } = req.body;

    if (!property_code || !outlet_code || !item_code || !item_name || 
        original_stock_count === undefined || current_stock_count === undefined || !reset_stock_daily_close) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = `UPDATE IT_CONF_ITEM_STOCK SET 
      property_code = ?, outlet_code = ?, item_code = ?, item_name = ?, 
      original_stock_count = ?, current_stock_count = ?, reset_stock_daily_close = ?, 
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.query(query, [property_code, outlet_code, item_code, item_name, original_stock_count, current_stock_count, reset_stock_daily_close, id], (err, result) => {
      if (err) {
        console.error('Error updating item stock:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: 'Item stock record already exists for this property, outlet, and item combination' });
        }
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item stock record not found' });
      }
      res.json({ success: true });
    });
  });

  app.delete('/api/item-stock/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM IT_CONF_ITEM_STOCK WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting item stock:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Item stock record not found' });
      }
      res.json({ success: true });
    });
  });

  // Menu Rate Updates API endpoints
  app.get('/api/menu-rate-updates', (req, res) => {
    db.query('SELECT * FROM IT_CONF_MENU_RATE_UPDATES ORDER BY created_at DESC', (err, results) => {
      if (err) {
        console.error('Error fetching menu rate updates:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, data: results });
    });
  });

  app.post('/api/menu-rate-updates', (req, res) => {
    const { 
      property_name, outlet_name, applicable_from, price_level, update_type,
      from_department, to_department, from_item, to_item, calculation_type, 
      rate_value, operation, items_updated 
    } = req.body;

    if (!property_name || !outlet_name || !applicable_from || !price_level || 
        !update_type || !calculation_type || !rate_value || !operation) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = `INSERT INTO IT_CONF_MENU_RATE_UPDATES 
      (property_name, outlet_name, applicable_from, price_level, update_type, 
       from_department, to_department, from_item, to_item, calculation_type, 
       rate_value, operation, items_updated) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [
      property_name, outlet_name, applicable_from, price_level, update_type,
      from_department || null, to_department || null, from_item || null, 
      to_item || null, calculation_type, rate_value, operation, items_updated || 0
    ], (err, result) => {
      if (err) {
        console.error('Error creating menu rate update:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      res.json({ success: true, id: result.insertId });
    });
  });

  app.put('/api/menu-rate-updates/:id', (req, res) => {
    const { id } = req.params;
    const { 
      property_name, outlet_name, applicable_from, price_level, update_type,
      from_department, to_department, from_item, to_item, calculation_type, 
      rate_value, operation, items_updated 
    } = req.body;

    if (!property_name || !outlet_name || !applicable_from || !price_level || 
        !update_type || !calculation_type || !rate_value || !operation) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const query = `UPDATE IT_CONF_MENU_RATE_UPDATES SET 
      property_name = ?, outlet_name = ?, applicable_from = ?, price_level = ?, 
      update_type = ?, from_department = ?, to_department = ?, from_item = ?, 
      to_item = ?, calculation_type = ?, rate_value = ?, operation = ?, 
      items_updated = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.query(query, [
      property_name, outlet_name, applicable_from, price_level, update_type,
      from_department || null, to_department || null, from_item || null, 
      to_item || null, calculation_type, rate_value, operation, items_updated || 0, id
    ], (err, result) => {
      if (err) {
        console.error('Error updating menu rate update:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Menu rate update record not found' });
      }
      res.json({ success: true });
    });
  });

  app.delete('/api/menu-rate-updates/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM IT_CONF_MENU_RATE_UPDATES WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting menu rate update:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Menu rate update record not found' });
      }
      res.json({ success: true });
    });
  });

}); // End of db.connect callback

app.listen(3001, () => {
  console.log('Backend running on port 3001');
});
