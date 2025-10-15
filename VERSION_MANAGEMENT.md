# 📋 iTHOTS POS Version Management Guide

## Overview
This document provides guidelines for properly managing and updating version numbers in the iTHOTS POS system whenever updates or enhancements are made.

## 📁 Version Management Files

### 1. **Primary Version File**
- **Location:** `frontend/src/version.js`
- **Purpose:** Central configuration for all version-related information
- **Update Frequency:** Every release

### 2. **Package Files** 
- **Locations:** 
  - `frontend/package.json`
  - `backend/package.json` 
- **Purpose:** NPM package version tracking
- **Update Frequency:** Every release

### 3. **Database Version**
- **Table:** Company information table (`pos_version` field)
- **Purpose:** Runtime version display override
- **Update Frequency:** Optional, for customer-specific versions

## 🔢 Version Numbering System

### Format: `MAJOR.MINOR.PATCH`

**MAJOR Version (X.0.0)**
- Breaking changes that are not backward compatible
- Major architectural changes
- Complete system overhauls
- **Example:** `1.0.0` → `2.0.0`

**MINOR Version (1.X.0)**
- New features and enhancements
- Backward compatible changes
- New modules or significant functionality
- **Example:** `1.1.0` → `1.2.0`

**PATCH Version (1.1.X)**
- Bug fixes
- Minor improvements
- Security patches
- **Example:** `1.2.0` → `1.2.1`

## 📋 Update Checklist

When making any updates or enhancements, follow this checklist:

### ✅ **Step 1: Determine Version Type**
- [ ] Is this a breaking change? → **MAJOR**
- [ ] Is this a new feature/enhancement? → **MINOR**  
- [ ] Is this a bug fix/minor improvement? → **PATCH**

### ✅ **Step 2: Update Version Configuration**
1. **Edit `frontend/src/version.js`:**
   ```javascript
   const VERSION_INFO = {
     version: "1.3.0", // Update this
     buildDate: "2025-10-XX", // Update build date
     releaseName: "Your Release Name", // Update release name
     // Add new changelog entry
     changeLog: {
       "1.3.0": {
         date: "2025-10-XX",
         type: "Minor Release", // or Major/Patch
         features: [
           "New feature 1",
           "New feature 2"
         ],
         improvements: [
           "Improvement 1",
           "Improvement 2"
         ],
         bugFixes: [
           "Bug fix 1",
           "Bug fix 2"
         ]
       }
     }
   };
   ```

### ✅ **Step 3: Update Package Files**
2. **Edit `frontend/package.json`:**
   ```json
   {
     "version": "1.3.0"
   }
   ```

3. **Edit `backend/package.json`:**
   ```json
   {
     "version": "1.3.0"
   }
   ```

### ✅ **Step 4: Test Version Display**
4. **Check Dashboard Display:**
   - Company Information screen shows correct version
   - Dashboard title shows correct product name
   - Version details section displays properly

### ✅ **Step 5: Update Documentation**
5. **Update README.md if needed**
6. **Update any API documentation**
7. **Create release notes if major/minor version**

### ✅ **Step 6: Commit Changes**
```bash
git add .
git commit -m "chore: bump version to 1.3.0 - [brief description]"
git tag v1.3.0
git push origin main --tags
```

## 📊 Version Display Locations

The version information is displayed in the following locations:

1. **Dashboard Header:** Product name from `VERSION_INFO.productName`
2. **Company Information Screen:** Main version display
3. **Version Details Panel:** Comprehensive version information
4. **Package Files:** For development and deployment tracking

## 🚀 Release Types & Examples

### **Major Release (2.0.0)**
- Complete UI overhaul
- Database schema changes requiring migration
- New authentication system
- **Timeline:** Quarterly or bi-annually

### **Minor Release (1.X.0)**
- New management modules
- Enhanced reporting features
- API improvements
- New integration capabilities
- **Timeline:** Monthly or bi-monthly

### **Patch Release (1.2.X)**
- Bug fixes
- Performance improvements
- Security updates
- Minor UI adjustments
- **Timeline:** Weekly or as needed

## 🔧 Automated Version Management

### Future Enhancements:
1. **Git Hooks:** Automatically update version on commit
2. **Build Scripts:** Generate build numbers automatically
3. **Release Scripts:** Automate the entire release process
4. **Version API:** Backend endpoint to serve version information

## 📝 Change Log Template

```javascript
"1.X.0": {
  date: "2025-MM-DD",
  type: "Minor Release", // Major Release | Minor Release | Patch Release
  features: [
    "Feature 1: Description of new feature",
    "Feature 2: Another new feature"
  ],
  improvements: [
    "Improvement 1: What was improved",
    "Improvement 2: Another improvement"
  ],
  bugFixes: [
    "Bug Fix 1: What bug was fixed", 
    "Bug Fix 2: Another bug fix"
  ],
  technicalChanges: [
    "Technical change 1",
    "Technical change 2"
  ]
}
```

## 🎯 Best Practices

1. **Always update version before release**
2. **Keep changelog detailed and user-friendly**
3. **Test version display after updates**
4. **Use semantic versioning consistently**
5. **Tag releases in git for tracking**
6. **Document breaking changes clearly**
7. **Update version in all related files simultaneously**

## 🚨 Important Notes

- **Never skip version numbers** (don't go from 1.2.0 to 1.4.0)
- **Always update the build date** when changing version
- **Keep changelog entries clear and concise**
- **Test the application after version updates**
- **Coordinate version updates with team members**

## 📞 Support

For questions about version management:
- Check this documentation first
- Review previous version changes in git history
- Contact the development team lead
- Reference semantic versioning specification at semver.org

---

**Last Updated:** October 15, 2025  
**Document Version:** 1.0  
**Next Review Date:** January 15, 2026