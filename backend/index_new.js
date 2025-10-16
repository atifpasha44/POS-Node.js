const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

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
    secret: 'pos-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ========================================
// DATABASE CONNECTION
// ========================================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pos_system'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL database');
});

// ========================================
// DATABASE INITIALIZATION
// ========================================
const initializeDatabase = async () => {
    try {
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
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

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
    const query = 'SELECT * FROM IT_CONF_OUTSET ORDER BY outlet_code, applicable_from DESC';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch outlet setup');
        res.json({ success: true, data: results });
    });
});

app.post('/api/outlet-setup', (req, res) => {
    const { 
        applicable_from, 
        outlet_code, 
        outlet_name, 
        short_name, 
        outlet_type = 'Restaurant', 
        bill_initial, 
        outlet_setting, 
        options, 
        inactive = 0 
    } = req.body;
    
    if (!applicable_from || !outlet_code || !outlet_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Applicable from, outlet code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_OUTSET 
                   (applicable_from, outlet_code, outlet_name, short_name, outlet_type, 
                    bill_initial, outlet_setting, options, inactive, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        applicable_from, outlet_code, outlet_name, short_name, outlet_type, 
        bill_initial, JSON.stringify(outlet_setting), JSON.stringify(options), inactive
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Outlet code with this date already exists' 
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
        applicable_from, 
        outlet_code, 
        outlet_name, 
        short_name, 
        outlet_type, 
        bill_initial, 
        outlet_setting, 
        options, 
        inactive 
    } = req.body;
    
    const query = `UPDATE IT_CONF_OUTSET 
                   SET applicable_from = ?, outlet_code = ?, outlet_name = ?, 
                       short_name = ?, outlet_type = ?, bill_initial = ?, 
                       outlet_setting = ?, options = ?, inactive = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        applicable_from, outlet_code, outlet_name, short_name, outlet_type, 
        bill_initial, JSON.stringify(outlet_setting), JSON.stringify(options), inactive, id
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
// TAX CODES API
// ========================================
app.get('/api/tax-codes', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_TAXCODE ORDER BY tax_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch tax codes');
        res.json({ success: true, data: results });
    });
});

app.post('/api/tax-codes', (req, res) => {
    const { 
        tax_code, 
        tax_name, 
        tax_name_alternate, 
        tax_group_name, 
        tax_percentage = 0, 
        is_active = 1 
    } = req.body;
    
    if (!tax_code || !tax_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tax code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_TAXCODE 
                   (tax_code, tax_name, tax_name_alternate, tax_group_name, 
                    tax_percentage, is_active, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        tax_code, tax_name, tax_name_alternate, tax_group_name, tax_percentage, is_active
    ], (err, result) => {
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
            message: 'Tax code created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/tax-codes/:id', (req, res) => {
    const { id } = req.params;
    const { 
        tax_code, 
        tax_name, 
        tax_name_alternate, 
        tax_group_name, 
        tax_percentage, 
        is_active 
    } = req.body;
    
    const query = `UPDATE IT_CONF_TAXCODE 
                   SET tax_code = ?, tax_name = ?, tax_name_alternate = ?, 
                       tax_group_name = ?, tax_percentage = ?, is_active = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        tax_code, tax_name, tax_name_alternate, tax_group_name, tax_percentage, is_active, id
    ], (err, result) => {
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

app.delete('/api/tax-codes/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_TAXCODE WHERE id = ?';
    db.query(query, [id], (err, result) => {
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
// TAX STRUCTURE API
// ========================================
app.get('/api/tax-structure', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_TAXSTRUCTURE ORDER BY tax_structure_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch tax structure');
        res.json({ success: true, data: results });
    });
});

app.post('/api/tax-structure', (req, res) => {
    const { 
        tax_structure_code, 
        tax_structure_name, 
        outlet_code, 
        menu_type, 
        serial_number, 
        short_tax, 
        tax_code, 
        calculation_type = 'Percentage', 
        amount = 0, 
        target_tax = 0, 
        is_active = 1 
    } = req.body;
    
    if (!tax_structure_code || !tax_structure_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tax structure code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_TAXSTRUCTURE 
                   (tax_structure_code, tax_structure_name, outlet_code, menu_type, 
                    serial_number, short_tax, tax_code, calculation_type, amount, 
                    target_tax, is_active, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        tax_structure_code, tax_structure_name, outlet_code, menu_type, 
        serial_number, short_tax, tax_code, calculation_type, amount, 
        target_tax, is_active
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tax structure code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create tax structure');
        }
        res.json({ 
            success: true, 
            message: 'Tax structure created successfully',
            id: result.insertId 
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
        
        res.json({ 
            success: true, 
            message: 'Tax structure updated successfully' 
        });
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
// UNIT OF MEASUREMENT API
// ========================================
app.get('/api/uom', (req, res) => {
    const query = 'SELECT * FROM IT_CONF_UOM ORDER BY uom_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch UOM');
        res.json({ success: true, data: results });
    });
});

app.post('/api/uom', (req, res) => {
    const { 
        uom_code, 
        uom_name, 
        container_unit, 
        container_size, 
        contained_unit, 
        is_active = 1 
    } = req.body;
    
    if (!uom_code || !uom_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'UOM code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_UOM 
                   (uom_code, uom_name, container_unit, container_size, 
                    contained_unit, is_active, created_by) 
                   VALUES (?, ?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        uom_code, uom_name, container_unit, container_size, contained_unit, is_active
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'UOM code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create UOM');
        }
        res.json({ 
            success: true, 
            message: 'UOM created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/uom/:id', (req, res) => {
    const { id } = req.params;
    const { 
        uom_code, 
        uom_name, 
        container_unit, 
        container_size, 
        contained_unit, 
        is_active 
    } = req.body;
    
    const query = `UPDATE IT_CONF_UOM 
                   SET uom_code = ?, uom_name = ?, container_unit = ?, 
                       container_size = ?, contained_unit = ?, is_active = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        uom_code, uom_name, container_unit, container_size, contained_unit, is_active, id
    ], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update UOM');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'UOM not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'UOM updated successfully' 
        });
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
    const query = 'SELECT * FROM IT_CONF_REASONS ORDER BY reason_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch reason codes');
        res.json({ success: true, data: results });
    });
});

app.post('/api/reason-codes', (req, res) => {
    const { reason_code, reason_name, reason_type, is_active = 1 } = req.body;
    
    if (!reason_code || !reason_name || !reason_type) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reason code, name and type are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_REASONS 
                   (reason_code, reason_name, reason_type, is_active, created_by) 
                   VALUES (?, ?, ?, ?, 'admin')`;
    
    db.query(query, [reason_code, reason_name, reason_type, is_active], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Reason code already exists' 
                });
            }
            return handleDatabaseError(res, err, 'create reason code');
        }
        res.json({ 
            success: true, 
            message: 'Reason code created successfully',
            id: result.insertId 
        });
    });
});

app.put('/api/reason-codes/:id', (req, res) => {
    const { id } = req.params;
    const { reason_code, reason_name, reason_type, is_active } = req.body;
    
    const query = `UPDATE IT_CONF_REASONS 
                   SET reason_code = ?, reason_name = ?, reason_type = ?, 
                       is_active = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [reason_code, reason_name, reason_type, is_active, id], (err, result) => {
        if (err) return handleDatabaseError(res, err, 'update reason code');
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Reason code not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Reason code updated successfully' 
        });
    });
});

app.delete('/api/reason-codes/:id', (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM IT_CONF_REASONS WHERE id = ?';
    db.query(query, [id], (err, result) => {
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
    const query = 'SELECT * FROM IT_CONF_CCM ORDER BY card_code';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch credit cards');
        res.json({ success: true, data: results });
    });
});

app.post('/api/credit-cards', (req, res) => {
    const { 
        card_code, 
        card_name, 
        commission_percentage = 0, 
        settlement_days = 0, 
        is_active = 1 
    } = req.body;
    
    if (!card_code || !card_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Card code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_CCM 
                   (card_code, card_name, commission_percentage, settlement_days, is_active, created_by) 
                   VALUES (?, ?, ?, ?, ?, 'admin')`;
    
    db.query(query, [
        card_code, card_name, commission_percentage, settlement_days, is_active
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
    const { card_code, card_name, commission_percentage, settlement_days, is_active } = req.body;
    
    const query = `UPDATE IT_CONF_CCM 
                   SET card_code = ?, card_name = ?, commission_percentage = ?, 
                       settlement_days = ?, is_active = ?, modified_by = 'admin'
                   WHERE id = ?`;
    
    db.query(query, [
        card_code, card_name, commission_percentage, settlement_days, is_active, id
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
    
    const query = 'DELETE FROM IT_CONF_CCM WHERE id = ?';
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
    const query = 'SELECT * FROM IT_CONF_PROPERTY ORDER BY applicable_from DESC';
    db.query(query, (err, results) => {
        if (err) return handleDatabaseError(res, err, 'fetch property codes');
        res.json({ success: true, data: results });
    });
});

app.post('/api/property-codes', (req, res) => {
    const { 
        applicable_from, property_code, property_name, nick_name, owner_name, 
        address_name, gst_number, pan_number, group_name, local_currency, 
        currency_format, symbol, decimal_places, date_format, round_off, property_logo 
    } = req.body;
    
    if (!applicable_from || !property_code || !property_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'Applicable from, property code and name are required' 
        });
    }

    const query = `INSERT INTO IT_CONF_PROPERTY 
                   (applicable_from, property_code, property_name, nick_name, owner_name, 
                    address_name, gst_number, pan_number, group_name, local_currency, 
                    currency_format, symbol, decimal_places, date_format, round_off, property_logo) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [
        applicable_from, property_code, property_name, nick_name, owner_name, 
        address_name, gst_number, pan_number, group_name, local_currency, 
        currency_format, symbol, decimal_places, date_format, round_off, property_logo
    ], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Property code with this date already exists' 
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
        currency_format, symbol, decimal_places, date_format, round_off, property_logo 
    } = req.body;
    
    const query = `UPDATE IT_CONF_PROPERTY 
                   SET applicable_from = ?, property_code = ?, property_name = ?, 
                       nick_name = ?, owner_name = ?, address_name = ?, gst_number = ?, 
                       pan_number = ?, group_name = ?, local_currency = ?, currency_format = ?, 
                       symbol = ?, decimal_places = ?, date_format = ?, round_off = ?, property_logo = ?
                   WHERE id = ?`;
    
    db.query(query, [
        applicable_from, property_code, property_name, nick_name, owner_name, 
        address_name, gst_number, pan_number, group_name, local_currency, 
        currency_format, symbol, decimal_places, date_format, round_off, property_logo, id
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
// SERVER STARTUP
// ========================================
app.listen(PORT, () => {
    console.log(`🚀 POS Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 Total API endpoints: 12 modules with full CRUD operations`);
});

module.exports = app;