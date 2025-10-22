const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Jaheed@9',
    database: 'pos_db'
});

async function fixOutletDropdown() {
    console.log('🔍 Investigating Outlet Dropdown Issue...');
    
    try {
        // Check if IT_CONF_OUTSET table exists
        console.log('\n1. Checking if IT_CONF_OUTSET table exists...');
        const [tables] = await db.promise().query("SHOW TABLES LIKE 'IT_CONF_OUTSET'");
        
        if (tables.length === 0) {
            console.log('❌ IT_CONF_OUTSET table does not exist!');
            console.log('Creating the table...');
            
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS IT_CONF_OUTSET (
                    APPDAT DECIMAL(8,0) NOT NULL,
                    OUTCODE VARCHAR(3) NOT NULL,
                    OUTNAME VARCHAR(30) DEFAULT ' ',
                    SHTNAM VARCHAR(10) DEFAULT ' ',
                    OUTTYPE DECIMAL(1,0) DEFAULT 1,
                    BILInitial VARCHAR(2) DEFAULT '0',
                    OUTSET DECIMAL(6,0) DEFAULT 0,
                    ActiveStatus TINYINT(1) NOT NULL DEFAULT 1,
                    PRIMARY KEY (APPDAT, OUTCODE)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;
            
            await db.promise().query(createTableQuery);
            console.log('✅ IT_CONF_OUTSET table created successfully');
        } else {
            console.log('✅ IT_CONF_OUTSET table exists');
        }
        
        // Check current data in the table
        console.log('\n2. Checking current data in IT_CONF_OUTSET...');
        const [currentData] = await db.promise().query('SELECT * FROM IT_CONF_OUTSET');
        console.log(`Found ${currentData.length} records in IT_CONF_OUTSET`);
        
        if (currentData.length > 0) {
            console.log('Current records:');
            currentData.forEach((record, index) => {
                console.log(`  ${index + 1}. Code: ${record.OUTCODE}, Name: ${record.OUTNAME}, Active: ${record.ActiveStatus}`);
            });
        }
        
        // Check active records specifically
        console.log('\n3. Checking active records (ActiveStatus = 1)...');
        const [activeRecords] = await db.promise().query('SELECT * FROM IT_CONF_OUTSET WHERE ActiveStatus = 1');
        console.log(`Found ${activeRecords.length} active records`);
        
        if (activeRecords.length === 0) {
            console.log('\n❌ No active outlet records found! This is why the dropdown is empty.');
            console.log('🔧 Adding sample outlet data...');
            
            const currentDate = new Date();
            const appdat = parseInt(currentDate.getFullYear().toString() + 
                         (currentDate.getMonth() + 1).toString().padStart(2, '0') + 
                         currentDate.getDate().toString().padStart(2, '0'));
            
            const sampleOutlets = [
                { code: 'R01', name: 'Restaurant Main', shortName: 'REST', type: 1, billInitial: 'R1', outset: 1 },
                { code: 'B01', name: 'Bar Counter', shortName: 'BAR', type: 2, billInitial: 'B1', outset: 2 },
                { code: 'K01', name: 'Kitchen', shortName: 'KITCHEN', type: 3, billInitial: 'K1', outset: 3 },
                { code: 'T01', name: 'Takeaway', shortName: 'TAKEAWAY', type: 4, billInitial: 'T1', outset: 4 },
                { code: 'D01', name: 'Delivery', shortName: 'DELIVERY', type: 5, billInitial: 'D1', outset: 5 }
            ];
            
            for (const outlet of sampleOutlets) {
                const insertQuery = `
                    INSERT INTO IT_CONF_OUTSET 
                    (APPDAT, OUTCODE, OUTNAME, SHTNAM, OUTTYPE, BILInitial, OUTSET, ActiveStatus) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                `;
                
                try {
                    await db.promise().query(insertQuery, [
                        appdat,
                        outlet.code,
                        outlet.name,
                        outlet.shortName,
                        outlet.type,
                        outlet.billInitial,
                        outlet.outset
                    ]);
                    console.log(`  ✅ Added outlet: ${outlet.code} - ${outlet.name}`);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`  ⚠️  Outlet ${outlet.code} already exists, skipping...`);
                    } else {
                        console.error(`  ❌ Error adding outlet ${outlet.code}:`, error.message);
                    }
                }
            }
            
            console.log('\n4. Verifying the fix...');
            const [newActiveRecords] = await db.promise().query('SELECT * FROM IT_CONF_OUTSET WHERE ActiveStatus = 1');
            console.log(`✅ Now found ${newActiveRecords.length} active outlet records`);
            
        } else {
            console.log('✅ Active outlet records exist, dropdown should work');
            activeRecords.forEach((record, index) => {
                console.log(`  ${index + 1}. Code: ${record.OUTCODE}, Name: ${record.OUTNAME}`);
            });
        }
        
        // Test the API endpoint format
        console.log('\n5. Testing API query format...');
        const apiQuery = 'SELECT OUTCODE as outlet_code, OUTNAME as outlet_name, SHTNAM as short_name, OUTTYPE as outlet_type, BILInitial as bill_initial, OUTSET as outlet_set, ActiveStatus as is_active FROM IT_CONF_OUTSET WHERE ActiveStatus = 1 ORDER BY OUTCODE';
        const [apiResults] = await db.promise().query(apiQuery);
        
        console.log(`API query returned ${apiResults.length} records:`);
        apiResults.forEach((record, index) => {
            console.log(`  ${index + 1}. outlet_code: ${record.outlet_code}, outlet_name: ${record.outlet_name}, is_active: ${record.is_active}`);
        });
        
        if (apiResults.length > 0) {
            console.log('\n🎉 SUCCESS: Outlet dropdown should now work!');
            console.log('The API will return:', JSON.stringify(apiResults, null, 2));
        } else {
            console.log('\n❌ STILL NO DATA: There may be another issue');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.end();
        console.log('\n🔚 Database connection closed');
    }
}

// Run the fix
fixOutletDropdown();