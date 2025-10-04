// ...existing code...
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

// Place all code that uses 'db' after db is initialized
// ...existing code...
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(session({
  secret: 'pos_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Logout endpoint to destroy session
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

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
    db.query('SELECT id, applicable_from, property_code, property_name, nick_name, owner_name, address_name, gst_number, pan_number, group_name, local_currency, currency_format, symbol, decimal_places as decimal, date_format, round_off FROM IT_CONF_PROPERTY ORDER BY applicable_from DESC', (err, results) => {
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
    
    // Check for duplicate property code
    console.log('Checking for duplicate property code:', property_code);
    db.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY WHERE property_code = ?', [property_code], (err, results) => {
      if (err) {
        console.error('DB error checking duplicate:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      console.log('Duplicate check result:', results[0]);
      if (results[0].count > 0) {
        console.log(`Property code '${property_code}' already exists`);
        return res.status(400).json({ success: false, message: `Property Code '${property_code}' already exists. Please use a different code.` });
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
    
    // Check for duplicate property code (excluding current record)
    db.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY WHERE property_code = ? AND id != ?', [property_code, id], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (results[0].count > 0) {
        return res.status(400).json({ success: false, message: 'Property Code must be unique' });
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

}); // End of db.connect callback

app.listen(5000, () => {
  console.log('Backend running on port 5000');
});
