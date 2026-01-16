import {
  getRequestLogs,
  getRequestLogById,
  getRequestLogsCount,
  deleteOldLogs
} from '../models/requestLogModel.js';

/**
 * Get all request logs with pagination and filters
 */
export const getAllLogs = async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      method,
      statusCode,
      path
    } = req.query;

    const options = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      method: method || undefined,
      statusCode: statusCode ? parseInt(statusCode, 10) : undefined,
      path: path || undefined
    };

    const [logs, total] = await Promise.all([
      getRequestLogs(options),
      getRequestLogsCount(options)
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
        hasMore: options.offset + logs.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching request logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching logs',
      details: error.message
    });
  }
};

/**
 * Get single request log by ID
 */
export const getLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await getRequestLogById(parseInt(id, 10));

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error fetching request log:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching log',
      details: error.message
    });
  }
};

/**
 * Delete old logs (cleanup)
 */
export const cleanupOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const deletedCount = await deleteOldLogs(parseInt(daysToKeep, 10));

    res.json({
      success: true,
      message: `Deleted ${deletedCount} old log records`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error cleaning up logs',
      details: error.message
    });
  }
};

