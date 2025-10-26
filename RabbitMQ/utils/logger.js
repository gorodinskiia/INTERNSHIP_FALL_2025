/**
 * Logger utility for RabbitMQ examples
 */

const winston = require('winston');
const config = require('../config');

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  defaultMeta: { service: 'rabbitmq-examples' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${message}${metaStr}`;
      })
    )
  }));
}

// Export logger methods
module.exports = {
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Convenience methods for common patterns
  connection: {
    connected: (host, port) => logger.info('RabbitMQ connection established', { host, port }),
    disconnected: (host, port) => logger.warn('RabbitMQ connection lost', { host, port }),
    error: (error) => logger.error('RabbitMQ connection error', { error: error.message })
  },

  message: {
    sent: (queue, messageId, size) => logger.info('Message sent', { queue, messageId, size }),
    received: (queue, messageId) => logger.info('Message received', { queue, messageId }),
    processed: (messageId, duration) => logger.info('Message processed', { messageId, duration }),
    failed: (messageId, error) => logger.error('Message processing failed', { messageId, error: error.message })
  },

  queue: {
    declared: (name) => logger.info('Queue declared', { name }),
    bound: (queue, exchange, routingKey) => logger.info('Queue bound', { queue, exchange, routingKey }),
    deleted: (name) => logger.info('Queue deleted', { name })
  },

  exchange: {
    declared: (name, type) => logger.info('Exchange declared', { name, type }),
    bound: (destination, source, routingKey) => logger.info('Exchange bound', { destination, source, routingKey })
  }
};



