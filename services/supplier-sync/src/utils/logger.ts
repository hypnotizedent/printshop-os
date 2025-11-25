import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'supplier-sync' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, service, ...meta }) => {
            let msg = `${timestamp} [${service}] ${level}: ${message}`;
            if (Object.keys(meta).length > 0) {
              try {
                // Safely stringify, avoiding circular references
                msg += ` ${JSON.stringify(meta, (key, value) => {
                  // Skip circular references and large objects
                  if (key === 'config' || key === 'request' || key === 'response') {
                    return '[Circular]';
                  }
                  return value;
                })}`;
              } catch (e) {
                msg += ` [Error serializing metadata]`;
              }
            }
            return msg;
          }
        )
      ),
    }),
    
    // Write errors to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs to file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add error handling for logger
logger.on('error', (error) => {
  console.error('Logger error:', error);
});
