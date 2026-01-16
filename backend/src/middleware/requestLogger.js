import { createRequestLog } from '../models/requestLogModel.js';

/**
 * Middleware to log all HTTP requests and responses
 * Logs method, URL, headers, body, status code, response, and timing
 */
export const requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture request data
  const requestData = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
    headers: sanitizeHeaders(req.headers),
    body: req.body && Object.keys(req.body).length > 0 
      ? truncateData(req.body) 
      : null
  };

  // Store original res.json and res.send methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  let responseData = null;
  let responseCaptured = false;

  // Override res.json to capture response
  res.json = function(data) {
    if (!responseCaptured) {
      responseData = truncateData(data);
      responseCaptured = true;
    }
    return originalJson(data);
  };

  // Override res.send to capture response
  res.send = function(data) {
    if (!responseCaptured) {
      if (typeof data === 'string') {
        responseData = truncateString(data);
      } else {
        responseData = truncateData(data);
      }
      responseCaptured = true;
    }
    return originalSend(data);
  };

  // Log after response is sent
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    const logData = {
      ...requestData,
      statusCode: res.statusCode,
      response: responseData,
      responseTime
    };

    // Log asynchronously to not block the response
    try {
      await createRequestLog(logData);
    } catch (error) {
      // Don't fail the request if logging fails
      console.error('Error logging request:', error);
    }
  });

  next();
};

/**
 * Sanitize headers to remove sensitive information
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
const sanitizeHeaders = (headers) => {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'password',
    'token'
  ];

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
    // Also check case-insensitive
    const lowerHeader = header.toLowerCase();
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase() === lowerHeader) {
        sanitized[key] = '[REDACTED]';
      }
    });
  });

  return sanitized;
};

/**
 * Truncate data if it's too large
 * @param {*} data - Data to truncate
 * @param {number} maxSize - Maximum size in bytes (default: 10000)
 * @returns {*} Truncated data
 */
const truncateData = (data, maxSize = 10000) => {
  if (!data) return data;
  
  try {
    const jsonString = JSON.stringify(data);
    if (jsonString.length <= maxSize) {
      return data;
    }
    
    // Try to truncate intelligently if it's an object
    if (typeof data === 'object' && data !== null) {
      const truncated = { ...data };
      const truncatedString = JSON.stringify(truncated);
      if (truncatedString.length > maxSize) {
        return { 
          _truncated: true, 
          _message: 'Response too large, truncated',
          _size: jsonString.length,
          _maxSize: maxSize
        };
      }
    }
    
    return truncateString(jsonString, maxSize);
  } catch {
    return '[Unable to serialize response]';
  }
};

/**
 * Truncate string if it's too large
 * @param {string} str - String to truncate
 * @param {number} maxSize - Maximum size in characters (default: 10000)
 * @returns {string} Truncated string
 */
const truncateString = (str, maxSize = 10000) => {
  if (!str || str.length <= maxSize) {
    return str;
  }
  return str.substring(0, maxSize) + `... [truncated, original size: ${str.length}]`;
};

