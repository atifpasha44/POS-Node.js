const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const moment = require('moment');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
require('fs').mkdirSync(logsDir, { recursive: true });

// Custom format for log entries
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => moment().format('YYYY-MM-DD HH:mm:ss.SSS')
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` | ${JSON.stringify(metadata)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      msg += `\nStack: ${stack}`;
    }
    
    return msg;
  })
);

// Daily rotate file transport for general logs
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d', // Keep logs for 14 days
  maxSize: '20m',   // Rotate when file exceeds 20MB
  format: logFormat
});

// Daily rotate file transport for error logs
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d', // Keep error logs for 30 days
  maxSize: '20m',
  format: logFormat
});

// Daily rotate file transport for API logs
const apiFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',  // Keep API logs for 7 days
  maxSize: '50m',
  format: logFormat
});

// Daily rotate file transport for database logs
const dbFileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'database-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
  maxSize: '20m',
  format: logFormat
});

// Create the main logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      )
    }),
    
    // File transports
    fileRotateTransport,
    errorFileRotateTransport
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat 
    })
  ]
});

// Create specialized loggers
const apiLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} 🌐 ${level}: ${message}`;
        })
      )
    }),
    apiFileRotateTransport
  ]
});

const dbLogger = winston.createLogger({
  level: 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} 🗄️  ${level}: ${message}`;
        })
      )
    }),
    dbFileRotateTransport
  ]
});

// Utility functions for different log types
const logAPI = {
  request: (method, url, body = null, user = null) => {
    const logData = {
      method,
      url,
      bodySize: body ? JSON.stringify(body).length : 0,
      user: user ? user.user_code || user.id : 'anonymous'
    };
    apiLogger.info(`📤 ${method} ${url}`, logData);
  },
  
  response: (method, url, statusCode, responseTime, responseSize = 0) => {
    const status = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    const logData = {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: `${responseSize} bytes`
    };
    
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    apiLogger[level](`📥 ${status} ${method} ${url} - ${statusCode} (${responseTime}ms)`, logData);
  },
  
  error: (method, url, error, user = null) => {
    const logData = {
      method,
      url,
      error: error.message,
      stack: error.stack,
      user: user ? user.user_code || user.id : 'anonymous'
    };
    apiLogger.error(`💥 ${method} ${url} - ERROR: ${error.message}`, logData);
  }
};

const logDB = {
  query: (sql, params = null, executionTime = null) => {
    const logData = {
      sql: sql.replace(/\s+/g, ' ').trim(),
      params: params ? JSON.stringify(params) : null,
      executionTime: executionTime ? `${executionTime}ms` : null
    };
    dbLogger.debug(`🔍 Query: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`, logData);
  },
  
  result: (sql, rowsAffected, executionTime) => {
    const logData = {
      sql: sql.replace(/\s+/g, ' ').trim().substring(0, 50),
      rowsAffected,
      executionTime: `${executionTime}ms`
    };
    dbLogger.info(`✅ Query completed - ${rowsAffected} rows (${executionTime}ms)`, logData);
  },
  
  error: (sql, error, params = null) => {
    const logData = {
      sql: sql.replace(/\s+/g, ' ').trim(),
      params: params ? JSON.stringify(params) : null,
      error: error.message,
      code: error.code
    };
    dbLogger.error(`💥 DB Error: ${error.message}`, logData);
  },
  
  connection: (status, details = null) => {
    const emoji = status === 'connected' ? '🔗' : status === 'disconnected' ? '🔌' : '⚠️';
    dbLogger.info(`${emoji} Database ${status}`, details);
  }
};

// System logger for general application events
const logSystem = {
  startup: (port, environment = 'development') => {
    logger.info(`🚀 POS Backend Server started on port ${port} (${environment})`, {
      port,
      environment,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    });
  },
  
  shutdown: (reason = 'unknown') => {
    logger.info(`🛑 Server shutting down: ${reason}`, { reason });
  },
  
  auth: (action, user, success = true, details = null) => {
    const emoji = success ? '🔐' : '🚫';
    const level = success ? 'info' : 'warn';
    const logData = {
      action,
      user: user ? user.user_code || user.email || user.id : 'unknown',
      success,
      ip: details?.ip || 'unknown',
      userAgent: details?.userAgent || 'unknown'
    };
    logger[level](`${emoji} Auth ${action}: ${success ? 'SUCCESS' : 'FAILED'}`, logData);
  }
};

module.exports = {
  logger,           // Main logger
  apiLogger,        // API-specific logger
  dbLogger,         // Database-specific logger
  logAPI,           // API logging utilities
  logDB,            // Database logging utilities
  logSystem         // System logging utilities
};