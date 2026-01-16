import getDb from '../config/database.js';

/**
 * Save request log to database
 * @param {Object} logData - Log data object
 * @param {string} logData.method - HTTP method
 * @param {string} logData.url - Request URL
 * @param {string} logData.path - Request path
 * @param {Object} logData.headers - Request headers (sanitized)
 * @param {Object|string} logData.body - Request body
 * @param {number} logData.statusCode - Response status code
 * @param {Object|string} logData.response - Response data
 * @param {number} logData.responseTime - Response time in ms
 * @param {string} logData.ip - Client IP address
 * @param {string} logData.userAgent - User agent string
 * @returns {Promise<Object>} Created log record
 */
export const createRequestLog = async (logData) => {
  const db = getDb();
  
  const {
    method,
    url,
    path,
    headers,
    body,
    statusCode,
    response,
    responseTime,
    ip,
    userAgent
  } = logData;

  const insertQuery = `
    INSERT INTO request_logs (
      method, url, path, headers, body, 
      status_code, response, response_time, 
      ip_address, user_agent, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  const params = [
    method,
    url,
    path,
    JSON.stringify(headers),
    typeof body === 'string' ? body : JSON.stringify(body),
    statusCode,
    typeof response === 'string' ? response : JSON.stringify(response),
    responseTime,
    ip,
    userAgent
  ];

  const result = await db.run(insertQuery, params);
  
  return {
    id: result.lastID,
    ...logData,
    created_at: new Date().toISOString()
  };
};

/**
 * Get all request logs with pagination
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records to return
 * @param {number} options.offset - Offset for pagination
 * @param {string} options.method - Filter by HTTP method
 * @param {number} options.statusCode - Filter by status code
 * @param {string} options.path - Filter by path (partial match)
 * @returns {Promise<Array>} Array of log records
 */
export const getRequestLogs = async (options = {}) => {
  const db = getDb();
  
  const {
    limit = 100,
    offset = 0,
    method,
    statusCode,
    path
  } = options;

  let query = 'SELECT * FROM request_logs WHERE 1=1';
  const params = [];

  if (method) {
    query += ' AND method = ?';
    params.push(method);
  }

  if (statusCode) {
    query += ' AND status_code = ?';
    params.push(statusCode);
  }

  if (path) {
    query += ' AND path LIKE ?';
    params.push(`%${path}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = await db.all(query, params);
  
  // Parse JSON fields
  return logs.map(log => ({
    ...log,
    headers: log.headers ? JSON.parse(log.headers) : null,
    body: log.body ? (tryParseJSON(log.body) || log.body) : null,
    response: log.response ? (tryParseJSON(log.response) || log.response) : null
  }));
};

/**
 * Get request log by ID
 * @param {number} id - Log ID
 * @returns {Promise<Object|null>} Log record or null
 */
export const getRequestLogById = async (id) => {
  const db = getDb();
  const query = 'SELECT * FROM request_logs WHERE id = ?';
  const result = await db.get(query, [id]);
  
  if (!result) {
    return null;
  }

  return {
    ...result,
    headers: result.headers ? JSON.parse(result.headers) : null,
    body: result.body ? (tryParseJSON(result.body) || result.body) : null,
    response: result.response ? (tryParseJSON(result.response) || result.response) : null
  };
};

/**
 * Get total count of request logs
 * @param {Object} filters - Filter options
 * @returns {Promise<number>} Total count
 */
export const getRequestLogsCount = async (filters = {}) => {
  const db = getDb();
  
  let query = 'SELECT COUNT(*) as count FROM request_logs WHERE 1=1';
  const params = [];

  if (filters.method) {
    query += ' AND method = ?';
    params.push(filters.method);
  }

  if (filters.statusCode) {
    query += ' AND status_code = ?';
    params.push(filters.statusCode);
  }

  if (filters.path) {
    query += ' AND path LIKE ?';
    params.push(`%${filters.path}%`);
  }

  const result = await db.get(query, params);
  return result.count;
};

/**
 * Delete old logs (cleanup)
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {Promise<number>} Number of deleted records
 */
export const deleteOldLogs = async (daysToKeep = 30) => {
  const db = getDb();
  const query = `
    DELETE FROM request_logs 
    WHERE created_at < datetime('now', '-' || ? || ' days')
  `;
  const result = await db.run(query, [daysToKeep]);
  return result.changes;
};

/**
 * Helper function to safely parse JSON
 */
const tryParseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

