import {
  getKeitaroLogs,
  getKeitaroLogById,
  getKeitaroLogsCount
} from '../models/keitaroLogModel.js';

/**
 * Get all Keitaro logs with pagination and filters
 */
export const getAllKeitaroLogs = async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      source,
      found
    } = req.query;

    const options = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      source: source || undefined,
      found: found !== undefined ? found === 'true' : undefined
    };

    const [logs, total] = await Promise.all([
      getKeitaroLogs(options),
      getKeitaroLogsCount(options)
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
    console.error('Error fetching Keitaro logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching logs',
      details: error.message
    });
  }
};

/**
 * Get single Keitaro log by ID
 */
export const getKeitaroLogByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await getKeitaroLogById(parseInt(id, 10));

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
    console.error('Error fetching Keitaro log:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching log',
      details: error.message
    });
  }
};

