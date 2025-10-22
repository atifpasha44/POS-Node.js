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
export const loadPropertyCodes = async () => {
  try {
    // Check if cache is still valid
    const now = Date.now();
    if (propertyCodesCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📋 Using cached property codes:', propertyCodesCache.length, 'records');
      return propertyCodesCache;
    }

    console.log('🔄 Loading property codes from database...');
    console.log('🌐 API URL:', 'http://localhost:3001/api/property-codes');
    
    const response = await axios.get('http://localhost:3001/api/property-codes');
    
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Data:', response.data);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      const data = response.data.data;
      
      // Update cache
      propertyCodesCache = data;
      cacheTimestamp = now;
      
      console.log('✅ Loaded property codes from database:', data.length, 'records');
      console.log('📋 Property codes:', data.map(p => `${p.property_code} - ${p.property_name}`));
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
 * React hook for loading property codes in components
 * @returns {Object} { propertyCodes, loading, reload }
 */
export const usePropertyCodes = () => {
  const [propertyCodes, setPropertyCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await loadPropertyCodes();
      setPropertyCodes(data);
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
    loadData();
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