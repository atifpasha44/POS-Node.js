/**
 * iTHOTS POS Version Configuration
 * ================================
 * 
 * This file contains the version information for the iTHOTS POS system.
 * Update this file whenever new features, enhancements, or bug fixes are made.
 * 
 * Version Format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes or major new features
 * - MINOR: New features, enhancements, backward compatible
 * - PATCH: Bug fixes, minor improvements
 */

const VERSION_INFO = {
  // Current Version
  version: "1.2.0",
  
  // Product Information
  productName: "ithots G5 Restaurant Edition",
  productTitle: "iTHOTS POS System",
  
  // Build Information
  buildDate: "2025-10-15",
  buildNumber: "20251015001",
  
  // Release Information
  releaseName: "Database Documentation & Enhanced Management",
  releaseType: "Minor Release",
  
  // Change Log for Current Version
  changeLog: {
    "1.2.0": {
      date: "2025-10-15",
      type: "Minor Release",
      features: [
        "Comprehensive Database Documentation System",
        "Enhanced Property Code Management",
        "Improved Item Master Management",
        "Set Menu Configuration Updates",
        "User Management Enhancements",
        "Reason Codes & UOM Management",
        "API Integration Documentation",
        "Export/Import Capabilities"
      ],
      improvements: [
        "Better field validation across all forms",
        "Enhanced UI/UX for management screens",
        "Improved data persistence strategies",
        "Better error handling and user feedback",
        "Optimized database relationships"
      ],
      bugFixes: [
        "Fixed download functionality issues",
        "Resolved form validation edge cases",
        "Improved data integrity checks",
        "Enhanced browser compatibility"
      ]
    },
    "1.1.0": {
      date: "2025-10-07",
      type: "Minor Release", 
      features: [
        "Property Code Setup",
        "Outlet Management",
        "Basic Item Master",
        "User Setup Framework"
      ]
    },
    "1.0.0": {
      date: "2025-10-01",
      type: "Initial Release",
      features: [
        "Basic POS Framework",
        "User Authentication",
        "Dashboard Structure",
        "Database Foundation"
      ]
    }
  },
  
  // System Requirements
  requirements: {
    node: ">=14.0.0",
    npm: ">=6.0.0",
    mysql: ">=8.0.0",
    react: ">=18.0.0"
  },
  
  // License & Copyright
  license: "Proprietary",
  copyright: "© 2025 iTHOTS Technologies. All rights reserved.",
  
  // Developer Information
  developedBy: "iTHOTS Development Team",
  lastUpdatedBy: "System Administrator",
  
  // API Version
  apiVersion: "v1.2",
  databaseVersion: "1.2.0"
};

// Version utility functions
const VersionUtils = {
  /**
   * Get the current version string
   */
  getCurrentVersion: () => VERSION_INFO.version,
  
  /**
   * Get the full product name with version
   */
  getFullProductName: () => `${VERSION_INFO.productName} v${VERSION_INFO.version}`,
  
  /**
   * Get version display for UI
   */
  getVersionDisplay: () => `${VERSION_INFO.productTitle} Version: ${VERSION_INFO.version}`,
  
  /**
   * Get build information
   */
  getBuildInfo: () => ({
    version: VERSION_INFO.version,
    buildDate: VERSION_INFO.buildDate,
    buildNumber: VERSION_INFO.buildNumber
  }),
  
  /**
   * Get the latest changelog entry
   */
  getLatestChangelog: () => VERSION_INFO.changeLog[VERSION_INFO.version],
  
  /**
   * Check if this is a development version
   */
  isDevelopment: () => VERSION_INFO.version.includes('dev') || VERSION_INFO.version.includes('beta'),
  
  /**
   * Get version for package.json
   */
  getPackageVersion: () => VERSION_INFO.version,
  
  /**
   * Get formatted version info for display
   */
  getFormattedVersionInfo: () => {
    const latest = VERSION_INFO.changeLog[VERSION_INFO.version];
    return {
      version: VERSION_INFO.version,
      productName: VERSION_INFO.productName,
      buildDate: VERSION_INFO.buildDate,
      releaseName: VERSION_INFO.releaseName,
      releaseType: VERSION_INFO.releaseType,
      changeCount: {
        features: latest.features?.length || 0,
        improvements: latest.improvements?.length || 0,
        bugFixes: latest.bugFixes?.length || 0
      }
    };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VERSION_INFO, VersionUtils };
}

// Export for frontend (ES6 modules)
if (typeof window !== 'undefined') {
  window.POS_VERSION_INFO = VERSION_INFO;
  window.POS_VERSION_UTILS = VersionUtils;
}

export { VERSION_INFO, VersionUtils };