const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

// ========================================
// LOGGING SETUP (ADDED)
// ========================================
const { logger, logSystem } = require('./logger');
const { 
  requestLogger, 
  errorLogger, 
  sessionLogger, 
  logDatabaseConnection, 
  healthCheckLogger 
} = require('./middleware/logging');

console.log('🚀 Starting POS Backend Server...');
logger.info('Starting POS Backend Server initialization');

const app = express();
const PORT = 3001;

// ========================================
// MIDDLEWARE SETUP
// ========================================
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
    secret: 'pos-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ========================================
// LOGGING MIDDLEWARE (ADDED)
// ========================================
app.use(healthCheckLogger);    // Light logging for health checks
app.use(sessionLogger);        // Session info capture
app.use(requestLogger);        // Request/response logging

// ========================================
// DATABASE CONNECTION
// ========================================
const db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'Jaheed@9',
    database: 'pos_db'
});

console.log('🔌 Attempting database connection...');
logger.info('Attempting database connection', {
    host: 'localhost',
    port: 3307,
    database: 'pos_db'
});

let dbConnected = false;

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        logger.error('Database connection failed', { error: err.message, code: err.code });
        console.log('⚠️  Server will start without database connection');
        logger.warn('Server starting without database connection');
    } else {
        console.log('✅ Connected to MySQL database');
        logger.info('Database connection established successfully');
        dbConnected = true;
        
        // ========================================
        // DATABASE LOGGING ENHANCEMENT (ADDED)
        // ========================================
        logDatabaseConnection(db);
    }
});

// Test route to check logging
app.get('/api/test-logging', (req, res) => {
    logger.info('Test logging endpoint called');
    res.json({ 
        success: true, 
        message: 'Logging system is working!',
        timestamp: new Date().toISOString(),
        dbConnected
    });
});

// HEALTH CHECK ENDPOINT
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'POS Backend Server is running',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'Connected' : 'Disconnected',
        logging: 'Active'
    });
});

// ========================================
// ERROR HANDLING MIDDLEWARE (ADDED)
// ========================================
app.use(errorLogger);          // Log all errors

// ========================================
// SERVER STARTUP
// ========================================
const server = app.listen(PORT, () => {
    console.log(`🚀 POS Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test logging: http://localhost:${PORT}/api/test-logging`);
    console.log(`📝 Logging system: ACTIVE`);
    
    // Log system startup (ADDED)
    logSystem.startup(PORT, process.env.NODE_ENV || 'development');
});

// ========================================
// GRACEFUL SHUTDOWN LOGGING (ADDED)
// ========================================
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    logSystem.shutdown('SIGTERM received');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT (Ctrl+C), shutting down gracefully...');
    logSystem.shutdown('SIGINT received (Ctrl+C)');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

module.exports = app;