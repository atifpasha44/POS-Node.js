require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

// ========================================
// LOGGING SETUP (ADDED)
// ========================================
const { logger, logSystem } = require('./logger');
const { 
  requestLogger, 
  errorLogger, 
  sessionLogger, 
  logDatabaseConnection, 
  healthCheckLogger 
} = require('./middleware/logging');

const app = express();
const PORT = process.env.PORT || 3001;

// ========================================
// MIDDLEWARE SETUP
// ========================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ========================================
// LOGGING MIDDLEWARE (ADDED)
// ========================================
app.use(healthCheckLogger);    // Light logging for health checks
app.use(sessionLogger);        // Session info capture
app.use(requestLogger);        // Request/response logging

// ========================================
// DATABASE CONNECTION
// ========================================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    waitForConnections: true,
    queueLimit: 0
});

// Verify connectivity on startup; the pool itself reconnects automatically
// per-query afterwards, so this is just an early sanity check.
db.query('SELECT 1', (err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        logger.error('Database connection failed', { error: err.message, code: err.code });
        return;
    }
    console.log('✅ Connected to MySQL database');
    logger.info('Database connection established successfully');
});

// ========================================
// DATABASE LOGGING ENHANCEMENT (ADDED)
// ========================================
// Database logging enhancement
logDatabaseConnection(db);

// Detect schema capabilities (modern vs legacy) and prepare child tables if needed
let taxStructureHasId = false;
const detectAndPrepareSchema = () => {
    try {
        const schema = db.config.database;
        const sql = `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'IT_CONF_TAXSTRUCTURE' AND COLUMN_NAME = 'id'`;
        db.query(sql, [schema], (err, rows) => {
            if (err) {
                console.warn('Schema detection failed:', err.message || err);
                return;
            }
            taxStructureHasId = rows && rows[0] && rows[0].cnt > 0;
            console.log('Schema detection: IT_CONF_TAXSTRUCTURE has id:', taxStructureHasId);

            if (taxStructureHasId) {
                // Ensure child table exists for included taxes
                const createChild = `
                CREATE TABLE IF NOT EXISTS IT_CONF_TAXSTRUCTURE_TAX (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    tax_structure_id INT NOT NULL,
                    tax_code VARCHAR(16) NOT NULL,
                    sequence INT NOT NULL,
                    calculation_method VARCHAR(64) DEFAULT 'Percentage',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_tax_structure_id (tax_structure_id),
                    CONSTRAINT fk_taxstructure_tax FOREIGN KEY (tax_structure_id) REFERENCES IT_CONF_TAXSTRUCTURE(id) ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

                db.query(createChild, (err2) => {
                    if (err2) console.warn('Could not create IT_CONF_TAXSTRUCTURE_TAX table:', err2.message || err2);
                });
            }
        });
    } catch (e) {
        console.warn('Schema prepare error:', e.message || e);
    }
};

// Run detection after initial connect
detectAndPrepareSchema();

// ========================================
// DATABASE INITIALIZATION
// ========================================
const initializeDatabase = async () => {
    try {
        console.log('✅ Database schema initialization skipped (using existing pos_db schema)');
        // Commented out automatic schema initialization to use existing pos_db tables
        /*
        // Read and execute the SQL schema file
        const schemaPath = path.join(__dirname, 'pos_tables_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            const statements = schema.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    await new Promise((resolve, reject) => {
                        db.query(statement, (err) => {
                            if (err && !err.message.includes('already exists')) {
                                console.error('Schema execution error:', err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                }
            }
            console.log('✅ Database schema initialized successfully');
        }
        */
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

// Initialize database on startup
// Initialize database on startup
initializeDatabase();

// ========================================
// UTILITY FUNCTIONS
// ========================================
const handleDatabaseError = (res, error, operation) => {
    console.error(`❌ Database error during ${operation}:`, error);
    res.status(500).json({ 
        success: false, 
        message: `Database error during ${operation}`,
        error: error.message 
    });
};

const getCurrentDateOnly = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ========================================
// AUTHENTICATION API
// ========================================
app.post('/api/login', (req, res) => {
    const { email, password, tin } = req.body;
    
    // Check if we have email/password or TIN
    if (!email && !tin) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email or TIN is required' 
        });
    }
    
    let query;
    let params;
    
    if (tin) {
        // Login with TIN (assuming TIN is stored in user_code field)
        query = 'SELECT * FROM IT_CONF_USER_SETUP WHERE user_code = ? AND is_active = 1';
        params = [tin];
    } else {
        // Login with email and password (assuming email is in user_name field for now)
        query = 'SELECT * FROM IT_CONF_USER_SETUP WHERE user_name = ? AND password = ? AND is_active = 1';
        params = [email, password];
    }
    
    db.query(query, params, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'login authentication');
        
        if (results.length === 0) {
            // Log failed authentication attempt (ADDED)
            logSystem.auth('login', { email, tin }, false, req.clientInfo);
            
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        const user = results[0];
        
        // Create user session data
        const userData = {
            id: user.id,
            user_code: user.user_code,
            user_name: user.user_name,
            user_group: user.user_group,
            user_department: user.user_department,
            user_designation: user.user_designation
        };
        
        // Store in session
        req.session.user = userData;
        
        // Log successful authentication (ADDED)
        logSystem.auth('login', userData, true, req.clientInfo);
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: userData
        });
    });
});

app.post('/api/logout', (req, res) => {
    const user = req.session.user; // Store user info before destroying session
    
    req.session.destroy((err) => {
        if (err) {
            // Log failed logout (ADDED)
            logSystem.auth('logout', user, false, req.clientInfo);
            
            return res.status(500).json({ 
                success: false, 
                message: 'Logout failed' 
            });
        }
        
        // Log successful logout (ADDED)
        logSystem.auth('logout', user, true, req.clientInfo);
        
        res.json({ 
            success: true, 
            message: 'Logout successful' 
        });
    });
});

// ========================================
// ITEM DEPARTMENTS API
// ========================================
app.get('/api/item-departments', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_ITEM_DEPARTMENTS ORDER BY department_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch item departments');
        res.json({ success: true, data: results });
    });
});

app.post('/api/item-departments', (req, res) => {
    const { department_code, name, alternate_name, inactive = 0 } = req.body;
    
    if (!department_code || !name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Department code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_ITEM_DEPARTMENTS 
                   (department_code, name, alternate_name, inactive, created_by) 
                   VALUES (?, ?, ?, ?, 'admin')`;
    
    db.query(query, [department_code, name, alternate_name, inactive], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Department code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create item department');
        }
        res.json({ 
            success: true, 
            message: 'Item department created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/item-departments/:id', (req, res) => {
    const { id } = req.params;
    const { department_code, name, alternate_name, inactive } = req.body;
    
    const query = `UPDATE IT_CONF_ITEM_DEPARTMENTS 
                   SET department_code = ?, name = ?, alternate_name = ?, 
                       inactive = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [department_code, name, alternate_name, inactive, id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update item department');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item department not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Item department updated successfully' 
        });
    });
});

app.delete('/api/item-departments/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_ITEM_DEPARTMENTS WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete item department');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item department not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Item department deleted successfully' 
        });
    });
});

// ========================================
// ITEM CATEGORIES API
// ========================================
app.get('/api/item-categories', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_ITEM_CATEGORIES ORDER BY category_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch item categories');
        res.json({ success: true, data: results });
    });
});

app.post('/api/item-categories', (req, res) => {
    const { 
        category_code, 
        name, 
        alternate_name, 
        item_department_code, 
        item_department_name, 
        display_sequence, 
        inactive = 0 
    } = req.body;
    
    if (!category_code || !name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Category code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_ITEM_CATEGORIES 
                   (category_code, name, alternate_name, item_department_code, 
                    item_department_name, display_sequence, inactive, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        category_code, name, alternate_name, item_department_code, 
        item_department_name, display_sequence, inactive
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create item category');
        }
        res.json({ 
            success: true, 
            message: 'Item category created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/item-categories/:id', (req, res) => {
    const { id } = req.params;
    const { 
        category_code, 
        name, 
        alternate_name, 
        item_department_code, 
        item_department_name, 
        display_sequence, 
        inactive 
    } = req.body;
    
    const query = `UPDATE IT_CONF_ITEM_CATEGORIES 
                   SET category_code = ?, name = ?, alternate_name = ?, 
                       item_department_code = ?, item_department_name = ?, 
                       display_sequence = ?, inactive = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        category_code, name, alternate_name, item_department_code, 
        item_department_name, display_sequence, inactive, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update item category');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item category not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Item category updated successfully' 
        });
    });
});

app.delete('/api/item-categories/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_ITEM_CATEGORIES WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete item category');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item category not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Item category deleted successfully' 
        });
    });
});

// ========================================
// OUTLET SETUP API
// ========================================
app.get('/api/outlet-setup', (req, res) => {
    const query = `SELECT 
        id, 
        property,
        applicable_from,
        outlet_code,
        outlet_name,
        short_name,
        outlet_type,
        item_price_level,
        check_prefix,
        check_format,
        receipt_format,
        kitchen_format,
        inactive,
        options,
        created_at,
        updated_at
    FROM IT_CONF_OUTSET 
    WHERE inactive = FALSE 
    ORDER BY outlet_code`;
    
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch outlet setup');
        res.json({ success: true, data: results });
    });
});

app.post('/api/outlet-setup', (req, res) => {
    const { 
        property,
        applicable_from, 
        outlet_code, 
        outlet_name, 
        short_name, 
        outlet_type = 'Restaurant',
        item_price_level = 'Price 1',
        check_prefix,
        check_format,
        receipt_format,
        kitchen_format,
        options = {},
        inactive = false 
    } = req.body;
    
    if (!property || !applicable_from || !outlet_code || !outlet_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Property, applicable from, outlet code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_OUTSET 
                   (property, applicable_from, outlet_code, outlet_name, short_name, outlet_type, 
                    item_price_level, check_prefix, check_format, receipt_format, kitchen_format, 
                    options, inactive) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [
        property, applicable_from, outlet_code, outlet_name, short_name, outlet_type,
        item_price_level, check_prefix, check_format, receipt_format, kitchen_format,
        JSON.stringify(options), inactive
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Outlet code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create outlet setup');
        }
        res.json({ 
            success: true, 
            message: 'Outlet setup created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/outlet-setup/:id', (req, res) => {
    const { id } = req.params;
    const { 
        property,
        applicable_from, 
        outlet_code, 
        outlet_name, 
        short_name, 
        outlet_type,
        item_price_level,
        check_prefix,
        check_format,
        receipt_format,
        kitchen_format,
        options = {},
        inactive = false
    } = req.body;
    
    const query = `UPDATE IT_CONF_OUTSET 
                   SET property = ?, applicable_from = ?, outlet_code = ?, outlet_name = ?, 
                       short_name = ?, outlet_type = ?, item_price_level = ?, 
                       check_prefix = ?, check_format = ?, receipt_format = ?, 
                       kitchen_format = ?, options = ?, inactive = ?
                   WHERE id = ?`;
    
    db.query(query, [
        property, applicable_from, outlet_code, outlet_name, short_name, outlet_type,
        item_price_level, check_prefix, check_format, receipt_format, kitchen_format,
        JSON.stringify(options), inactive, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update outlet setup');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Outlet setup not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Outlet setup updated successfully' 
        });
    });
});

app.delete('/api/outlet-setup/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_OUTSET WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete outlet setup');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Outlet setup not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Outlet setup deleted successfully' 
        });
    });
});

// ========================================
// TAX CODES API (Existing Table Schema)
// ========================================
app.get('/api/tax-codes', (req, res) => {
    const query = 'SELECT TAX_CODE as tax_code, TAX_DESC as tax_name, RATE as tax_percentage, ActiveStatus as is_active FROM it_conf_taxcode ORDER BY TAX_CODE';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch tax codes');
        res.json({ success: true, data: results });
    });
});

app.post('/api/tax-codes', (req, res) => {
    const { tax_code, tax_name, tax_percentage = 0, is_active = 1 } = req.body;
    
    if (!tax_code || !tax_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tax code and name are required' 
        });
    }

    const query = `INSERT INTO it_conf_taxcode (TAX_CODE, TAX_DESC, RATE, ActiveStatus) VALUES (?, ?, ?, ?)`;
    
    db.query(query, [tax_code, tax_name, tax_percentage, is_active], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tax code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create tax code');
        }
        res.json({ 
            success: true, 
            message: 'Tax code created successfully'
        });
    });
});

app.put('/api/tax-codes/:code', (req, res) => {
    const { code } = req.params;
    const { tax_code, tax_name, tax_percentage, is_active } = req.body;
    
    const query = `UPDATE it_conf_taxcode SET TAX_CODE = ?, TAX_DESC = ?, RATE = ?, ActiveStatus = ? WHERE TAX_CODE = ?`;
    
    db.query(query, [tax_code, tax_name, tax_percentage, is_active, code], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update tax code');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tax code not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Tax code updated successfully' 
        });
    });
});

app.delete('/api/tax-codes/:code', (req, res) => {
    const { code } = req.params;
    
    const query = 'DELETE FROM it_conf_taxcode WHERE TAX_CODE = ?';
    db.query(query, [code], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete tax code');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tax code not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Tax code deleted successfully' 
        });
    });
});

// ========================================
// TAX STRUCTURE API (Existing Schema)
// ========================================
app.get('/api/tax-structure', (req, res) => {
    // If modern schema (id present), return included_taxes from child table; otherwise legacy select
    if (taxStructureHasId) {
        // Only select columns that exist in the new schema
        const q = `SELECT id, tax_structure_code, tax_structure_name, description, tax_code, calculation_type, is_active, created_at, updated_at FROM IT_CONF_TAXSTRUCTURE WHERE is_active = 1 ORDER BY tax_structure_code`;
        db.query(q, (err, rows) => {
            if (err) return handleDatabaseError(res, err, 'fetch tax structures (modern)');
            const ids = rows.map(r => r.id);
            if (ids.length === 0) return res.json({ success: true, data: rows.map(r => ({ ...r, included_taxes: [] })) });
            const childQ = `SELECT tax_structure_id, tax_code, sequence, calculation_method FROM IT_CONF_TAXSTRUCTURE_TAX WHERE tax_structure_id IN (?) ORDER BY sequence`;
            db.query(childQ, [ids], (err2, childRows) => {
                if (err2) return handleDatabaseError(res, err2, 'fetch tax structure children');
                const map = {};
                (childRows || []).forEach(cr => {
                    if (!map[cr.tax_structure_id]) map[cr.tax_structure_id] = [];
                    map[cr.tax_structure_id].push({ tax_code: cr.tax_code, sequence: cr.sequence, calculation_method: cr.calculation_method });
                });
                const result = rows.map(r => ({ ...r, included_taxes: map[r.id] || [] }));
                res.json({ success: true, data: result });
            });
        });
    } else {
        const query = 'SELECT TAXSTRCODE as tax_structure_code, TAXSTRNAME as tax_structure_name, DESCRIPTION as description, ActiveStatus as is_active FROM IT_CONF_TAXSTRUCTURE WHERE ActiveStatus = 1 ORDER BY TAXSTRCODE';

        db.query(query, (err, results) => {
            if (err) return handleDatabaseError(res, err, 'fetch tax structure');
            res.json({ success: true, data: results });
        });
    }
});

app.post('/api/tax-structure', (req, res) => {
    const { 
        tax_structure_code, 
        tax_structure_name, 
        description = '',
        tax_code, 
        calculation_type = 'Percentage', 
        is_active = 1 
    } = req.body;

    if (!tax_structure_code || !tax_structure_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tax structure code and name are required' 
        });
    }

    // Only insert columns that exist in the new schema
    const modernQuery = `INSERT INTO IT_CONF_TAXSTRUCTURE 
                   (tax_structure_code, tax_structure_name, description, tax_code, calculation_type, is_active, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    db.query(modernQuery, [
        tax_structure_code, tax_structure_name, description, tax_code, calculation_type, is_active
    ], (err, result) => {
        if (err) {
            // If column names don't match (legacy DB), attempt best-effort legacy insert
            if (err.code === 'ER_BAD_FIELD_ERROR' || /Unknown column/i.test(err.message)) {
                // Legacy table may have TAXSTRCODE (numeric), TAXSTRNAME, DESCRIPTION, ActiveStatus
                // We'll allocate a numeric TAXSTRCODE if incoming code is non-numeric.
                db.query('SELECT IFNULL(MAX(TAXSTRCODE),0) + 1 AS nextCode FROM IT_CONF_TAXSTRUCTURE', (err2, rows) => {
                    if (err2) return handleDatabaseError(res, err2, 'determine legacy tax structure code');
                    const nextCode = rows && rows[0] && rows[0].nextCode ? rows[0].nextCode : 1;
                    const legacyCode = /^[0-9]+$/.test(String(tax_structure_code)) ? tax_structure_code : nextCode;
                    const legacyQuery = `INSERT INTO IT_CONF_TAXSTRUCTURE (TAXSTRCODE, TAXSTRNAME, DESCRIPTION, ActiveStatus) VALUES (?, ?, ?, ?)`;
                    const descriptionLegacy = tax_code ? `Tax:${tax_code}` : (req.body.description || '');
                    db.query(legacyQuery, [legacyCode, tax_structure_name, description, is_active], (err3, result3) => {
                        if (err3) return handleDatabaseError(res, err3, 'create tax structure (legacy)');
                        return res.json({ success: true, message: 'Tax structure created (legacy)', id: result3.insertId });
                    });
                });
                return;
            }

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tax structure code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create tax structure');
        }
        // If modern schema is used and included_taxes provided, persist child rows
        const structureId = result.insertId;
        const included = Array.isArray(req.body.included_taxes) ? req.body.included_taxes : [];
        if (taxStructureHasId && included.length > 0) {
            const values = included.map(t => [structureId, t.tax_code, t.sequence || 1, t.calculation_method || 'Percentage']);
            const childInsert = 'INSERT INTO IT_CONF_TAXSTRUCTURE_TAX (tax_structure_id, tax_code, sequence, calculation_method) VALUES ?';
            db.query(childInsert, [values], (errChild) => {
                if (errChild) return handleDatabaseError(res, errChild, 'create tax structure children');
                res.json({ success: true, message: 'Tax structure created successfully', id: structureId });
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Tax structure created successfully',
                id: structureId 
            });
        }
    });
});

// Temporary compatibility endpoint to insert into legacy IT_CONF_TAXSTRUCTURE schema
// This helps create records on older databases that use TAXSTRCODE/TAXSTRNAME columns.
app.post('/api/tax-structure/legacy', (req, res) => {
    const { tax_structure_name, tax_code, description = '', is_active = 1 } = req.body;
    if (!tax_structure_name) return res.status(400).json({ success: false, message: 'tax_structure_name is required' });

    db.query('SELECT IFNULL(MAX(TAXSTRCODE),0) + 1 AS nextCode FROM IT_CONF_TAXSTRUCTURE', (err, rows) => {
        if (err) return handleDatabaseError(res, err, 'determine legacy tax structure code');
        const nextCode = rows && rows[0] && rows[0].nextCode ? rows[0].nextCode : 1;
        const legacyQuery = `INSERT INTO IT_CONF_TAXSTRUCTURE (TAXSTRCODE, TAXSTRNAME, DESCRIPTION, ActiveStatus) VALUES (?, ?, ?, ?)`;
        db.query(legacyQuery, [nextCode, tax_structure_name, description || (tax_code ? `Tax:${tax_code}` : ''), is_active], (err2, result2) => {
            if (err2) return handleDatabaseError(res, err2, 'create tax structure (legacy)');
            res.json({ success: true, message: 'Tax structure created (legacy)', id: result2.insertId, taxstrcode: nextCode });
        });
    });
});

app.put('/api/tax-structure/:id', (req, res) => {
    const { id } = req.params;
    const { 
        tax_structure_code, 
        tax_structure_name, 
        outlet_code, 
        menu_type, 
        serial_number, 
        short_tax, 
        tax_code, 
        calculation_type, 
        amount, 
        target_tax, 
        is_active 
    } = req.body;
    
    const query = `UPDATE IT_CONF_TAXSTRUCTURE 
                   SET tax_structure_code = ?, tax_structure_name = ?, outlet_code = ?, 
                       menu_type = ?, serial_number = ?, short_tax = ?, tax_code = ?, 
                       calculation_type = ?, amount = ?, target_tax = ?, is_active = ?, 
                       modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        tax_structure_code, tax_structure_name, outlet_code, menu_type, 
        serial_number, short_tax, tax_code, calculation_type, amount, 
        target_tax, is_active, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update tax structure');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tax structure not found' 
            });
        }
        
        // If modern schema and included_taxes provided, replace child rows
        const included = Array.isArray(req.body.included_taxes) ? req.body.included_taxes : null;
        if (taxStructureHasId && included) {
            const deleteChild = 'DELETE FROM IT_CONF_TAXSTRUCTURE_TAX WHERE tax_structure_id = ?';
            db.query(deleteChild, [id], (errDel) => {
                if (errDel) return handleDatabaseError(res, errDel, 'delete existing tax structure children');
                if (included.length === 0) {
                    return res.json({ success: true, message: 'Tax structure updated successfully' });
                }
                const values = included.map(t => [id, t.tax_code, t.sequence || 1, t.calculation_method || 'Percentage']);
                const childInsert = 'INSERT INTO IT_CONF_TAXSTRUCTURE_TAX (tax_structure_id, tax_code, sequence, calculation_method) VALUES ?';
                db.query(childInsert, [values], (errIns) => {
                    if (errIns) return handleDatabaseError(res, errIns, 'insert tax structure children');
                    res.json({ success: true, message: 'Tax structure updated successfully' });
                });
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Tax structure updated successfully' 
            });
        }
    });
});

app.delete('/api/tax-structure/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_TAXSTRUCTURE WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete tax structure');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Tax structure not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Tax structure deleted successfully' 
        });
    });
});

// ========================================
// UNIT OF MEASUREMENT API (Existing Schema)
// ========================================
app.get('/api/uom', (req, res) => {
    const query = 'SELECT UOM_CODE as uom_code, UOM_NAME as uom_name, DESCRIPTION as description, ActiveStatus as is_active FROM it_conf_uom WHERE ActiveStatus = 1 ORDER BY UOM_CODE';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch UOM');
        res.json({ success: true, data: results });
    });
});

app.post('/api/uom', (req, res) => {
    // The live DB schema for IT_CONF_UOM contains columns: UOM_CODE, UOM_NAME, DESCRIPTION, ActiveStatus
    // Accept description and is_active from frontend and persist to the existing columns.
    const {
        uom_code,
        uom_name,
        description = null,
        is_active = 1
    } = req.body;

    if (!uom_code || !uom_name) {
        return res.status(400).json({
            success: false,
            message: 'UOM code and name are required'
        });
    }

    const query = `INSERT INTO IT_CONF_UOM (UOM_CODE, UOM_NAME, DESCRIPTION, ActiveStatus) VALUES (?, ?, ?, ?)`;

    db.query(query, [uom_code, uom_name, description, is_active], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'UOM code already exists'
                });
            }
            return handleDatabaseError(res, err, 'create UOM');
        }

        // Return the created row to the client in a normalized shape
        const selectQuery = `SELECT UOM_CODE AS uom_code, UOM_NAME AS uom_name, DESCRIPTION AS description, ActiveStatus AS is_active FROM IT_CONF_UOM WHERE UOM_CODE = ?`;
        db.query(selectQuery, [uom_code], (err2, rows) => {
            if (err2) return handleDatabaseError(res, err2, 'fetch created UOM');
            res.json({ success: true, message: 'UOM created successfully', data: rows[0] });
        });
    });
});

app.put('/api/uom/:id', (req, res) => {
    const { id } = req.params;
    const {
        uom_code,
        uom_name,
        description = null,
        is_active = 1
    } = req.body;

    if (!uom_code || !uom_name) {
        return res.status(400).json({ success: false, message: 'UOM code and name are required' });
    }

    // Update the canonical columns present in most installations.
    const query = `UPDATE IT_CONF_UOM 
                   SET UOM_CODE = ?, UOM_NAME = ?, DESCRIPTION = ?, ActiveStatus = ?, modified_by = 'admin', updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;

    db.query(query, [uom_code, uom_name, description, is_active, id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update UOM');

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'UOM not found' });
        }

        res.json({ success: true, message: 'UOM updated successfully' });
    });
});

app.delete('/api/uom/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_UOM WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete UOM');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'UOM not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'UOM deleted successfully' 
        });
    });
});

// ========================================
// USER GROUPS API
// ========================================
app.get('/api/user-groups', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_USER_GROUPS ORDER BY group_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch user groups');
        res.json({ success: true, data: results });
    });
});

app.post('/api/user-groups', (req, res) => {
    const { group_code, group_name, group_details, is_active = 1 } = req.body;
    
    if (!group_code || !group_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Group code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_USER_GROUPS 
                   (group_code, group_name, group_details, is_active, created_by) 
                   VALUES (?, ?, ?, ?, 'admin')`;
    
    db.query(query, [group_code, group_name, group_details, is_active], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Group code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create user group');
        }
        res.json({ 
            success: true, 
            message: 'User group created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/user-groups/:id', (req, res) => {
    const { id } = req.params;
    const { group_code, group_name, group_details, is_active } = req.body;
    
    const query = `UPDATE IT_CONF_USER_GROUPS 
                   SET group_code = ?, group_name = ?, group_details = ?, 
                       is_active = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [group_code, group_name, group_details, is_active, id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update user group');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User group not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'User group updated successfully' 
        });
    });
});

app.delete('/api/user-groups/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_USER_GROUPS WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete user group');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User group not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'User group deleted successfully' 
        });
    });
});

// ========================================
// USER SETUP API
// ========================================
app.get('/api/user-setup', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_USER_SETUP ORDER BY user_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch user setup');
        res.json({ success: true, data: results });
    });
});

app.post('/api/user-setup', (req, res) => {
    const { 
        user_code, 
        user_name, 
        password, 
        user_group, 
        user_department, 
        user_designation, 
        is_active = 1 
    } = req.body;
    
    if (!user_code || !user_name || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'User code, name and password are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_USER_SETUP 
                   (user_code, user_name, password, user_group, user_department, 
                    user_designation, is_active, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        user_code, user_name, password, user_group, user_department, user_designation, is_active
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'User code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create user setup');
        }
        res.json({ 
            success: true, 
            message: 'User setup created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/user-setup/:id', (req, res) => {
    const { id } = req.params;
    const { 
        user_code, 
        user_name, 
        password, 
        user_group, 
        user_department, 
        user_designation, 
        is_active 
    } = req.body;
    
    const query = `UPDATE IT_CONF_USER_SETUP 
                   SET user_code = ?, user_name = ?, password = ?, user_group = ?, 
                       user_department = ?, user_designation = ?, is_active = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        user_code, user_name, password, user_group, user_department, user_designation, is_active, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update user setup');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User setup not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'User setup updated successfully' 
        });
    });
});

app.delete('/api/user-setup/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_USER_SETUP WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete user setup');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'User setup not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'User setup deleted successfully' 
        });
    });
});

// ========================================
// REASON CODES API
// ========================================
app.get('/api/reason-codes', (req, res) => {
    // Map DB columns (REASON_CODE, REASON_DESC, ActiveStatus, display_sequence) to frontend shape
    const query = `SELECT
        REASON_CODE AS reason_code,
        REASON_DESC AS reason_description,
                IFNULL(OPERATION_TYPE, 'General') AS operation_type,
        IFNULL(display_sequence, 0) AS display_sequence,
        IFNULL(ActiveStatus, 1) AS is_active
      FROM IT_CONF_REASONS
      ORDER BY REASON_CODE`;

    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch reason codes');
        res.json({ success: true, data: results });
    });
});

app.post('/api/reason-codes', (req, res) => {
    // Frontend sends: reason_code, reason_description, display_sequence, is_active
    const { reason_code, reason_description, operation_type = 'General', display_sequence = null, is_active = 1 } = req.body;

    if (!reason_code || !reason_description) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reason code and description are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_REASONS 
                   (REASON_CODE, REASON_DESC, OPERATION_TYPE, display_sequence, ActiveStatus) 
                   VALUES (?, ?, ?, ?, ?)`;

    db.query(query, [reason_code, reason_description, operation_type, display_sequence, is_active], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Reason code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create reason code');
        }

        // Return the created row
    const selectQuery = `SELECT REASON_CODE AS reason_code, REASON_DESC AS reason_description, IFNULL(OPERATION_TYPE,'General') AS operation_type, IFNULL(display_sequence,0) AS display_sequence, IFNULL(ActiveStatus,1) AS is_active FROM IT_CONF_REASONS WHERE REASON_CODE = ?`;
        db.query(selectQuery, [reason_code], (err2, rows) => {
            if (err2) return handleDatabaseError(res, err2, 'fetch created reason code');
            res.json({ success: true, message: 'Reason code created successfully', data: rows[0] });
        });
    });
});

app.put('/api/reason-codes/:code', (req, res) => {
    const { code } = req.params;
    // Accept frontend field names and map to DB columns
    const { reason_description, operation_type = 'General', display_sequence = null, is_active } = req.body;

    const query = `UPDATE IT_CONF_REASONS 
                   SET REASON_DESC = ?, OPERATION_TYPE = ?, display_sequence = ?, ActiveStatus = ?
                   WHERE REASON_CODE = ?`;

    db.query(query, [reason_description, operation_type, display_sequence, is_active, code], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update reason code');

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Reason code not found' 
            });
        }

        // Return updated row
    const selectQuery = `SELECT REASON_CODE AS reason_code, REASON_DESC AS reason_description, IFNULL(OPERATION_TYPE,'General') AS operation_type, IFNULL(display_sequence,0) AS display_sequence, IFNULL(ActiveStatus,1) AS is_active FROM IT_CONF_REASONS WHERE REASON_CODE = ?`;
        db.query(selectQuery, [code], (err2, rows) => {
            if (err2) return handleDatabaseError(res, err2, 'fetch updated reason code');
            res.json({ success: true, message: 'Reason code updated successfully', data: rows[0] });
        });
    });
});

app.delete('/api/reason-codes/:code', (req, res) => {
    const { code } = req.params;

    const query = 'DELETE FROM IT_CONF_REASONS WHERE REASON_CODE = ?';
    db.query(query, [code], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete reason code');

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Reason code not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Reason code deleted successfully' 
        });
    });
});

// ========================================
// CREDIT CARD MANAGER API
// ========================================
app.get('/api/credit-cards', (req, res) => {
    const query = `SELECT 
        card_code, 
        card_name, 
        card_type, 
        bank_issuer, 
        status, 
        transaction_fee, 
        transaction_charges, 
        effective_from, 
        effective_to
        FROM IT_CONF_CCM ORDER BY card_code`;
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch credit cards');
        res.json({ success: true, data: results });
    });
});

app.post('/api/credit-cards', (req, res) => {
    const {
        card_code,
        card_name,
        card_type,
        bank_issuer,
        status,
        transaction_fee,
        transaction_charges,
        effective_from,
        effective_to
    } = req.body;

    if (!card_code || !card_name) {
        return res.status(400).json({
            success: false,
            message: 'Card code and name are required'
        });
    }

    const query = `INSERT INTO IT_CONF_CCM
        (card_code, card_name, card_type, bank_issuer, status, transaction_fee, transaction_charges, effective_from, effective_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(query, [
        card_code,
        card_name,
        card_type,
        bank_issuer,
        status ? 1 : 0,
        transaction_fee || 0,
        transaction_charges || 0,
        effective_from || null,
        effective_to || null
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'Card code already exists'
                });
            }
            return handleDatabaseError(res, err, 'create credit card');
        }
        res.json({
            success: true,
            message: 'Credit card created successfully',
            id: result.insertId
        });
    });
});

app.put('/api/credit-cards/:id', (req, res) => {
    const { id } = req.params;
    const {
        card_code,
        card_name,
        card_type,
        bank_issuer,
        status,
        transaction_fee,
        transaction_charges,
        effective_from,
        effective_to
    } = req.body;
    const query = `UPDATE IT_CONF_CCM SET
        card_name = ?,
        card_type = ?,
        bank_issuer = ?,
        status = ?,
        transaction_fee = ?,
        transaction_charges = ?,
        effective_from = ?,
        effective_to = ?
        WHERE card_code = ?`;
    db.query(query, [
        card_name,
        card_type,
        bank_issuer,
        status ? 1 : 0,
        transaction_fee || 0,
        transaction_charges || 0,
        effective_from || null,
        effective_to || null,
        card_code
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update credit card');
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Credit card not found'
            });
        }
        res.json({
            success: true,
            message: 'Credit card updated successfully'
        });
    });
});

app.delete('/api/credit-cards/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM IT_CONF_CCM WHERE card_code = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete credit card');
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Credit card not found'
            });
        }
        res.json({
            success: true,
            message: 'Credit card deleted successfully'
        });
    });
});

// ========================================
// ITEM MASTER API
// ========================================
app.get('/api/item-master', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_ITEM_MASTER ORDER BY item_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch item master');
        
        // Parse JSON fields
        const parsedResults = results.map(item => ({
            ...item,
            select_outlets: item.select_outlets ? JSON.parse(item.select_outlets) : []
        }));
        
        res.json({ success: true, data: parsedResults });
    });
});

app.post('/api/item-master', (req, res) => {
    const { 
        select_outlets = [], 
        item_code, 
        item_name, 
        short_name, 
        item_department, 
        applicable_from, 
        inventory_code, 
        alternate_name, 
        tax_code, 
        item_category, 
        item_price_1 = 0, 
        item_price_2 = 0, 
        item_price_3 = 0, 
        item_price_4 = 0, 
        item_printer_1, 
        item_printer_2, 
        item_printer_3, 
        set_menu = 'No', 
        item_modifier_group, 
        unit, 
        print_group, 
        cost = 0, 
        in_active = 0, 
        item_logo, 
        item_logo_url 
    } = req.body;
    
    if (!item_code || !item_name || !applicable_from) {
        return res.status(400).json({ 
            success: false, 
            message: 'Item code, name and applicable from date are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_ITEM_MASTER 
                   (select_outlets, item_code, item_name, short_name, item_department, 
                    applicable_from, inventory_code, alternate_name, tax_code, item_category, 
                    item_price_1, item_price_2, item_price_3, item_price_4, item_printer_1, 
                    item_printer_2, item_printer_3, set_menu, item_modifier_group, unit, 
                    print_group, cost, in_active, item_logo, item_logo_url, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        JSON.stringify(select_outlets), item_code, item_name, short_name, item_department, 
        applicable_from, inventory_code, alternate_name, tax_code, item_category, 
        item_price_1, item_price_2, item_price_3, item_price_4, item_printer_1, 
        item_printer_2, item_printer_3, set_menu, item_modifier_group, unit, 
        print_group, cost, in_active, item_logo, item_logo_url
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Item code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create item master');
        }
        res.json({ 
            success: true, 
            message: 'Item master created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/item-master/:id', (req, res) => {
    const { id } = req.params;
    const { 
        select_outlets, 
        item_code, 
        item_name, 
        short_name, 
        item_department, 
        applicable_from, 
        inventory_code, 
        alternate_name, 
        tax_code, 
        item_category, 
        item_price_1, 
        item_price_2, 
        item_price_3, 
        item_price_4, 
        item_printer_1, 
        item_printer_2, 
        item_printer_3, 
        set_menu, 
        item_modifier_group, 
        unit, 
        print_group, 
        cost, 
        in_active, 
        item_logo, 
        item_logo_url 
    } = req.body;
    
    const query = `UPDATE IT_CONF_ITEM_MASTER 
                   SET select_outlets = ?, item_code = ?, item_name = ?, short_name = ?, 
                       item_department = ?, applicable_from = ?, inventory_code = ?, 
                       alternate_name = ?, tax_code = ?, item_category = ?, item_price_1 = ?, 
                       item_price_2 = ?, item_price_3 = ?, item_price_4 = ?, item_printer_1 = ?, 
                       item_printer_2 = ?, item_printer_3 = ?, set_menu = ?, item_modifier_group = ?, 
                       unit = ?, print_group = ?, cost = ?, in_active = ?, item_logo = ?, 
                       item_logo_url = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        JSON.stringify(select_outlets), item_code, item_name, short_name, item_department, 
        applicable_from, inventory_code, alternate_name, tax_code, item_category, 
        item_price_1, item_price_2, item_price_3, item_price_4, item_printer_1, 
        item_printer_2, item_printer_3, set_menu, item_modifier_group, unit, 
        print_group, cost, in_active, item_logo, item_logo_url, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update item master');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item master not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Item master updated successfully' 
        });
    });
});

app.delete('/api/item-master/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_ITEM_MASTER WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete item master');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item master not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Item master deleted successfully' 
        });
    });
});

// ========================================
// EXISTING PROPERTY CODE API (PRESERVED)
// ========================================
app.get('/api/property-codes', (req, res) => {
    const query = `SELECT 
                       id, applicable_from, property_code, property_name, nick_name, owner_name, 
                       address_name, gst_number, pan_number, group_name, local_currency,
                       currency_format, symbol, decimal_places, date_format, round_off, 
                       property_logo, created_at, updated_at,
                       created_user_id, updated_user_id, reserve_1, reserve_2
                   FROM IT_CONF_PROPERTY 
                   ORDER BY property_code`;
    
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch property codes');
        
        // Transform results to match frontend expectations
        const transformedResults = results.map(row => ({
            id: row.id,
            property_code: row.property_code,
            property_name: row.property_name,
            nick_name: row.nick_name || '',
            owner_name: row.owner_name || '',
            address_name: row.address_name || '',
            gst_number: row.gst_number || '',
            pan_number: row.pan_number || '',
            group_name: row.group_name || '',
            local_currency: row.local_currency || 'USD',
            currency_format: row.currency_format || 'en-US',
            symbol: row.symbol || '$',
            decimal_places: row.decimal_places || 2,
            date_format: row.date_format || 'MM/DD/YYYY',
            round_off: row.round_off || '0.01',
            property_logo: row.property_logo || null,
            applicable_from: row.applicable_from ? (row.applicable_from.toISOString ? (() => {
                // Build local YYYY-MM-DD from Date object to preserve the date as seen by users
                const d = row.applicable_from;
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            })() : row.applicable_from) : '',
            created_user_id: row.created_user_id || null,
            updated_user_id: row.updated_user_id || null,
            reserve_1: row.reserve_1 || null,
            reserve_2: row.reserve_2 || null
        }));
        
        res.json({ success: true, data: transformedResults });
    });
});

app.post('/api/property-codes', (req, res) => {
    const { 
        applicable_from, property_code, property_name, nick_name, owner_name, 
        address_name, gst_number, pan_number, group_name, local_currency,
        currency_format, symbol, decimal_places, date_format, round_off, property_logo
    } = req.body;
    // Server-controls audit/reserve fields to prevent client tampering
    // Use numeric DB id for audit columns. If no session user, leave null so DB records system nulls.
    const sessionUserId = req.session && req.session.user ? req.session.user.id : null;
    const created_user_id = sessionUserId;
    const updated_user_id = sessionUserId;
    const reserve_1 = null;
    const reserve_2 = null;
    
    if (!property_code || !property_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Property code and name are required' 
        });
    }

    // Use STR_TO_DATE to store the date part exactly as provided (YYYY-MM-DD) and avoid timezone shifts
    const query = `INSERT INTO IT_CONF_PROPERTY 
                   (applicable_from, property_code, property_name, nick_name, owner_name, 
                    address_name, gst_number, pan_number, group_name, local_currency,
                    currency_format, symbol, decimal_places, date_format, round_off, property_logo,
                    created_user_id, updated_user_id, reserve_1, reserve_2) 
                   VALUES (STR_TO_DATE(?, '%Y-%m-%d'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const insertValues = [
        applicable_from || null,
        property_code,
        property_name,
        nick_name || null,
        owner_name || null,
        address_name || null,
        gst_number || null,
        pan_number || null,
        group_name || null,
        local_currency || null,
        currency_format || null,
        symbol || null,
        decimal_places || 2,
        date_format || null,
        round_off || null,
        property_logo || null,
        created_user_id,
        updated_user_id,
        reserve_1,
        reserve_2
    ];

    db.query(query, insertValues, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Property code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create property code');
        }
        res.json({ 
            success: true, 
            message: 'Property code created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/property-codes/:id', (req, res) => {
    const { id } = req.params;
    const { 
        applicable_from, property_code, property_name, nick_name, owner_name, 
        address_name, gst_number, pan_number, group_name, local_currency,
        currency_format, symbol, decimal_places, date_format, round_off, property_logo,
        // Audit/reserve fields ignored from client
        reserve_1, reserve_2
    } = req.body;
    // Server Populates updated_user_id from session; created_user_id is preserved
    const sessionUserId = req.session && req.session.user ? req.session.user.id : null;
    const updated_user_id = sessionUserId;

    const query = `UPDATE IT_CONF_PROPERTY 
                   SET applicable_from = STR_TO_DATE(?, '%Y-%m-%d'), property_name = ?, nick_name = ?, owner_name = ?, 
                       address_name = ?, gst_number = ?, pan_number = ?, group_name = ?, 
                       local_currency = ?, currency_format = ?, symbol = ?, decimal_places = ?, 
                       date_format = ?, round_off = ?, property_logo = ?,
                       updated_user_id = ?, reserve_1 = ?, reserve_2 = ?,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;

    db.query(query, [
        applicable_from || null,
        property_name,
        nick_name || null,
        owner_name || null,
        address_name || null,
        gst_number || null,
        pan_number || null,
        group_name || null,
        local_currency || null,
        currency_format || null,
        symbol || null,
        decimal_places || 2,
        date_format || null,
        round_off || null,
        property_logo || null,
        updated_user_id,
        reserve_1 || null,
        reserve_2 || null,
        id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update property code');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Property code not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Property code updated successfully' 
        });
    });
});

app.delete('/api/property-codes/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_PROPERTY WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete property code');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Property code not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Property code deleted successfully' 
        });
    });
});

// ========================================
// OUTLET BUSINESS PERIODS API
// ========================================
app.get('/api/business-periods', (req, res) => {
    const query = `SELECT 
        id, 
        applicable_from,
        outlet_code,
        period_code,
        period_name,
        short_name,
        start_time,
        end_time,
        active_days,
        is_active,
        created_at,
        updated_at
    FROM IT_CONF_BUSINESS_PERIODS 
    WHERE is_active = TRUE 
    ORDER BY period_code`;
    
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch business periods');
        res.json({ success: true, data: results });
    });
});

app.post('/api/business-periods', (req, res) => {
    const { 
        applicable_from,
        outlet_code, 
        period_code, 
        period_name, 
        short_name,
        start_time,
        end_time,
        active_days = {},
        is_active = true 
    } = req.body;
    
    if (!applicable_from || !outlet_code || !period_code || !period_name || !start_time || !end_time) {
        return res.status(400).json({ 
            success: false, 
            message: 'Applicable from, outlet code, period code, period name, start time and end time are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_BUSINESS_PERIODS 
                   (applicable_from, outlet_code, period_code, period_name, short_name, 
                    start_time, end_time, active_days, is_active) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [
        applicable_from, outlet_code, period_code, period_name, short_name,
        start_time, end_time, JSON.stringify(active_days), is_active
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Period code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create business period');
        }
        res.json({ 
            success: true, 
            message: 'Business period created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/business-periods/:id', (req, res) => {
    const { id } = req.params;
    const { 
        applicable_from,
        outlet_code,
        period_code, 
        period_name, 
        short_name,
        start_time,
        end_time,
        active_days = {},
        is_active = true
    } = req.body;
    
    const query = `UPDATE IT_CONF_BUSINESS_PERIODS 
                   SET applicable_from = ?, outlet_code = ?, period_code = ?, period_name = ?, 
                       short_name = ?, start_time = ?, end_time = ?, active_days = ?, is_active = ?
                   WHERE id = ?`;
    
    db.query(query, [
        applicable_from, outlet_code, period_code, period_name, short_name,
        start_time, end_time, JSON.stringify(active_days), is_active, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update business period');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Business period not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Business period updated successfully' 
        });
    });
});

app.delete('/api/business-periods/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_BUSINESS_PERIODS WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'delete business period');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Business period not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Business period deleted successfully' 
        });
    });
});

// HEALTH CHECK ENDPOINT
// ========================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'POS Backend Server is running',
        timestamp: new Date().toISOString(),
        database: 'Connected'
    });
});

// ========================================
// ERROR HANDLING MIDDLEWARE (ADDED)
// ========================================
app.use(errorLogger);          // Log all errors

// ========================================
// SERVER STARTUP
// ========================================
app.listen(PORT, () => {
    console.log(`🚀 POS Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Total API endpoints: 12 modules with full CRUD operations`);
    
    // Log system startup (ADDED)
    logSystem.startup(PORT, process.env.NODE_ENV || 'development');
    console.log('✅ app.listen callback executed');
});

// ========================================
// GRACEFUL SHUTDOWN LOGGING (ADDED)
// ========================================
process.on('SIGTERM', () => {
    logSystem.shutdown('SIGTERM received');
    process.exit(0);
});

process.on('SIGINT', () => {
    logSystem.shutdown('SIGINT received (Ctrl+C)');
    process.exit(0);
});

module.exports = app;