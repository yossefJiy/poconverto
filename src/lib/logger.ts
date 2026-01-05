// Centralized logging system

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private output(entry: LogEntry) {
    if (this.isDevelopment) {
      const style = {
        info: 'color: #3b82f6',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444',
        debug: 'color: #8b5cf6',
      };

      console.log(
        `%c[${entry.level.toUpperCase()}] ${entry.timestamp}`,
        style[entry.level],
        entry.message,
        entry.context || ''
      );
    }
  }

  info(message: string, context?: LogContext) {
    const entry = this.formatLog('info', message, context);
    this.output(entry);
  }

  warn(message: string, context?: LogContext) {
    const entry = this.formatLog('warn', message, context);
    this.output(entry);
    console.warn(message, context);
  }

  error(error: Error | unknown, context?: LogContext) {
    const message = error instanceof Error ? error.message : String(error);
    const entry = this.formatLog('error', message, {
      ...context,
      stack: error instanceof Error ? error.stack : undefined,
    });
    this.output(entry);
    console.error(message, context);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const entry = this.formatLog('debug', message, context);
      this.output(entry);
    }
  }

  track(event: string, properties?: LogContext) {
    this.info(`[TRACK] ${event}`, properties);
    // Future: Send to analytics service
  }
}

export const logger = new Logger();
