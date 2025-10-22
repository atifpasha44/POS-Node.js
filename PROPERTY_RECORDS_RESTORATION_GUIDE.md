# Property Records Restoration Guide

## Problem
Your previously created property records are missing from the database. This happened because the application was using mock/fallback data when the backend was not connected properly.

## Solution Options

You have **3 ways** to restore your property records:

### Option 1: Automated Script (Recommended) ⭐
This is the easiest method - just run one script!

1. **Start Backend Server** (if not already running):
   ```bash
   cd backend
   node index.js
   ```
   Wait for "✅ Connected to MySQL database" message

2. **Run Restoration Script**:
   ```bash
   # From the main project directory
   node restore_records.js
   ```
   
   OR double-click: `restore_records.bat`

3. **Verify**: Open Property Setup in your browser - you should see 3 restored records

### Option 2: SQL Script (Direct Database)
If you prefer to insert directly into the database:

1. **Open MySQL Command Line** or phpMyAdmin
2. **Run the SQL file**: `restore_property_records.sql`
3. **Verify with**: `SELECT * FROM IT_CONF_PROPERTY ORDER BY property_code;`

### Option 3: Manual Entry (Through UI)
If you want to re-enter manually:

1. Open Property Setup in your browser
2. Click "Add" and enter each property:

   **Property 1:**
   - Property Code: HOTEL001
   - Property Name: ABC Hotel
   - Nickname: ABC Hotel
   - Owner Name: Hotel Owner
   - Address: 123 Main Street, City
   - GST Number: GST123456789
   - PAN Number: ABCDE1234F
   - Group Name: Hotel Group
   - Local Currency: USD
   - Currency Format: en-US
   - Symbol: $
   - Decimal Places: 2
   - Date Format: MM/DD/YYYY
   - Round Off: 0.01

   **Property 2:**
   - Property Code: REST001
   - Property Name: Downtown Restaurant
   - Nickname: Downtown Restaurant
   - Owner Name: Restaurant Owner
   - Address: 456 Food Street, Downtown
   - GST Number: GST987654321
   - PAN Number: FGHIJ5678K
   - Group Name: Restaurant Group
   - (Same currency settings as above)

   **Property 3:**
   - Property Code: CAFE001
   - Property Name: City Cafe
   - Nickname: City Cafe
   - Owner Name: Cafe Owner
   - Address: 789 Coffee Lane, City Center
   - GST Number: GST456789123
   - PAN Number: KLMNO9012P
   - Group Name: Cafe Group
   - (Same currency settings as above)

## Files Created for Restoration
- `restore_records.js` - Node.js script to insert via API
- `restore_records.bat` - Windows batch file for easy execution
- `restore_property_records.sql` - Direct SQL insertion script

## Verification Steps
After restoration, verify the records are saved:

1. **Check Database** (if you have MySQL access):
   ```sql
   SELECT property_code, property_name, created_at 
   FROM IT_CONF_PROPERTY 
   ORDER BY property_code;
   ```

2. **Check Frontend**:
   - Refresh your browser (localhost:3000/dashboard)
   - Open Property Setup
   - You should see 3 records: HOTEL001, REST001, CAFE001

3. **Test Persistence**:
   - Close and reopen browser
   - Records should still be there (proving they're in database, not just mock data)

## Why This Happened
- The application was designed with fallback mock data for when backend is unavailable
- During development, the backend connection had issues
- New records were being saved to local state instead of database
- When page refreshed, only mock data remained

## Prevention
- Always verify backend server is running before creating records
- Check browser console for API errors
- Look for "✅ Loaded property codes from database" success messages

## Status
- ✅ Backend API endpoints fixed and ready
- ✅ Field mapping issues resolved (decimal_places)
- ✅ Response format corrected
- ✅ Restoration scripts prepared
- ⏳ **Ready for you to restore your records!**

---

**Recommendation**: Use Option 1 (automated script) for quickest restoration. Run `node restore_records.js` after starting your backend server.