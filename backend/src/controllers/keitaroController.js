import { getClickBySource } from '../models/clickModel.js';
import { extractSourceFromParams } from '../utils/keitaroUtils.js';
import { createKeitaroLog } from '../models/keitaroLogModel.js';

/**
 * API endpoint for Keitaro server-to-server request
 * Returns JSON with resolved sub_id_2 value
 */
export const getSubId2 = async (req, res) => {
  const startTime = Date.now();
  const requestParams = { ...req.query, ...req.body };
  let responseData = null;
  let found = false;
  let source = null;

  // Log incoming request for debugging
  console.log(`[Keitaro API] Incoming request: ${req.method} ${req.originalUrl || req.url}`);
  console.log(`[Keitaro API] Query params:`, req.query);
  console.log(`[Keitaro API] Body:`, req.body);
  console.log(`[Keitaro API] IP:`, req.ip || req.connection.remoteAddress);

  try {
    // Get parameters from query string or body
    const params = { ...req.query, ...req.body };
    
    // Extract source (domain)
    source = extractSourceFromParams(params);
    
    if (!source) {
      console.log(`[Keitaro API] Source not found (${Date.now() - startTime}ms)`);
      
      responseData = {
        success: true,
        sub_id_2: null,
        source: null,
        found: false,
        message: 'Source not found'
      };
      
      res.json(responseData);
      return;
    }
    
    // Search for latest sub_id_2 value in database
    const clickData = await getClickBySource(source);
    
    if (clickData && clickData.sub_id_2) {
      // Found value
      found = true;
      console.log(`[Keitaro API] Resolved: ${source} -> sub_id_2=${clickData.sub_id_2} (${Date.now() - startTime}ms)`);
      
      responseData = {
        success: true,
        sub_id_2: clickData.sub_id_2,
        source: source,
        found: true
      };
      
      res.json(responseData);
      return;
    } else {
      // Not found in database
      console.log(`[Keitaro API] Not found: ${source} -> sub_id_2=null (${Date.now() - startTime}ms)`);
      
      responseData = {
        success: true,
        sub_id_2: null,
        source: source,
        found: false
      };
      
      res.json(responseData);
      return;
    }
    
  } catch (error) {
    console.error('[Keitaro API] Error resolving sub_id_2:', error);
    
    responseData = {
      success: false,
      sub_id_2: null,
      source: source,
      found: false,
      error: error.message
    };
    
    res.status(500).json(responseData);
    return;
  } finally {
    // Log the request asynchronously (don't await to not block response)
    const responseTime = Date.now() - startTime;
    
    // Use source from try block or extract again
    if (!source) {
      source = extractSourceFromParams(requestParams);
    }
    
    // Ensure responseData is set
    if (!responseData) {
      responseData = {
        success: false,
        sub_id_2: null,
        source: source,
        found: false,
        error: 'Unknown error'
      };
    }
    
    // Log asynchronously without blocking
    createKeitaroLog({
      method: req.method,
      url: req.originalUrl || req.url,
      source: source || null,
      params: requestParams,
      response: responseData,
      responseTime,
      ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      found: found
    }).catch(logError => {
      // Don't fail the request if logging fails
      console.error('Error logging Keitaro request:', logError);
    });
  }
};

