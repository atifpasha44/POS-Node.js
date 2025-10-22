// Property Table Rebuild Script
// This script will drop and recreate the IT_CONF_PROPERTY table with the correct schema

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

console.log('🔧 Property Table Rebuild Tool');
console.log('=====================================\n');

// Database connection - using the same config as backend
const db = mysql.createConnection({
    host: 'localhost',
    port: 3307, // Try 3307 first, then 3306 if it fails
    user: 'root',
    password: 'Jaheed@9',
    database: 'pos_db',
    multipleStatements: true
});

const connectAndRebuild = (port) => {
    const connection = mysql.createConnection({
        host: 'localhost',
        port: port,
        user: 'root',
        password: 'Jaheed@9',
        database: 'pos_db',
        multipleStatements: true
    });

    connection.connect((err) => {
        if (err) {
            if (port === 3307) {
                console.log('❌ Failed to connect on port 3307, trying 3306...');
                connectAndRebuild(3306);
                return;
            } else {
                console.error('❌ Database connection failed on both ports:', err.message);
                console.log('\n💡 Please ensure MySQL is running and check credentials');
                return;
            }
        }

        console.log(`✅ Connected to MySQL database on port ${port}`);
        
        // Step 1: Backup existing data
        console.log('\n1. Checking for existing data...');
        connection.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY', (err, results) => {
            if (err) {
                console.log('ℹ️ Table does not exist or is empty - proceeding with creation');
            } else {
                console.log(`⚠️ Found ${results[0].count} existing records - they will be lost!`);
            }

            // Step 2: Drop and recreate table
            console.log('\n2. Dropping existing table...');
            const dropQuery = 'DROP TABLE IF EXISTS IT_CONF_PROPERTY';
            
            connection.query(dropQuery, (err) => {
                if (err) {
                    console.error('❌ Failed to drop table:', err.message);
                    connection.end();
                    return;
                }
                console.log('✅ Existing table dropped');

                // Step 3: Create new table with correct schema
                console.log('\n3. Creating new table with correct schema...');
                const createQuery = `
                    CREATE TABLE IT_CONF_PROPERTY (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        
                        applicable_from DATE,
                        property_code VARCHAR(32) NOT NULL UNIQUE,
                        property_name VARCHAR(128) NOT NULL,
                        nick_name VARCHAR(64),
                        owner_name VARCHAR(128),
                        address_name VARCHAR(256),
                        gst_number VARCHAR(32),
                        pan_number VARCHAR(32),
                        group_name VARCHAR(64),
                        local_currency VARCHAR(16) DEFAULT 'USD',
                        currency_format VARCHAR(16) DEFAULT 'en-US',
                        symbol VARCHAR(8) DEFAULT '$',
                        decimal_places INT DEFAULT 2,
                        date_format VARCHAR(16) DEFAULT 'MM/DD/YYYY',
                        round_off VARCHAR(16) DEFAULT '0.01',
                        property_logo VARCHAR(512),
                        
                        INDEX idx_property_code (property_code),
                        INDEX idx_applicable_from (applicable_from)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `;

                connection.query(createQuery, (err) => {
                    if (err) {
                        console.error('❌ Failed to create table:', err.message);
                        connection.end();
                        return;
                    }
                    console.log('✅ New table created successfully');

                    // Step 4: Insert sample data
                    console.log('\n4. Inserting sample data...');
                    const insertQuery = `
                        INSERT INTO IT_CONF_PROPERTY 
                        (applicable_from, property_code, property_name, nick_name, owner_name, address_name, 
                         gst_number, pan_number, group_name, local_currency, currency_format, symbol, 
                         decimal_places, date_format, round_off, property_logo) 
                        VALUES 
                        ('2024-01-01', 'HOTEL001', 'ABC Hotel', 'ABC Hotel', 'Hotel Owner', '123 Main Street, City', 
                         'GST123456789', 'ABCDE1234F', 'Hotel Group', 'USD', 'en-US', '$', 
                         2, 'MM/DD/YYYY', '0.01', ''),
                        ('2024-02-01', 'REST001', 'Downtown Restaurant', 'Downtown Restaurant', 'Restaurant Owner', '456 Food Street, Downtown', 
                         'GST987654321', 'FGHIJ5678K', 'Restaurant Group', 'USD', 'en-US', '$', 
                         2, 'MM/DD/YYYY', '0.01', ''),
                        ('2024-03-01', 'CAFE001', 'City Cafe', 'City Cafe', 'Cafe Owner', '789 Coffee Lane, City Center', 
                         'GST456789123', 'KLMNO9012P', 'Cafe Group', 'USD', 'en-US', '$', 
                         2, 'MM/DD/YYYY', '0.01', '')
                    `;

                    connection.query(insertQuery, (err) => {
                        if (err) {
                            console.error('❌ Failed to insert sample data:', err.message);
                        } else {
                            console.log('✅ Sample data inserted successfully');
                        }

                        // Step 5: Verify table structure
                        console.log('\n5. Verifying table structure...');
                        connection.query('DESCRIBE IT_CONF_PROPERTY', (err, results) => {
                            if (err) {
                                console.error('❌ Failed to describe table:', err.message);
                            } else {
                                console.log('✅ Table structure:');
                                console.table(results);
                            }

                            // Step 6: Show inserted records
                            connection.query('SELECT property_code, property_name, created_at FROM IT_CONF_PROPERTY ORDER BY property_code', (err, results) => {
                                if (err) {
                                    console.error('❌ Failed to select records:', err.message);
                                } else {
                                    console.log('\n✅ Inserted records:');
                                    console.table(results);
                                }

                                console.log('\n🎉 Table rebuild completed successfully!');
                                console.log('\nNext steps:');
                                console.log('1. Restart backend server: cd backend && node index.js');
                                console.log('2. Refresh Property Setup in browser');
                                console.log('3. You should see the 3 sample records');
                                console.log('4. Test creating new property "ABC" - it should persist now');

                                connection.end();
                            });
                        });
                    });
                });
            });
        });
    });
};

// Start the rebuild process
connectAndRebuild(3307);