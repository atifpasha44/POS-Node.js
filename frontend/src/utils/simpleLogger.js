import axios from 'axios';

// Simple Frontend Logger for POS Application
class POSLogger {
  constructor() {
    this.isEnabled = true;
    this.logs = [];
    this.maxLogs = 500;
  }

  log(level, category, message, data = null) {
    if (!this.isEnabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      page: window.location.pathname
    };

    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    const emojis = {
      info: 'ℹ️',
      warn: '⚠️', 
      error: '❌',
      debug: '🐛'
    };

    const colors = {
      info: 'color: #0dcaf0',
      warn: 'color: #ffc107', 
      error: 'color: #dc3545; font-weight: bold',
      debug: 'color: #6c757d'
    };

    console.log(
      `%c${emojis[level]} [${category.toUpperCase()}] ${message}`,
      colors[level],
      data || ''
    );
  }

  info(category, message, data) { this.log('info', category, message, data); }
  warn(category, message, data) { this.log('warn', category, message, data); }
  error(category, message, data) { this.log('error', category, message, data); }
  debug(category, message, data) { this.log('debug', category, message, data); }

  // Component lifecycle
  componentMounted(componentName) {
    this.debug('component', `${componentName} mounted`);
  }

  componentUnmounted(componentName) {
    this.debug('component', `${componentName} unmounted`);
  }

  // User actions
  userAction(action, details) {
    this.info('user', `User ${action}`, details);
  }

  // Form submissions
  formSubmit(formName, success = true) {
    const level = success ? 'info' : 'error';
    this[level]('form', `Form ${formName} ${success ? 'submitted' : 'failed'}`);
  }

  // Export logs
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-frontend-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const logger = new POSLogger();

// Axios interceptors for automatic API logging
axios.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    
    logger.info('api', `🌐 Request: ${config.method?.toUpperCase()} ${config.url}`, {
      url: config.url,
      method: config.method,
      data: config.data ? (typeof config.data === 'string' ? 'FormData' : Object.keys(config.data)) : null
    });
    
    return config;
  },
  (error) => {
    logger.error('api', '💥 Request setup failed', {
      message: error.message,
      stack: error.stack
    });
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    logger.info('api', `✅ Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`, {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(response.data).length
    });
    
    return response;
  },
  (error) => {
    const endTime = new Date();
    const duration = error.config?.metadata ? endTime - error.config.metadata.startTime : 0;
    
    logger.error('api', `💥 Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      duration: duration ? `${duration}ms` : 'unknown'
    });
    
    return Promise.reject(error);
  }
);

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('system', 'Uncaught Error', {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('system', 'Unhandled Promise Rejection', {
    reason: event.reason?.message || event.reason,
    stack: event.reason?.stack
  });
});

// Expose globally for debugging
window.posLogger = logger;

export default logger;