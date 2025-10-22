// Backend Diagnostic Script
// Run this to check what's preventing the backend from starting

const mysql = require('mysql2');

console.log('🔍 POS Backend Diagnostic Tool');
console.log('=====================================\n');

// Test 1: Check if MySQL is running on port 3307
console.log('1. Testing MySQL connection on port 3307...');

const db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Jaheed@9',
    database: 'pos_db'
});

db.connect((err) => {
    if (err) {
        console.error('❌ MySQL connection failed on port 3307:', err.message);
        console.log('\n💡 Possible solutions:');
        console.log('   - Check if MySQL/XAMPP is running');
        console.log('   - Verify MySQL is running on port 3307 (not default 3306)');
        console.log('   - Check username/password: root/Jaheed@9');
        console.log('   - Verify database "pos_db" exists');
        
        // Try alternative port 3306
        console.log('\n2. Testing MySQL connection on default port 3306...');
        const db2 = mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'Jaheed@9',
            database: 'pos_db'
        });
        
        db2.connect((err2) => {
            if (err2) {
                console.error('❌ MySQL connection also failed on port 3306:', err2.message);
                console.log('\n🚨 MySQL Server Issues:');
                console.log('   - MySQL server is not running');
                console.log('   - Start XAMPP/WAMP and enable MySQL');
                console.log('   - Or start MySQL service manually');
            } else {
                console.log('✅ MySQL is running on port 3306 (not 3307)!');
                console.log('\n🔧 Fix: Update backend/index.js to use port 3306 instead of 3307');
                
                // Test database and table
                db2.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY', (err3, results) => {
                    if (err3) {
                        console.error('❌ Table IT_CONF_PROPERTY not found:', err3.message);
                        console.log('💡 Run the database initialization script to create tables');
                    } else {
                        console.log(`✅ IT_CONF_PROPERTY table exists with ${results[0].count} records`);
                    }
                    db2.end();
                });
            }
        });
        
    } else {
        console.log('✅ MySQL connection successful on port 3307!');
        
        // Test if the IT_CONF_PROPERTY table exists and has data
        db.query('SELECT COUNT(*) as count FROM IT_CONF_PROPERTY', (err2, results) => {
            if (err2) {
                console.error('❌ Table IT_CONF_PROPERTY not found:', err2.message);
                console.log('💡 Run the database initialization script to create tables');
            } else {
                console.log(`✅ IT_CONF_PROPERTY table exists with ${results[0].count} records`);
                
                if (results[0].count === 0) {
                    console.log('\n📝 Table is empty - this is why you don\'t see records!');
                    console.log('💡 Run the restoration script: node restore_records.js');
                } else {
                    console.log('\n🎉 Records exist in database!');
                    console.log('💡 Issue might be with frontend API calls or response handling');
                }
            }
            
            db.end();
        });
    }
});

// Test 2: Check if port 3001 is available for backend
console.log('\n3. Testing if port 3001 is available...');
const net = require('net');
const server = net.createServer();

server.listen(3001, (err) => {
    if (err) {
        console.error('❌ Port 3001 is already in use');
        console.log('💡 Kill any process using port 3001: npx kill-port 3001');
    } else {
        console.log('✅ Port 3001 is available for backend server');
        server.close();
    }
});

setTimeout(() => {
    console.log('\n🏁 Diagnostic complete!');
    console.log('\nNext steps:');
    console.log('1. Fix any MySQL connection issues shown above');
    console.log('2. Start backend: cd backend && node index.js');
    console.log('3. Restore records: node restore_records.js');
    console.log('4. Test frontend Property Setup');
}, 3000);