import { getClickBySource } from '../models/clickModel.js';
import { extractSourceFromParams, buildKeitaroRedirect, logClickProcessing } from '../utils/keitaroUtils.js';

/**
 * Handle click resolution from Keitaro
 * Extracts source, finds sub_id_2 in database, and redirects back with resolved value
 */
export const resolveKeitaroClick = async (req, res) => {
  const startTime = Date.now();
  let logData = {
    originalParams: {},
    status: 'error',
    errorMessage: null
  };

  try {
    // Get parameters from query string (GET request from Keitaro)
    const params = { ...req.query, ...req.body };
    logData.originalParams = params;
    
    // Extract source (domain)
    const source = extractSourceFromParams(params);
    logData.source = source;
    
    if (!source) {
      // If source not found, return with sub_id_2=null
      logData.status = 'not_found';
      logData.errorMessage = 'Source not found in request parameters';
      logData.resolvedSubId2 = null;
      logData.redirectUrl = buildKeitaroRedirect(params, null);
      
      // Log asynchronously (non-blocking)
      logClickProcessing(logData).catch(err => 
        console.error('Failed to log:', err)
      );
      
      return res.redirect(logData.redirectUrl);
    }
    
    // Search for latest sub_id_2 value in database
    const clickData = await getClickBySource(source);
    
    if (clickData && clickData.sub_id_2) {
      // Found value
      logData.status = 'success';
      logData.resolvedSubId2 = clickData.sub_id_2;
      logData.sub_id_2 = clickData.sub_id_2;
      logData.redirectUrl = buildKeitaroRedirect(params, clickData.sub_id_2);
      
      console.log(`[Keitaro] Resolved: ${source} -> sub_id_2=${clickData.sub_id_2} (${Date.now() - startTime}ms)`);
    } else {
      // Not found in database - set to null
      logData.status = 'not_found';
      logData.resolvedSubId2 = null;
      logData.redirectUrl = buildKeitaroRedirect(params, null);
      
      console.log(`[Keitaro] Not found: ${source} -> sub_id_2=null (${Date.now() - startTime}ms)`);
    }
    
    // Log asynchronously
    logClickProcessing(logData).catch(err => 
      console.error('Failed to log:', err)
    );
    
    // Perform redirect
    return res.redirect(logData.redirectUrl);
    
  } catch (error) {
    console.error('[Keitaro] Error resolving click:', error);
    
    logData.status = 'error';
    logData.errorMessage = error.message;
    
    // On error, return click back with sub_id_2=null
    const params = { ...req.query, ...req.body };
    logData.redirectUrl = buildKeitaroRedirect(params, null);
    
    // Log error
    logClickProcessing(logData).catch(err => 
      console.error('Failed to log error:', err)
    );
    
    return res.redirect(logData.redirectUrl);
  }
};

/**
 * API endpoint for Keitaro server-to-server request
 * Returns JSON with resolved sub_id_2 value (no redirect)
 */
export const getSubId2 = async (req, res) => {
  const startTime = Date.now();
  let logData = {
    originalParams: {},
    status: 'error',
    errorMessage: null
  };

  try {
    // Get parameters from query string or body
    const params = { ...req.query, ...req.body };
    logData.originalParams = params;
    
    // Extract source (domain)
    const source = extractSourceFromParams(params);
    logData.source = source;
    
    if (!source) {
      // If source not found, return null
      logData.status = 'not_found';
      logData.errorMessage = 'Source not found in request parameters';
      logData.resolvedSubId2 = null;
      
      // Log asynchronously (no redirect in API mode)
      logClickProcessing({
        ...logData,
        redirectUrl: null
      }).catch(err => console.error('Failed to log:', err));
      
      return res.json({
        success: true,
        sub_id_2: null,
        source: null,
        found: false,
        message: 'Source not found'
      });
    }
    
    // Search for latest sub_id_2 value in database
    const clickData = await getClickBySource(source);
    
    if (clickData && clickData.sub_id_2) {
      // Found value
      logData.status = 'success';
      logData.resolvedSubId2 = clickData.sub_id_2;
      logData.sub_id_2 = clickData.sub_id_2;
      
      console.log(`[Keitaro API] Resolved: ${source} -> sub_id_2=${clickData.sub_id_2} (${Date.now() - startTime}ms)`);
      
      // Log asynchronously (no redirect in API mode)
      logClickProcessing({
        ...logData,
        redirectUrl: null
      }).catch(err => console.error('Failed to log:', err));
      
      return res.json({
        success: true,
        sub_id_2: clickData.sub_id_2,
        source: source,
        found: true
      });
    } else {
      // Not found in database
      logData.status = 'not_found';
      logData.resolvedSubId2 = null;
      
      console.log(`[Keitaro API] Not found: ${source} -> sub_id_2=null (${Date.now() - startTime}ms)`);
      
      // Log asynchronously (no redirect in API mode)
      logClickProcessing({
        ...logData,
        redirectUrl: null
      }).catch(err => console.error('Failed to log:', err));
      
      return res.json({
        success: true,
        sub_id_2: null,
        source: source,
        found: false
      });
    }
    
  } catch (error) {
    console.error('[Keitaro API] Error resolving sub_id_2:', error);
    
    logData.status = 'error';
    logData.errorMessage = error.message;
    
    // Log error
    logClickProcessing({
      ...logData,
      redirectUrl: null
    }).catch(err => console.error('Failed to log error:', err));
    
    return res.status(500).json({
      success: false,
      sub_id_2: null,
      error: error.message
    });
  }
};

/**
 * Get Keitaro processing logs with statistics
 */
export const getKeitaroLogs = async (req, res) => {
  try {
    const { getAllLogs, getLogsStats } = await import('../models/keitaroLogModel.js');
    
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const [logs, stats] = await Promise.all([
      getAllLogs(limit, offset),
      getLogsStats()
    ]);
    
    res.json({
      success: true,
      data: logs,
      stats: stats,
      pagination: {
        limit,
        offset,
        total: stats.total
      }
    });
  } catch (error) {
    console.error('Error fetching Keitaro logs:', error);
    res.status(500).json({
      error: 'Error fetching logs',
      details: error.message
    });
  }
};

