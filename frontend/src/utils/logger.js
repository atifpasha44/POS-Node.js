// Frontend Logger for POS Application
class FrontendLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 log entries
    this.logLevel = 'info'; // debug, info, warn, error
    this.isEnabled = true;
    
    // Initialize logging
    this.init();
  }
  
  init() {
    // Create log levels
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Get log level from localStorage or default
    const storedLevel = localStorage.getItem('pos_log_level');
    if (storedLevel && this.levels[storedLevel] !== undefined) {
      this.logLevel = storedLevel;
    }
    
    // Get enabled status from localStorage
    const isEnabled = localStorage.getItem('pos_logging_enabled');
    this.isEnabled = isEnabled !== 'false';
    
    console.log('📊 POS Frontend Logger initialized', {
      level: this.logLevel,
      enabled: this.isEnabled
    });
  }
  
  // Core logging method
  log(level, message, data = null, category = 'general') {
    if (!this.isEnabled || this.levels[level] < this.levels[this.logLevel]) {
      return;
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      url: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 100)
    };
    
    // Add to internal log storage
    this.logs.push(logEntry);
    
    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Console output with styling
    const styles = {
      debug: 'color: #6c757d',
      info: 'color: #0dcaf0', 
      warn: 'color: #ffc107',
      error: 'color: #dc3545; font-weight: bold'
    };
    
    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    };
    
    console.log(
      `%c${emoji[level]} [${level.toUpperCase()}] ${category}: ${message}`,
      styles[level],
      data || ''
    );
    
    // Store critical logs in localStorage for persistence
    if (level === 'error') {
      this.persistError(logEntry);
    }
  }
  
  // Specific log level methods
  debug(message, data = null, category = 'general') {
    this.log('debug', message, data, category);
  }
  
  info(message, data = null, category = 'general') {
    this.log('info', message, data, category);
  }
  
  warn(message, data = null, category = 'general') {
    this.log('warn', message, data, category);
  }
  
  error(message, data = null, category = 'general') {
    this.log('error', message, data, category);
  }
  
  // API logging methods
  apiRequest(method, url, body = null, headers = null) {
    this.info(`🌐 API Request: ${method} ${url}`, {
      method,
      url,
      bodySize: body ? JSON.stringify(body).length : 0,
      headers: headers ? Object.keys(headers) : null,
      timestamp: Date.now()
    }, 'api');
  }
  
  apiResponse(method, url, status, responseTime, responseSize = 0, success = true) {
    const level = success ? 'info' : status >= 500 ? 'error' : 'warn';
    const emoji = success ? '✅' : status >= 500 ? '💥' : '⚠️';
    
    this[level](`${emoji} API Response: ${method} ${url} - ${status} (${responseTime}ms)`, {
      method,
      url,
      status,
      responseTime: `${responseTime}ms`,
      responseSize: `${responseSize} bytes`,
      success
    }, 'api');
  }
  
  apiError(method, url, error) {
    this.error(`💥 API Error: ${method} ${url}`, {
      method,
      url,
      error: error.message,
      stack: error.stack
    }, 'api');
  }
  
  // Component lifecycle logging
  componentMount(componentName, props = null) {
    this.debug(`🔄 Component Mounted: ${componentName}`, {
      component: componentName,
      props: props ? Object.keys(props) : null
    }, 'component');
  }
  
  componentUnmount(componentName) {
    this.debug(`🔄 Component Unmounted: ${componentName}`, {
      component: componentName
    }, 'component');
  }
  
  componentUpdate(componentName, prevProps = null, newProps = null) {
    this.debug(`🔄 Component Updated: ${componentName}`, {
      component: componentName,
      prevProps: prevProps ? Object.keys(prevProps) : null,
      newProps: newProps ? Object.keys(newProps) : null
    }, 'component');
  }
  
  // User interaction logging
  userAction(action, details = null) {
    this.info(`👤 User Action: ${action}`, {
      action,
      details,
      page: window.location.pathname
    }, 'user');
  }
  
  formSubmit(formName, data = null) {
    this.info(`📝 Form Submitted: ${formName}`, {
      form: formName,
      fields: data ? Object.keys(data) : null,
      page: window.location.pathname
    }, 'form');
  }
  
  navigationChange(from, to) {
    this.info(`🧭 Navigation: ${from} → ${to}`, {
      from,
      to,
      timestamp: Date.now()
    }, 'navigation');
  }
  
  // Performance logging
  performance(operation, startTime, endTime = Date.now()) {
    const duration = endTime - startTime;
    const level = duration > 1000 ? 'warn' : 'info';
    
    this[level](`⏱️ Performance: ${operation} took ${duration}ms`, {
      operation,
      duration: `${duration}ms`,
      slow: duration > 1000
    }, 'performance');
  }
  
  // Error persistence
  persistError(logEntry) {
    try {
      const errors = JSON.parse(localStorage.getItem('pos_error_logs') || '[]');
      errors.push(logEntry);
      
      // Keep only last 50 errors
      const recentErrors = errors.slice(-50);
      localStorage.setItem('pos_error_logs', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to persist error log:', e);
    }
  }
  
  // Get logs for debugging
  getLogs(category = null, level = null) {
    let filteredLogs = this.logs;
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs;
  }
  
  // Export logs
  exportLogs() {
    const logData = {
      timestamp: new Date().toISOString(),
      logs: this.logs,
      system: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      }
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-frontend-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // Clear logs
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('pos_error_logs');
    console.log('🧹 Frontend logs cleared');
  }
  
  // Configure logger
  setLogLevel(level) {
    if (this.levels[level] !== undefined) {
      this.logLevel = level;
      localStorage.setItem('pos_log_level', level);
      console.log(`📊 Log level set to: ${level}`);
    }
  }
  
  enable() {
    this.isEnabled = true;
    localStorage.setItem('pos_logging_enabled', 'true');
    console.log('📊 Frontend logging enabled');
  }
  
  disable() {
    this.isEnabled = false;
    localStorage.setItem('pos_logging_enabled', 'false');
    console.log('📊 Frontend logging disabled');
  }
}

// Create global logger instance
const logger = new FrontendLogger();

// API Helper with logging
class APILogger {
  static async request(url, options = {}) {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    // Log the request
    logger.apiRequest(method, url, options.body, options.headers);
    
    try {
      const response = await fetch(url, {
        credentials: 'include', // Include session cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Log the response
      const responseSize = response.headers.get('content-length') || 0;
      logger.apiResponse(method, url, response.status, responseTime, responseSize, response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      // Log the error
      logger.apiError(method, url, error);
      throw error;
    }
  }
  
  static get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }
  
  static post(url, body, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
  }
  
  static put(url, body, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    });
  }
  
  static delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// React component logging helper
const useLogger = (componentName) => {
  React.useEffect(() => {
    logger.componentMount(componentName);
    
    return () => {
      logger.componentUnmount(componentName);
    };
  }, [componentName]);
  
  return logger;
};

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Uncaught JavaScript Error', {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
    stack: event.error?.stack
  }, 'system');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason,
    stack: event.reason?.stack
  }, 'system');
});

// Navigation logging
let currentPage = window.location.pathname;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  const newPage = args[2] || window.location.pathname;
  logger.navigationChange(currentPage, newPage);
  currentPage = newPage;
  return originalPushState.apply(history, args);
};

history.replaceState = function(...args) {
  const newPage = args[2] || window.location.pathname;
  logger.navigationChange(currentPage, newPage);
  currentPage = newPage;
  return originalReplaceState.apply(history, args);
};

// Expose logger globally for debugging
window.posLogger = logger;
window.posAPI = APILogger;

export { logger, APILogger, useLogger };
export default logger;