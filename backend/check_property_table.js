const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Jaheed@9',
    database: 'pos_db'
});

async function checkPropertyTable() {
    console.log('🔍 Checking IT_CONF_PROPERTY table structure...\n');
    
    try {
        // Check if table exists
        const [tables] = await db.promise().query("SHOW TABLES LIKE 'IT_CONF_PROPERTY'");
        
        if (tables.length === 0) {
            console.log('❌ IT_CONF_PROPERTY table does not exist!');
            console.log('Creating the table...\n');
            
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS IT_CONF_PROPERTY (
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;
            
            await db.promise().query(createTableQuery);
            console.log('✅ IT_CONF_PROPERTY table created successfully\n');
        } else {
            console.log('✅ IT_CONF_PROPERTY table exists\n');
        }
        
        // Show table structure
        console.log('📋 Table structure:');
        const [columns] = await db.promise().query("DESCRIBE IT_CONF_PROPERTY");
        console.table(columns);
        
        // Check current data
        console.log('\n📊 Current data in table:');
        const [data] = await db.promise().query('SELECT * FROM IT_CONF_PROPERTY ORDER BY id');
        console.log(`Found ${data.length} records:`);
        if (data.length > 0) {
            console.table(data);
        } else {
            console.log('No data found. Adding sample record...\n');
            
            // Add sample property record
            const sampleData = {
                applicable_from: '2025-10-21',
                property_code: 'PROP001', 
                property_name: 'Sample Hotel Property',
                nick_name: 'Sample Hotel',
                owner_name: 'John Smith',
                address_name: '123 Main Street, City, State',
                gst_number: 'GST123456789',
                pan_number: 'PAN1234567',
                group_name: 'Hotel Group A',
                local_currency: 'USD',
                currency_format: '#,##0.00',
                symbol: '$',
                decimal_places: 2,
                date_format: 'DD/MM/YYYY',
                round_off: '0.01',
                property_logo: null
            };
            
            const insertQuery = `
                INSERT INTO IT_CONF_PROPERTY 
                (applicable_from, property_code, property_name, nick_name, owner_name, 
                 address_name, gst_number, pan_number, group_name, local_currency, 
                 currency_format, symbol, decimal_places, date_format, round_off, property_logo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            await db.promise().query(insertQuery, [
                sampleData.applicable_from, sampleData.property_code, sampleData.property_name,
                sampleData.nick_name, sampleData.owner_name, sampleData.address_name,
                sampleData.gst_number, sampleData.pan_number, sampleData.group_name,
                sampleData.local_currency, sampleData.currency_format, sampleData.symbol,
                sampleData.decimal_places, sampleData.date_format, sampleData.round_off,
                sampleData.property_logo
            ]);
            
            console.log('✅ Sample property record added successfully');
            
            // Show updated data
            const [newData] = await db.promise().query('SELECT * FROM IT_CONF_PROPERTY ORDER BY id');
            console.table(newData);
        }
        
        console.log('\n🎉 Property Code table is ready for testing!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.end();
    }
}

checkPropertyTable();