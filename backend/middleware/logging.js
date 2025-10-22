const { logAPI, logSystem } = require('../logger');

// Request logging middleware
const requestLogger = (req, res, next) => {
  // Record request start time
  req.startTime = Date.now();
  
  // Get user info if available
  const user = req.session?.user || null;
  
  // Get client IP
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);
  
  // Log the incoming request
  const requestBody = req.method === 'POST' || req.method === 'PUT' ? req.body : null;
  
  logAPI.request(req.method, req.originalUrl, requestBody, user);
  
  // Store original res.json and res.send methods
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override res.json to capture response
  res.json = function(body) {
    const responseTime = Date.now() - req.startTime;
    const responseSize = JSON.stringify(body).length;
    
    logAPI.response(req.method, req.originalUrl, res.statusCode, responseTime, responseSize);
    
    // Call original method
    return originalJson.call(this, body);
  };
  
  // Override res.send to capture response
  res.send = function(body) {
    const responseTime = Date.now() - req.startTime;
    const responseSize = typeof body === 'string' ? body.length : JSON.stringify(body).length;
    
    logAPI.response(req.method, req.originalUrl, res.statusCode, responseTime, responseSize);
    
    // Call original method
    return originalSend.call(this, body);
  };
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const user = req.session?.user || null;
  
  // Log the error
  logAPI.error(req.method, req.originalUrl, err, user);
  
  // Continue with error handling
  next(err);
};

// Session logging middleware
const sessionLogger = (req, res, next) => {
  // Only log session events for auth endpoints
  if (req.originalUrl.includes('/api/login') || req.originalUrl.includes('/api/logout')) {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Store session info for later use in auth logging
    req.clientInfo = {
      ip: clientIP,
      userAgent: userAgent
    };
  }
  
  next();
};

// Database connection logging helper
const logDatabaseConnection = (db) => {
  // Override db.query to add logging
  const originalQuery = db.query;
  
  db.query = function(sql, params, callback) {
    const startTime = Date.now();
    
    // Handle different parameter patterns
    if (typeof params === 'function') {
      callback = params;
      params = null;
    }
    
    // Log the query
    const { logDB } = require('../logger');
    logDB.query(sql, params);
    
    // Execute original query with enhanced callback
    return originalQuery.call(this, sql, params, (err, results, fields) => {
      const executionTime = Date.now() - startTime;
      
      if (err) {
        const { logDB } = require('../logger');
        logDB.error(sql, err, params);
      } else {
        const { logDB } = require('../logger');
        const rowsAffected = Array.isArray(results) ? results.length : 
                           (results && results.affectedRows !== undefined) ? results.affectedRows : 0;
        logDB.result(sql, rowsAffected, executionTime);
      }
      
      // Call original callback
      if (callback) {
        callback(err, results, fields);
      }
    });
  };
  
  // Log connection events
  db.on('connect', () => {
    const { logDB } = require('../logger');
    logDB.connection('connected', {
      host: db.config.host,
      port: db.config.port,
      database: db.config.database
    });
  });
  
  db.on('error', (err) => {
    const { logDB } = require('../logger');
    logDB.connection('error', {
      error: err.message,
      code: err.code
    });
  });
};

// Health check logging
const healthCheckLogger = (req, res, next) => {
  if (req.originalUrl === '/api/health') {
    // Light logging for health checks to avoid spam
    console.log(`🏥 Health check at ${new Date().toISOString()}`);
  }
  next();
};

module.exports = {
  requestLogger,
  errorLogger,
  sessionLogger,
  logDatabaseConnection,
  healthCheckLogger
};