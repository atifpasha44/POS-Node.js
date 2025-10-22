# Property Records Not Showing - Complete Fix Guide

## Problem
You created property records in the frontend but they're not showing up after refresh.

## Root Cause Analysis
The records you created were likely saved to **local state only** (not database) because:
1. Backend server was not running properly
2. MySQL connection issues (port 3307 vs 3306)
3. API calls were failing silently and using fallback mock data

## Step-by-Step Solution

### Step 1: Fix MySQL Connection 🔧

The backend is configured for port **3307** but MySQL usually runs on **3306**.

**Option A: Change Backend to Use Port 3306**
Edit `backend/index.js` line 31:
```javascript
// Change this:
port: 3307,
// To this:
port: 3306,
```

**Option B: Configure MySQL to Run on Port 3307**
If you prefer to keep 3307, configure your MySQL server to use that port.

### Step 2: Start MySQL Server 🚀

**If using XAMPP:**
1. Open XAMPP Control Panel
2. Start **MySQL** service
3. Verify it's running (green indicator)

**If using standalone MySQL:**
```bash
# Windows
net start mysql

# Or start MySQL service from Services.msc
```

### Step 3: Create Database and Table 📊

Run these SQL commands (phpMyAdmin or MySQL command line):

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS pos_db;
USE pos_db;

-- Create the property table
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
```

### Step 4: Start Backend Server 🖥️

```bash
cd backend
node index.js
```

**Expected output:**
```
✅ Connected to MySQL database
Server running on http://localhost:3001
```

**If you see errors:**
- ❌ Database connection failed: Check MySQL is running
- ❌ Port 3001 in use: Run `npx kill-port 3001`

### Step 5: Restore Your Records 📝

**Quick Method - Run Restoration Script:**
```bash
node restore_records.js
```

**Manual Method - Recreate in Frontend:**
1. Open Property Setup in browser
2. Create your properties again
3. They should now save to database

### Step 6: Verify Everything Works ✅

1. **Test API directly:**
   ```bash
   curl http://localhost:3001/api/property-codes
   ```
   Should return JSON array of properties

2. **Test Frontend:**
   - Refresh browser
   - Open Property Setup
   - Records should appear and persist

## Common Issues & Fixes

### Issue 1: "Database connection failed"
**Cause:** MySQL not running or wrong port/credentials
**Fix:** 
- Start MySQL service
- Check port (3306 vs 3307)
- Verify credentials: root/Jaheed@9

### Issue 2: "Table doesn't exist"
**Cause:** Database/table not created
**Fix:** Run the SQL commands in Step 3

### Issue 3: "Port 3001 already in use"
**Cause:** Old backend process still running
**Fix:** 
```bash
npx kill-port 3001
# Then restart: node index.js
```

### Issue 4: Records still not showing
**Cause:** Frontend still using mock data
**Fix:** 
- Ensure backend is running (http://localhost:3001)
- Check browser console for API errors
- Verify response format (should be array, not {success: true, data: []})

## Quick Diagnostic Commands

```bash
# Check if MySQL is running
netstat -an | findstr :3306
netstat -an | findstr :3307

# Check if backend is running  
netstat -an | findstr :3001

# Test backend API
curl http://localhost:3001/api/property-codes

# Check database records directly
mysql -u root -p
USE pos_db;
SELECT * FROM IT_CONF_PROPERTY;
```

## Files to Help You

1. **`diagnose_backend.js`** - Diagnostic script to identify issues
2. **`restore_records.js`** - Restore your missing records
3. **`restore_property_records.sql`** - Direct SQL insertion
4. **This guide** - Step-by-step troubleshooting

## Expected Result

After following these steps:
- ✅ Backend connects to MySQL successfully
- ✅ Property records save to database
- ✅ Records persist after browser refresh
- ✅ No more missing data issues

---

**Most Likely Issue:** Backend couldn't connect to MySQL because it's trying port 3307 but MySQL is running on port 3306. Fix this first, then restore your records.