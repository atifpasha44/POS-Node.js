const mysql = require('mysql2/promise');

async function renameBusinessPeriodsTable() {
    let connection;
    
    try {
        console.log('🔄 Renaming Outlet Business Periods table...\n');
        console.log('📝 Changing: IT_CONF_OUTSES → IT_CONF_BUSINESS_PERIODS');
        console.log('   (To better match form name "Outlet Business Periods")\n');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3307,
            user: 'root',
            password: 'Jaheed@9',
            database: 'pos_db'
        });
        
        console.log('✅ Connected to database');
        
        // 1. Backup existing table
        console.log('📦 Creating backup of existing data...');
        try {
            await connection.execute('DROP TABLE IF EXISTS IT_CONF_OUTSES_OLD_BACKUP');
            await connection.execute(`
                CREATE TABLE IT_CONF_OUTSES_OLD_BACKUP AS 
                SELECT * FROM IT_CONF_OUTSES WHERE 1=1
            `);
            console.log('✅ Backup created: IT_CONF_OUTSES_OLD_BACKUP');
        } catch (err) {
            console.log('ℹ️  No existing data to backup (this is fine)');
        }
        
        // 2. Create new table with better name
        console.log('🏗️  Creating new table: IT_CONF_BUSINESS_PERIODS...');
        await connection.execute('DROP TABLE IF EXISTS IT_CONF_BUSINESS_PERIODS');
        
        await connection.execute(`
            CREATE TABLE IT_CONF_BUSINESS_PERIODS (
                id INT AUTO_INCREMENT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                -- Form fields - exact match with OutletBusinessPeriods.js frontend
                applicable_from DATE NOT NULL,               -- Applicable From date
                outlet_code VARCHAR(10) NOT NULL,            -- Outlet Code (links to IT_CONF_OUTSET)
                period_code VARCHAR(10) NOT NULL UNIQUE,     -- Period Code (unique identifier)
                period_name VARCHAR(50) NOT NULL,            -- Period Name
                short_name VARCHAR(20),                      -- Short Name
                start_time TIME NOT NULL,                    -- Start Time (HH:MM:SS)
                end_time TIME NOT NULL,                      -- End Time (HH:MM:SS)
                active_days JSON,                            -- Active Days (sunday, monday, etc.)
                is_active BOOLEAN DEFAULT TRUE,              -- Active status
                
                -- Relationships and indexes
                INDEX idx_outlet_code (outlet_code),
                INDEX idx_period_code (period_code),
                INDEX idx_applicable_from (applicable_from),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ New table created: IT_CONF_BUSINESS_PERIODS');
        
        // 3. Migrate data if any exists
        console.log('📊 Migrating data from old table...');
        try {
            const [rows] = await connection.execute(`
                INSERT INTO IT_CONF_BUSINESS_PERIODS (
                    applicable_from, outlet_code, period_code, period_name, short_name,
                    start_time, end_time, active_days, is_active, created_at, updated_at
                )
                SELECT 
                    applicable_from, outlet_code, period_code, period_name, short_name,
                    start_time, end_time, active_days, is_active, created_at, updated_at
                FROM IT_CONF_OUTSES
                WHERE 1=1
            `);
            console.log(`✅ Migrated ${rows.affectedRows} records`);
        } catch (err) {
            console.log('ℹ️  No data to migrate (table was empty)');
        }
        
        // 4. Drop old table
        console.log('🗑️  Dropping old table: IT_CONF_OUTSES...');
        await connection.execute('DROP TABLE IF EXISTS IT_CONF_OUTSES');
        console.log('✅ Old table dropped');
        
        // 5. Verification
        console.log('\n🔍 Verification:');
        
        // Check new table structure
        const [structure] = await connection.execute('DESCRIBE IT_CONF_BUSINESS_PERIODS');
        console.log('✅ New table structure verified:');
        structure.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Check data count
        const [count] = await connection.execute('SELECT COUNT(*) as record_count FROM IT_CONF_BUSINESS_PERIODS');
        console.log(`\n✅ Records in new table: ${count[0].record_count}`);
        
        console.log('\n🎉 Table rename completed successfully!');
        console.log('\n📋 What changed:');
        console.log('   ❌ OLD: IT_CONF_OUTSES');
        console.log('   ✅ NEW: IT_CONF_BUSINESS_PERIODS');
        console.log('\n📝 Next steps:');
        console.log('   1. Update backend API queries to use new table name');
        console.log('   2. Test the Outlet Business Periods form');
        console.log('   3. Verify data saves to new table correctly');
        
    } catch (error) {
        console.error('❌ Error renaming business periods table:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure MySQL server is running');
        console.error('2. Check database credentials in this script');
        console.error('3. Ensure pos_db database exists');
        console.error('4. Check if table is locked by other processes');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the rename
renameBusinessPeriodsTable();