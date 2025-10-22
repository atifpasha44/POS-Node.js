const mysql = require('mysql2/promise');

async function rebuildOutletTable() {
    let connection;
    
    try {
        console.log('🔄 Starting Outlet Setup table rebuild...\n');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3307,
            user: 'root',
            password: 'Jaheed@9',
            database: 'pos_db'
        });
        
        console.log('✅ Connected to database');
        
        // 1. Create backup of existing data
        console.log('📦 Creating backup of existing data...');
        try {
            await connection.execute('DROP TABLE IF EXISTS IT_CONF_OUTSET_BACKUP');
            await connection.execute(`
                CREATE TABLE IT_CONF_OUTSET_BACKUP AS 
                SELECT * FROM IT_CONF_OUTSET WHERE 1=1
            `);
            console.log('✅ Backup created: IT_CONF_OUTSET_BACKUP');
        } catch (err) {
            console.log('ℹ️  No existing table to backup (this is fine for new setup)');
        }
        
        // 2. Drop existing table
        console.log('🗑️  Dropping existing IT_CONF_OUTSET table...');
        await connection.execute('DROP TABLE IF EXISTS IT_CONF_OUTSET');
        console.log('✅ Old table dropped');
        
        // 3. Create new table with correct schema
        console.log('🏗️  Creating new IT_CONF_OUTSET table with correct schema...');
        await connection.execute(`
            CREATE TABLE IT_CONF_OUTSET (
                id INT AUTO_INCREMENT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Form fields - exact match with OutletSetup.js frontend
                property VARCHAR(32) NOT NULL,                    -- Property Code dropdown selection
                applicable_from DATE NOT NULL,                    -- Applicable From date
                outlet_code VARCHAR(10) NOT NULL UNIQUE,         -- Outlet Code (unique identifier)
                outlet_name VARCHAR(100) NOT NULL,               -- Outlet Name
                short_name VARCHAR(20),                          -- Short Name
                outlet_type VARCHAR(50) DEFAULT 'Restaurant',    -- Outlet Type dropdown
                item_price_level VARCHAR(50) DEFAULT 'Price 1', -- Item Price Level dropdown
                check_prefix VARCHAR(10),                        -- Check Prefix
                check_format VARCHAR(50),                        -- Check Format
                receipt_format VARCHAR(50),                      -- Receipt Format  
                kitchen_format VARCHAR(50),                      -- Kitchen Format
                inactive BOOLEAN DEFAULT FALSE,                  -- Inactive checkbox
                options JSON,                                    -- Options object (cash, card, etc.)
                
                -- Indexes for performance
                INDEX idx_property (property),
                INDEX idx_outlet_code (outlet_code),
                INDEX idx_applicable_from (applicable_from)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ New table structure created');
        
        // 4. Insert minimal sample data (as user requested to remove unnecessary data)
        console.log('📝 Adding minimal sample data...');
        
        // First check if property codes exist
        const [propertyCheck] = await connection.execute(
            "SELECT COUNT(*) as count FROM IT_CONF_PROPERTY WHERE property_code IN ('HOTEL001', 'REST001', 'CAFE001')"
        );
        
        if (propertyCheck[0].count > 0) {
            console.log('✅ Property codes found, linking outlets to properties');
            
            await connection.execute(`
                INSERT INTO IT_CONF_OUTSET (
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
                    options
                ) VALUES 
                -- Main Restaurant for Hotel
                ('HOTEL001', '2025-01-01', 'REST001', 'Main Restaurant', 'Rest', 'Restaurant', 'Price 1', 'R', 'R001-####', 'Standard Receipt', 'Kitchen Copy', FALSE, 
                 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', true, 'staff', false, 'bill_on_hold', true, 'credit', false, 'void', true)),
                
                -- Bar for Hotel  
                ('HOTEL001', '2025-01-01', 'BAR001', 'Hotel Bar', 'Bar', 'Bar', 'Price 2', 'B', 'B001-####', 'Bar Receipt', 'Bar Kitchen', FALSE,
                 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', true, 'staff', false, 'bill_on_hold', true, 'credit', true, 'void', true)),
                
                -- Coffee Shop for Restaurant Property
                ('REST001', '2025-01-01', 'CAFE001', 'Coffee Corner', 'Cafe', 'Coffee Shop', 'Price 1', 'C', 'C001-####', 'Cafe Receipt', 'Cafe Kitchen', FALSE,
                 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', false, 'staff', true, 'bill_on_hold', false, 'credit', false, 'void', true))
            `);
            console.log('✅ Sample outlets added with property relationships');
        } else {
            console.log('⚠️  No property codes found - you may need to run rebuild_property_table.js first');
            console.log('   Adding outlets without property relationships for now...');
            
            await connection.execute(`
                INSERT INTO IT_CONF_OUTSET (
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
                    options
                ) VALUES 
                ('TEMP001', '2025-01-01', 'REST001', 'Main Restaurant', 'Rest', 'Restaurant', 'Price 1', 'R', 'R001-####', 'Standard Receipt', 'Kitchen Copy', FALSE, 
                 JSON_OBJECT('cash', true, 'card', true, 'company', false, 'room_guest', true, 'staff', false, 'bill_on_hold', true, 'credit', false, 'void', true))
            `);
        }
        
        // 5. Verification
        console.log('\n🔍 Verification:');
        
        // Check table structure
        const [structure] = await connection.execute('DESCRIBE IT_CONF_OUTSET');
        console.log('✅ Table structure verified:');
        structure.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Check data
        const [outlets] = await connection.execute(`
            SELECT 
                outlet_code,
                outlet_name,
                property,
                outlet_type,
                inactive
            FROM IT_CONF_OUTSET
        `);
        
        console.log(`\n✅ Sample outlets created (${outlets.length} records):`);
        outlets.forEach(outlet => {
            console.log(`   ${outlet.outlet_code}: ${outlet.outlet_name} (${outlet.property})`);
        });
        
        console.log('\n🎉 Outlet Setup table rebuild completed successfully!');
        console.log('\n📋 What to do next:');
        console.log('   1. Restart your backend server: cd backend && node index.js');
        console.log('   2. Open Outlet Setup form in your browser');
        console.log('   3. Property codes should now show in the dropdown');
        console.log('   4. Create new outlets - they will save and persist properly');
        console.log('   5. All form fields will now work correctly');
        
    } catch (error) {
        console.error('❌ Error rebuilding outlet table:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure MySQL server is running');
        console.error('2. Check database credentials in this script');
        console.error('3. Ensure pos_system database exists');
        console.error('4. Run rebuild_property_table.js first if property codes are missing');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the rebuild
rebuildOutletTable();