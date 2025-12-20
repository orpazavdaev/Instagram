// Simple logger for API requests
// Can be extended to use external services like Logtail, Datadog, etc.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  method?: string;
  url?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

const isDev = process.env.NODE_ENV !== 'production';

function formatLog(entry: LogEntry): string {
  const { timestamp, level, message, method, url, userId, duration, statusCode, error } = entry;
  
  const parts = [
    `[${timestamp}]`,
    `[${level.toUpperCase()}]`,
    message,
  ];
  
  if (method && url) parts.push(`${method} ${url}`);
  if (statusCode) parts.push(`Status: ${statusCode}`);
  if (duration !== undefined) parts.push(`Duration: ${duration}ms`);
  if (userId) parts.push(`User: ${userId}`);
  if (error) parts.push(`Error: ${error}`);
  
  return parts.join(' | ');
}

function log(level: LogLevel, message: string, metadata?: Partial<LogEntry>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };
  
  const formattedLog = formatLog(entry);
  
  // In development, use colored console output
  if (isDev) {
    const colors = {
      info: '\x1b[36m',    // Cyan
      warn: '\x1b[33m',    // Yellow
      error: '\x1b[31m',   // Red
      debug: '\x1b[90m',   // Gray
    };
    const reset = '\x1b[0m';
    console.log(`${colors[level]}${formattedLog}${reset}`);
  } else {
    // In production, output as JSON for log aggregation services
    console.log(JSON.stringify(entry));
  }
  
  return entry;
}

export const logger = {
  info: (message: string, metadata?: Partial<LogEntry>) => log('info', message, metadata),
  warn: (message: string, metadata?: Partial<LogEntry>) => log('warn', message, metadata),
  error: (message: string, metadata?: Partial<LogEntry>) => log('error', message, metadata),
  debug: (message: string, metadata?: Partial<LogEntry>) => log('debug', message, metadata),
  
  // API request logger
  request: (method: string, url: string, userId?: string) => {
    return log('info', 'API Request', { method, url, userId });
  },
  
  // API response logger
  response: (method: string, url: string, statusCode: number, duration: number, userId?: string) => {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    return log(level, 'API Response', { method, url, statusCode, duration, userId });
  },
  
  // Auth logger
  auth: (action: 'login' | 'logout' | 'register' | 'token_verify', userId?: string, success = true) => {
    const level = success ? 'info' : 'warn';
    return log(level, `Auth: ${action}`, { userId, metadata: { success } });
  },
  
  // Database operation logger
  db: (operation: string, table: string, duration?: number) => {
    return log('debug', `DB: ${operation} on ${table}`, { duration });
  },
};

export default logger;

