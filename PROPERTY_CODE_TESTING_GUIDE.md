# 🧪 **PropertyCode Database-First Testing Guide**

## 🚀 **Quick Test Setup**

### **1. Backend API Test**
```bash
# Test if API returns data (should show sample properties)
curl -s http://localhost:3001/api/property-codes | python -m json.tool
```

**Expected Result:**
```json
{
    "success": true,
    "data": [
        {
            "id": "CAFE001",
            "property_code": "CAFE001", 
            "property_name": "Downtown Cafe",
            "address_name": "789 City Center",
            // ... other fields
        },
        // ... more properties
    ]
}
```

### **2. Frontend Test**
```bash
# Start frontend (in new terminal)
cd frontend && npm start
```

### **3. Manual Testing Steps**

#### **Step 1: Navigation**
1. Open browser: http://localhost:3000
2. Navigate to **Dashboard → Property Setup**
3. **Expected:** Loading indicator appears briefly, then form loads with data

#### **Step 2: Data Loading Test**  
1. **Expected:** PropertyCode loads sample data from database
2. **Check:** No localStorage dependencies  
3. **Verify:** Console shows "🔄 Loading Property Codes from database..."
4. **Result:** Should see 3 sample properties in dropdown/records

#### **Step 3: Create New Property**
1. Click **NEW** or ensure in Add mode
2. Fill required fields:
   - **Applicable From:** Today's date (auto-filled)
   - **Property Code:** TEST001 (must be unique)
   - **Property Name:** Test Property
   - **Address:** 123 Test Street
3. Click **SAVE**
4. **Expected:** Success popup, data refreshes from database

#### **Step 4: Edit Property**
1. Click **MODIFY** 
2. Select existing property from list
3. **Expected:** Form loads with selected property data
4. Change Property Name to "Updated Test Property"  
5. Click **SAVE**
6. **Expected:** Data updates in database and refreshes

#### **Step 5: Delete Property**
1. Click **DELETE**
2. Select property to delete
3. Click **SAVE**  
4. **Expected:** Property marked inactive (ActiveStatus = 0)

## 🔍 **Testing Checklist**

### **Database-First Verification**
- [ ] ✅ **No Props Dependency** - Component works without Dashboard props
- [ ] ✅ **Loads from Database** - Data comes from `/api/property-codes`
- [ ] ✅ **Saves to Database** - All operations persist to `IT_CONF_PROPERTY` table
- [ ] ✅ **Real-time Updates** - Changes immediately visible after operations
- [ ] ✅ **Loading States** - Shows loading indicator while fetching data
- [ ] ✅ **Error Handling** - Graceful failure if database unavailable

### **Architecture Benefits**
- [ ] ✅ **Independence** - Component loads without waiting for Dashboard
- [ ] ✅ **Consistency** - Always shows latest database data
- [ ] ✅ **Performance** - Direct database queries, no localStorage overhead
- [ ] ✅ **Multi-user Ready** - Changes visible across browser sessions

## 🐛 **Troubleshooting**

### **API Errors**
```bash
# If API fails, check backend logs
curl -s http://localhost:3001/api/property-codes
```

### **Database Issues**
```sql
-- Verify table exists and has data
SELECT * FROM IT_CONF_PROPERTY WHERE ActiveStatus = 1;
```

### **Frontend Console Logs**
Look for these messages in browser console:
- ✅ `"🔄 Loading Property Codes from database..."`
- ✅ `"✅ Loaded property codes from database: X records"`
- ❌ `"❌ Error loading property codes from database"`

## 📊 **Success Criteria**

1. **PropertyCode loads independently** without Dashboard state
2. **All CRUD operations** work with database persistence  
3. **No localStorage usage** for business data
4. **Real-time data refresh** after each operation
5. **Professional loading states** during data fetching

---

**Status:** PropertyCode is now 100% database-first architecture! 🎉