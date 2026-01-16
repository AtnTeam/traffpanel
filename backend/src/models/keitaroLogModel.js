import getDb from '../config/database.js';

/**
 * Save Keitaro request log to database
 */
export const createKeitaroLog = async (logData) => {
  const db = getDb();
  
  const {
    method,
    url,
    source,
    params,
    response,
    responseTime,
    ip,
    userAgent,
    found
  } = logData;

  const insertQuery = `
    INSERT INTO keitaro_logs (
      method, url, source, params, response, 
      response_time, ip_address, user_agent, 
      found, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;

  const paramsArray = [
    method,
    url,
    source,
    JSON.stringify(params),
    typeof response === 'string' ? response : JSON.stringify(response),
    responseTime,
    ip,
    userAgent,
    found ? 1 : 0
  ];

  const result = await db.run(insertQuery, paramsArray);
  
  return {
    id: result.lastID,
    ...logData,
    created_at: new Date().toISOString()
  };
};

/**
 * Get all Keitaro logs with pagination
 */
export const getKeitaroLogs = async (options = {}) => {
  const db = getDb();
  
  const {
    limit = 100,
    offset = 0,
    source,
    found
  } = options;

  let query = 'SELECT * FROM keitaro_logs WHERE 1=1';
  const params = [];

  if (source) {
    query += ' AND source LIKE ?';
    params.push(`%${source}%`);
  }

  if (found !== undefined) {
    query += ' AND found = ?';
    params.push(found ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const logs = await db.all(query, params);
  
  return logs.map(log => ({
    ...log,
    params: log.params ? JSON.parse(log.params) : null,
    response: log.response ? (tryParseJSON(log.response) || log.response) : null,
    found: log.found === 1
  }));
};

/**
 * Get Keitaro log by ID
 */
export const getKeitaroLogById = async (id) => {
  const db = getDb();
  const query = 'SELECT * FROM keitaro_logs WHERE id = ?';
  const result = await db.get(query, [id]);
  
  if (!result) {
    return null;
  }

  return {
    ...result,
    params: result.params ? JSON.parse(result.params) : null,
    response: result.response ? (tryParseJSON(result.response) || result.response) : null,
    found: result.found === 1
  };
};

/**
 * Get total count of Keitaro logs
 */
export const getKeitaroLogsCount = async (filters = {}) => {
  const db = getDb();
  
  let query = 'SELECT COUNT(*) as count FROM keitaro_logs WHERE 1=1';
  const params = [];

  if (filters.source) {
    query += ' AND source LIKE ?';
    params.push(`%${filters.source}%`);
  }

  if (filters.found !== undefined) {
    query += ' AND found = ?';
    params.push(filters.found ? 1 : 0);
  }

  const result = await db.get(query, params);
  return result.count;
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

