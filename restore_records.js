// Property Records Restoration Script
// Run this with: node restore_records.js

const axios = require('axios');

const propertyRecords = [
  {
    applicable_from: '2024-01-01',
    property_code: 'HOTEL001',
    property_name: 'ABC Hotel',
    nick_name: 'ABC Hotel',
    owner_name: 'Hotel Owner',
    address_name: '123 Main Street, City',
    gst_number: 'GST123456789',
    pan_number: 'ABCDE1234F',
    group_name: 'Hotel Group',
    local_currency: 'USD',
    currency_format: 'en-US',
    symbol: '$',
    decimal_places: 2,
    date_format: 'MM/DD/YYYY',
    round_off: '0.01',
    property_logo: ''
  },
  {
    applicable_from: '2024-02-01',
    property_code: 'REST001',
    property_name: 'Downtown Restaurant',
    nick_name: 'Downtown Restaurant',
    owner_name: 'Restaurant Owner',
    address_name: '456 Food Street, Downtown',
    gst_number: 'GST987654321',
    pan_number: 'FGHIJ5678K',
    group_name: 'Restaurant Group',
    local_currency: 'USD',
    currency_format: 'en-US',
    symbol: '$',
    decimal_places: 2,
    date_format: 'MM/DD/YYYY',
    round_off: '0.01',
    property_logo: ''
  },
  {
    applicable_from: '2024-03-01',
    property_code: 'CAFE001',
    property_name: 'City Cafe',
    nick_name: 'City Cafe',
    owner_name: 'Cafe Owner',
    address_name: '789 Coffee Lane, City Center',
    gst_number: 'GST456789123',
    pan_number: 'KLMNO9012P',
    group_name: 'Cafe Group',
    local_currency: 'USD',
    currency_format: 'en-US',
    symbol: '$',
    decimal_places: 2,
    date_format: 'MM/DD/YYYY',
    round_off: '0.01',
    property_logo: ''
  }
];

async function restorePropertyRecords() {
  const apiUrl = 'http://localhost:3001/api/property-codes';
  
  console.log('🔄 Starting property records restoration...');
  console.log(`📡 API Endpoint: ${apiUrl}`);
  
  for (let i = 0; i < propertyRecords.length; i++) {
    const record = propertyRecords[i];
    
    try {
      console.log(`\n📝 Inserting record ${i + 1}/3: ${record.property_code} - ${record.property_name}`);
      
      const response = await axios.post(apiUrl, record, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data.success) {
        console.log(`✅ Successfully inserted ${record.property_code} (ID: ${response.data.id})`);
      } else {
        console.log(`❌ Failed to insert ${record.property_code}: ${response.data.message}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Server error for ${record.property_code}: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        console.log(`❌ Network error for ${record.property_code}: Backend server not reachable`);
        console.log('💡 Make sure the backend server is running on http://localhost:3001');
        break; // Exit loop if backend is not reachable
      } else {
        console.log(`❌ Unexpected error for ${record.property_code}: ${error.message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Verify insertion by fetching all records
  try {
    console.log('\n🔍 Verifying restored records...');
    const response = await axios.get(apiUrl);
    
    if (Array.isArray(response.data)) {
      console.log(`✅ Database now contains ${response.data.length} property records:`);
      response.data.forEach(record => {
        console.log(`  - ${record.property_code}: ${record.property_name}`);
      });
    } else {
      console.log('❌ Unexpected response format during verification');
    }
    
  } catch (error) {
    console.log('❌ Could not verify records - backend connection issue');
  }
  
  console.log('\n🎉 Property records restoration process completed!');
  console.log('💡 You can now refresh your Property Setup page to see the restored records.');
}

// Check if backend is running first
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:3001/api/property-codes', { timeout: 5000 });
    console.log('✅ Backend server is running and reachable');
    return true;
  } catch (error) {
    console.log('❌ Backend server is not reachable!');
    console.log('💡 Please start the backend server first:');
    console.log('   cd backend && node index.js');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🏨 Property Code Records Restoration Tool');
  console.log('==========================================');
  
  const backendReady = await checkBackend();
  
  if (backendReady) {
    await restorePropertyRecords();
  } else {
    console.log('\n⏸️  Restoration aborted - backend not available');
    process.exit(1);
  }
}

main().catch(console.error);