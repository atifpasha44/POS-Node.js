# InfoTooltip Integration - Manual Testing Checklist

## 🧪 **Pre-Testing Setup**

### **Step 1: Enable Software Control**
1. Open the POS application in your browser
2. Navigate to Dashboard
3. Find "Software Control" section
4. Enable the following settings:
   - ✅ User Setup Enabled
   - ✅ Item Master Enabled 
   - ✅ Tax Structure Enabled
   - ✅ Unit of Measurement Enabled
   - ✅ Property Code Enabled
   - ✅ Reason Codes Enabled
   - ✅ Tax Codes Enabled
   - ✅ Credit Card Manager Enabled
   - ✅ Outlet Setup Enabled
   - ✅ User Groups Enabled
   - ✅ Item Categories Enabled
   - ✅ Item Departments Enabled
5. Click "Save Settings"
6. Verify "Settings saved successfully!" message appears

### **Step 2: Clear Browser Cache**
1. Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
2. Clear cached images and files
3. Refresh the page (`F5` or `Ctrl + R`)

## 📋 **Form Testing Checklist**

### **✅ Forms with InfoTooltip Integration (Test Each)**

| Form Name | Navigation Path | Expected ℹ️ Icon | Main Table | Linked Tables | Status |
|-----------|----------------|-------------------|------------|---------------|---------|
| **Property Code** | Dashboard → Property Code | Yes | `it_conf_property` | None | ⬜ |
| **Reason Codes** | Dashboard → Reason Codes | Yes | `it_conf_reasons` | None | ⬜ |
| **Tax Codes** | Dashboard → Tax Codes | Yes | `it_conf_taxcode` | None | ⬜ |
| **Credit Card Manager** | Dashboard → Credit Card Manager | Yes | `it_conf_ccm` | None | ⬜ |
| **Outlet Setup** | Dashboard → Outlet Setup | Yes | `it_conf_outset` | `it_conf_outses`, `it_conf_outordtyp` | ⬜ |
| **User Groups** | Dashboard → User Groups | Yes | `it_conf_user_groups` | `it_conf_roles` | ⬜ |
| **Item Categories** | Dashboard → Item Categories | Yes | `it_conf_item_categories` | None | ⬜ |
| **Item Departments** | Dashboard → Item Departments | Yes | `it_conf_item_departments` | None | ⬜ |
| **Item Master** | Dashboard → Item Master | Yes | `it_conf_item_master` | `it_conf_item_categories`, `it_conf_item_departments`, `it_conf_taxstructure`, `it_conf_uom` | ⬜ |
| **Tax Structure** | Dashboard → Tax Structure | Yes | `it_conf_taxstructure` | None | ⬜ |
| **Unit of Measurement** | Dashboard → Unit of Measurement | Yes | `it_conf_uom` | None | ⬜ |
| **User Setup** | Dashboard → User Setup | Yes | `it_conf_user_setup` | `it_conf_user_groups` | ⬜ |

## 🔍 **Detailed Testing Steps for Each Form**

### **For Each Form in the Checklist Above:**

#### **Step 1: Navigate to Form**
- [ ] Navigate to the form using the specified path
- [ ] Verify the form loads correctly
- [ ] Verify the form title is displayed properly

#### **Step 2: Check InfoTooltip Icon Presence**
- [ ] Look for the ℹ️ icon next to the form title
- [ ] Verify the icon is positioned correctly (right side of title)
- [ ] Verify the icon has proper styling (cursor pointer, correct size)

#### **Step 3: Test InfoTooltip Modal Functionality**
- [ ] Click the ℹ️ icon
- [ ] Verify modal opens with "Database Information" title
- [ ] Verify modal has proper styling and positioning
- [ ] Verify modal overlay appears behind the modal content

#### **Step 4: Verify Database Information Content**
- [ ] Check "Main Table" section exists
- [ ] Verify correct main table name is displayed (see table above)
- [ ] Check "Linked Tables" section exists
- [ ] If linked tables expected: verify correct linked table names are displayed
- [ ] If no linked tables: verify "No linked tables" message appears

#### **Step 5: Test Modal Close Functionality**
- [ ] Click the "×" (close) button in top-right corner
- [ ] Verify modal closes completely
- [ ] Click ℹ️ icon again to reopen modal
- [ ] Click outside the modal (on overlay)
- [ ] Verify modal closes when clicking outside

#### **Step 6: Mark Test Status**
- [ ] Mark checkbox in table above as ✅ if all tests pass
- [ ] Mark checkbox as ❌ if any test fails
- [ ] Note any issues in the "Issues Found" section below

## 🚫 **Negative Testing**

### **Test InfoTooltip Visibility Control**

#### **Step 1: Disable Software Control**
1. Navigate to Dashboard
2. In Software Control section, disable ALL settings
3. Click "Save Settings"
4. Navigate to any form (e.g., Property Code)
5. **Expected Result:** No ℹ️ icon should appear
- [ ] ✅ Pass: No InfoTooltip icon visible
- [ ] ❌ Fail: InfoTooltip icon still visible

#### **Step 2: Re-enable Software Control**
1. Navigate back to Dashboard
2. Re-enable all Software Control settings
3. Click "Save Settings"
4. Navigate to same form again
5. **Expected Result:** ℹ️ icon should reappear
- [ ] ✅ Pass: InfoTooltip icon now visible
- [ ] ❌ Fail: InfoTooltip icon not visible

## 🐛 **Issues Found**

### **Form-Specific Issues**
| Form Name | Issue Description | Severity | Status |
|-----------|-------------------|----------|---------|
| | | | |
| | | | |

### **General Issues**
| Issue Type | Description | Steps to Reproduce | Status |
|------------|-------------|-------------------|---------|
| | | | |
| | | | |

## ✅ **Test Completion Summary**

### **Results Overview**
- **Total Forms Tested:** ___/12
- **Forms Passing All Tests:** ___/12
- **Forms with Issues:** ___/12
- **Critical Issues Found:** ___
- **Minor Issues Found:** ___

### **Sign-off**
- [ ] All 12 forms tested successfully
- [ ] InfoTooltip icons appear consistently across all forms
- [ ] Modal functionality works correctly on all forms
- [ ] Database information displays correctly for all forms
- [ ] Software Control enable/disable functionality works
- [ ] No critical issues found

**Tester Name:** ________________  
**Test Date:** ________________  
**Test Environment:** ________________  
**Browser/Version:** ________________  

## 📝 **Additional Notes**

_Use this space to document any additional observations, suggestions, or notes from testing:_

---

## 🎯 **Quick Test Commands (Optional)**

If you want to run automated tests as well:

```bash
# Install testing dependencies
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Run InfoTooltip integration tests
npm test -- --testPathPattern=InfoTooltipIntegration.test.js

# Run with coverage
npm test -- --coverage --testPathPattern=InfoTooltipIntegration.test.js
```