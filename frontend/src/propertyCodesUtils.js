import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Shared utility for loading property codes from database
 * Used across multiple components that need property code data
 */

// Cache for property codes to avoid multiple API calls
let propertyCodesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load property codes from database with caching
 * @returns {Promise<Array>} Array of property codes
 */
export const loadPropertyCodes = async (forceRefresh = false) => {
  try {
    // Check if cache is still valid (but don't use cache if it's empty and we're not forcing refresh)
    const now = Date.now();
    if (!forceRefresh && propertyCodesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      // Don't use cached empty results - always try to fetch fresh data if cache is empty
      if (propertyCodesCache.length > 0) {
        console.log('📋 Using cached property codes:', propertyCodesCache.length, 'records');
        return propertyCodesCache;
      } else {
        console.log('⚠️ Cache is empty, forcing refresh...');
      }
    }

    console.log('🔄 Loading property codes from database...');
    console.log('🌐 API URL:', 'http://localhost:3001/api/property-codes');
    
    const response = await axios.get('http://localhost:3001/api/property-codes');
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Data:', response.data);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      const data = response.data.data;
      
      // Only update cache if we have actual data (don't cache empty results unless it's really empty in DB)
      propertyCodesCache = data;
      cacheTimestamp = now;
      
      console.log('✅ Loaded property codes from database:', data.length, 'records');
      if (data.length > 0) {
        console.log('📋 Property codes:', data.map(p => `${p.property_code} - ${p.property_name}`));
      } else {
        console.log('⚠️ No property codes found in database');
      }
      return data;
    } else {
      console.error('❌ Failed to load property codes - Invalid response format');
      console.error('📡 Response data:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading property codes from database:');
    console.error('🔍 Error details:', error.message);
    console.error('🔍 Error code:', error.code);
    if (error.response) {
      console.error('🔍 Response status:', error.response.status);
      console.error('🔍 Response data:', error.response.data);
    }
    return [];
  }
};

/**
 * Clear property codes cache (useful after PropertyCode CRUD operations)
 */
export const clearPropertyCodesCache = () => {
  propertyCodesCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Property codes cache cleared');
};

/**
 * Force refresh property codes (clears cache and reloads)
 */
export const forceRefreshPropertyCodes = async () => {
  console.log('🔄 Force refreshing property codes...');
  clearPropertyCodesCache();
  return await loadPropertyCodes(true);
};

// Make cache clearing available globally for debugging
if (typeof window !== 'undefined') {
  window.clearPropertyCodesCache = clearPropertyCodesCache;
  window.forceRefreshPropertyCodes = forceRefreshPropertyCodes;
}

/**
 * React hook for loading property codes in components
 * @returns {Object} { propertyCodes, loading, reload }
 */
export const usePropertyCodes = () => {
  const [propertyCodes, setPropertyCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await loadPropertyCodes(forceRefresh);
      setPropertyCodes(data);
      
      // If no data found and we haven't tried force refresh yet, try once more
      if (data.length === 0 && !forceRefresh) {
        console.log('⚠️ No property codes found, trying force refresh...');
        const freshData = await loadPropertyCodes(true);
        setPropertyCodes(freshData);
      }
    } catch (error) {
      console.error('Error in usePropertyCodes:', error);
      setPropertyCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const reload = () => {
    clearPropertyCodesCache();
    loadData(true);
  };

  return { propertyCodes, loading, reload };
};

/**
 * Filter property codes based on applicable date logic
 * @param {Array} propertyCodes - Array of property codes
 * @returns {Array} Filtered property codes applicable for today
 */
export const getApplicablePropertyCodes = (propertyCodes) => {
  if (!propertyCodes || propertyCodes.length === 0) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Group property codes by property_code to handle multiple dates
  const groupedByCodes = propertyCodes.reduce((acc, pc) => {
    const code = pc.property_code || pc.code;
    if (!acc[code]) acc[code] = [];
    acc[code].push(pc);
    return acc;
  }, {});
  
  const applicableCodes = [];
  
  // For each unique property code, find the most recent applicable record
  Object.keys(groupedByCodes).forEach(code => {
    const records = groupedByCodes[code];
    
    // Filter records that are applicable (applicable_from <= today)
    const applicableRecords = records.filter(record => {
      const applicableDate = new Date(record.applicable_from);
      applicableDate.setHours(0, 0, 0, 0);
      return applicableDate <= today;
    });
    
    if (applicableRecords.length > 0) {
      // Sort by applicable_from date (descending) to get the most recent applicable record
      applicableRecords.sort((a, b) => new Date(b.applicable_from) - new Date(a.applicable_from));
      
      // Add the most recent applicable record
      applicableCodes.push(applicableRecords[0]);
    }
  });
  
  return applicableCodes;
};