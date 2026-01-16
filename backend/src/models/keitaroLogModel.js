import getDb from '../config/database.js';

/**
 * Create a new log entry for Keitaro click processing
 */
export const createLog = async (logData) => {
  const db = getDb();
  const query = `
    INSERT INTO keitaro_logs (
      source, sub_id_2, original_params, resolved_sub_id_2, 
      status, redirect_url, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    logData.source || null,
    logData.sub_id_2 || null,
    JSON.stringify(logData.originalParams || {}),
    logData.resolvedSubId2 || null,
    logData.status,
    logData.redirectUrl || null,
    logData.errorMessage || null
  ];
  
  await db.run(query, params);
  return { success: true };
};

/**
 * Get all logs with pagination
 */
export const getAllLogs = async (limit = 100, offset = 0) => {
  const db = getDb();
  const query = `
    SELECT * FROM keitaro_logs 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `;
  const result = await db.all(query, [limit, offset]);
  
  // Parse JSON fields
  return result.map(log => ({
    ...log,
    original_params: JSON.parse(log.original_params || '{}')
  }));
};

/**
 * Get logs filtered by source
 */
export const getLogsBySource = async (source, limit = 50) => {
  const db = getDb();
  const query = `
    SELECT * FROM keitaro_logs 
    WHERE source = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  const result = await db.all(query, [source, limit]);
  
  return result.map(log => ({
    ...log,
    original_params: JSON.parse(log.original_params || '{}')
  }));
};

/**
 * Get statistics about logs
 */
export const getLogsStats = async () => {
  const db = getDb();
  const statsQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'not_found' THEN 1 ELSE 0 END) as not_found_count,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
    FROM keitaro_logs
  `;
  const stats = await db.get(statsQuery);
  return stats;
};

