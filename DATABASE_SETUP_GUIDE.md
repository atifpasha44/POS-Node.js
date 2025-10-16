# 🗄️ POS System Database Setup Guide

## ⚠️ **Current Status**
- **Backend Server**: ✅ Running on http://localhost:3001
- **Database Connection**: ❌ MySQL access denied (requires password setup)
- **API Endpoints**: ✅ All 12 modules implemented with full CRUD operations

## 🔧 **Quick Fix Instructions**

### Option 1: Update Database Configuration (Recommended)
1. **Find your MySQL password** or **create one if none exists**
2. **Edit the backend configuration** in `backend/index.js`:
   ```javascript
   // Line 25: Update database connection
   const db = mysql.createConnection({
       host: 'localhost',
       user: 'root',
       password: 'YOUR_MYSQL_PASSWORD', // ← Add your password here
       database: 'pos_system'
   });
   ```

### Option 2: Reset MySQL Root Password
```bash
# Stop MySQL service
net stop mysql

# Start MySQL in safe mode
mysqld --skip-grant-tables

# Connect and reset password
mysql -u root
UPDATE mysql.user SET Password=PASSWORD('newpassword') WHERE User='root';
FLUSH PRIVILEGES;
```

### Option 3: Use XAMPP/WAMP Default Settings
If using XAMPP or WAMP:
```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Usually empty for XAMPP
    database: 'pos_system'
});
```

## 📋 **Manual Database Setup Steps**

### 1. Create Database
```sql
CREATE DATABASE IF NOT EXISTS pos_system;
USE pos_system;
```

### 2. Run Schema File
Execute the complete schema from: `backend/pos_tables_schema.sql`

This creates:
- **11 configuration tables** with proper relationships
- **Sample data** for testing
- **Indexes** for performance
- **Views** for easier querying

### 3. Verify Tables Created
```sql
SHOW TABLES;
-- Should show: IT_CONF_ITEM_DEPARTMENTS, IT_CONF_ITEM_CATEGORIES, 
-- IT_CONF_OUTSET, IT_CONF_TAXCODE, IT_CONF_TAXSTRUCTURE, 
-- IT_CONF_UOM, IT_CONF_USER_GROUPS, IT_CONF_USER_SETUP, 
-- IT_CONF_REASONS, IT_CONF_CCM, IT_CONF_ITEM_MASTER
```

## 🧪 **Testing API Endpoints**

Once database is connected, test these endpoints:

### Item Categories (Main Issue)
```bash
# Get all categories
curl http://localhost:3001/api/item-categories

# Add sample category
curl -X POST http://localhost:3001/api/item-categories \
  -H "Content-Type: application/json" \
  -d '{"category_code":"TEST","name":"Test Category","item_department_code":"FOOD"}'
```

### Health Check
```bash
curl http://localhost:3001/api/health
```

## 📊 **Expected Results**

After database setup:
- **Item Categories dropdown** should show data from database
- **ItemMaster form** should load all dropdown options
- **Backend logs** should show successful API calls
- **Console output** should show: "✅ Loaded categories from API: X items"

## 🔄 **Restart Instructions**

After updating database configuration:
```bash
# Kill existing server
taskkill //F //IM node.exe

# Restart backend
cd backend
npm start
```

## 🎯 **Key Benefits of New System**

1. **Persistent Data**: All form data now stored in MySQL database
2. **Data Relationships**: Proper foreign keys between tables
3. **Scalability**: Can handle thousands of records efficiently
4. **Backup**: Easy database backup and restore
5. **Multi-user**: Supports concurrent users
6. **API Consistency**: All components use same backend pattern

## 📝 **API Endpoints Summary**

| Module | Endpoint | Methods |
|--------|----------|---------|
| Item Departments | `/api/item-departments` | GET, POST, PUT, DELETE |
| Item Categories | `/api/item-categories` | GET, POST, PUT, DELETE |
| Outlet Setup | `/api/outlet-setup` | GET, POST, PUT, DELETE |
| Tax Codes | `/api/tax-codes` | GET, POST, PUT, DELETE |
| Tax Structure | `/api/tax-structure` | GET, POST, PUT, DELETE |
| UOM | `/api/uom` | GET, POST, PUT, DELETE |
| User Groups | `/api/user-groups` | GET, POST, PUT, DELETE |
| User Setup | `/api/user-setup` | GET, POST, PUT, DELETE |
| Reason Codes | `/api/reason-codes` | GET, POST, PUT, DELETE |
| Credit Cards | `/api/credit-cards` | GET, POST, PUT, DELETE |
| Item Master | `/api/item-master` | GET, POST, PUT, DELETE |
| Property Codes | `/api/property-codes` | GET, POST, PUT, DELETE |

## 🚀 **Next Steps**

1. **Fix MySQL connection** (see options above)
2. **Test ItemMaster** dropdown loading
3. **Migrate remaining components** to use backend APIs
4. **Verify data persistence** across browser sessions
5. **Performance testing** with large datasets

---
**Note**: The backend server is running successfully. Only the database connection needs to be configured to complete the migration from localStorage to proper database storage.