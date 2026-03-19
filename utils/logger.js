'use strict';

const { createLogger, format, transports } = require('winston');

const fs = require('fs');
const path = require('path');

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    // Console logs with clean formatting
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, requestId, duration, status, ...meta }) => {
          const reqInfo = requestId ? ` [${requestId}]` : '';
          const statusInfo = status ? ` status:${status}` : '';
          const durInfo = duration ? ` duration:${duration}` : '';
          return `${timestamp} ${level}: ${message}${reqInfo}${statusInfo}${durInfo}`;
        })
      )
    }),

    // Error logs
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),

    // Combined logs
    new transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ],
  exitOnError: false
});

module.exports = logger;
