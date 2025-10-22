# POS-Node.js

## Version Information
**Current Version: 1.3.0** - Enhanced Database Transparency & InfoTooltip Modal System  
**Release Date:** October 21, 2025  
**Build:** 20251021001

### Latest Features (v1.3.0)
- ✨ **Enhanced InfoTooltip Modal System** - Professional modal popups showing database table relationships
- 🎯 **Software Control Feature** - Toggle for development/production database transparency
- 📊 **Main/Linked Table Categorization** - Clear separation of primary vs dependent tables
- 🎨 **Professional Modal Design** - Click-to-open interface matching application aesthetics
- 🔧 **Developer Tools** - Advanced database structure documentation for administrators

### Technical Enhancements
- Updated forms with enhanced InfoTooltip integration (ItemMaster, TaxStructure, UnitOfMeasurement, UserSetup)
- Professional modal styling with color-coded sections (green for main tables, blue for linked tables)
- Responsive design with improved user experience
- Backwards compatibility with existing implementations

---

## Setup Instructions

### 1. MySQL Database Setup
1. Install MySQL and start the MySQL server.
2. Open a MySQL client and run the SQL script in `backend/db_init.sql`:
	```sql
	SOURCE backend/db_init.sql;
	```

### 2. Backend Setup
1. Open a terminal in `backend` folder.
2. Install dependencies:
	```sh
	npm install
	```
3. Start the backend server:
	```sh
	npm start
	```
	The backend runs on `http://localhost:5000`.

### 3. Frontend Usage
1. Open `frontend/index.html` in your browser.
2. Login using:
	- Email: `admin@pos.com`
	- Password: `admin123`
	- Or TIN: `123456789`

After login, you will be redirected to the dashboard.

## Customization
- Replace `frontend/logo.png` and `frontend/profile.png` with your own graphics.
- Update modules and UI in `frontend/dashboard.html` as needed.

## Notes
- For production, use secure session and password hashing.
- You can extend modules and backend APIs for more features.
