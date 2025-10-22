// Test date filtering logic
const propertyCodes = [{
  id: 4,
  property_code: 'ABC',
  property_name: 'ABC HOTEL',
  applicable_from: '2025-10-20'
}];

console.log('🧪 Testing date filtering logic...');
console.log('📅 Today:', new Date().toISOString().split('T')[0]);
console.log('📋 Property code date:', propertyCodes[0].applicable_from);

const getApplicablePropertyCodes = (propertyCodes) => {
  if (!propertyCodes || propertyCodes.length === 0) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('📅 Today object:', today.toISOString().split('T')[0]);
  
  const groupedByCodes = propertyCodes.reduce((acc, pc) => {
    const code = pc.property_code || pc.code;
    if (!acc[code]) acc[code] = [];
    acc[code].push(pc);
    return acc;
  }, {});
  
  console.log('📊 Grouped codes:', Object.keys(groupedByCodes));
  
  const applicableCodes = [];
  
  Object.keys(groupedByCodes).forEach(code => {
    const records = groupedByCodes[code];
    console.log('🔍 Processing code:', code, 'with', records.length, 'records');
    
    const applicableRecords = records.filter(record => {
      const applicableDate = new Date(record.applicable_from);
      applicableDate.setHours(0, 0, 0, 0);
      
      console.log('  📅 Record date:', record.applicable_from);
      console.log('  📅 Parsed date:', applicableDate.toISOString().split('T')[0]);
      console.log('  ✅ Is applicable:', applicableDate <= today);
      
      return applicableDate <= today;
    });
    
    console.log('  📋 Applicable records:', applicableRecords.length);
    
    if (applicableRecords.length > 0) {
      applicableRecords.sort((a, b) => new Date(b.applicable_from) - new Date(a.applicable_from));
      applicableCodes.push(applicableRecords[0]);
    }
  });
  
  return applicableCodes;
};

const result = getApplicablePropertyCodes(propertyCodes);
console.log('🎯 Final result:', result.length, 'items');
if (result.length > 0) {
  console.log('📋 First item:', result[0].property_code, '-', result[0].property_name);
} else {
  console.log('❌ No applicable property codes found!');
}