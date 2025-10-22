const mysql = require('mysql2/promise');

async function rebuildBusinessPeriodsTable() {
    let connection;
    
    try {
        console.log('🔄 Starting Outlet Business Periods table rebuild...\n');
        
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
            await connection.execute('DROP TABLE IF EXISTS IT_CONF_OUTSES_BACKUP');
            await connection.execute(`
                CREATE TABLE IT_CONF_OUTSES_BACKUP AS 
                SELECT * FROM IT_CONF_OUTSES WHERE 1=1
            `);
            console.log('✅ Backup created: IT_CONF_OUTSES_BACKUP');
        } catch (err) {
            console.log('ℹ️  No existing table to backup (this is fine for new setup)');
        }
        
        // 2. Drop existing table
        console.log('🗑️  Dropping existing IT_CONF_OUTSES table...');
        await connection.execute('DROP TABLE IF EXISTS IT_CONF_OUTSES');
        console.log('✅ Old table dropped');
        
        // 3. Create new table with correct schema
        console.log('🏗️  Creating new IT_CONF_OUTSES table with correct schema...');
        await connection.execute(`
            CREATE TABLE IT_CONF_OUTSES (
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
        console.log('✅ New table structure created');
        
        // 4. No sample data added (as requested by user)
        console.log('📝 Keeping table clean - no sample data added as requested');
        
        // 5. Verification
        console.log('\n🔍 Verification:');
        
        // Check table structure
        const [structure] = await connection.execute('DESCRIBE IT_CONF_OUTSES');
        console.log('✅ Table structure verified:');
        structure.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Check data count
        const [count] = await connection.execute('SELECT COUNT(*) as record_count FROM IT_CONF_OUTSES');
        console.log(`\n✅ Table is clean: ${count[0].record_count} records (no sample data)`);
        
        console.log('\n🎉 Outlet Business Periods table rebuild completed successfully!');
        console.log('\n📋 What to do next:');
        console.log('   1. Backend APIs will be added to index.js');
        console.log('   2. Frontend component will be converted to database-first');
        console.log('   3. Business periods will save to database instead of localStorage');
        console.log('   4. Data will persist across browser sessions');
        console.log('   5. Foreign key relationship with outlets established');
        
    } catch (error) {
        console.error('❌ Error rebuilding business periods table:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Make sure MySQL server is running');
        console.error('2. Check database credentials in this script');
        console.error('3. Ensure pos_db database exists');
        console.error('4. Ensure IT_CONF_OUTSET table exists (for foreign key)');
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the rebuild
rebuildBusinessPeriodsTable();