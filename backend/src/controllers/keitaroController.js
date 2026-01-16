import { getClickBySource } from '../models/clickModel.js';
import { extractSourceFromParams } from '../utils/keitaroUtils.js';

/**
 * API endpoint for Keitaro server-to-server request
 * Returns JSON with resolved sub_id_2 value
 */
export const getSubId2 = async (req, res) => {
  const startTime = Date.now();

  try {
    // Get parameters from query string or body
    const params = { ...req.query, ...req.body };
    
    // Extract source (domain)
    const source = extractSourceFromParams(params);
    
    if (!source) {
      console.log(`[Keitaro API] Source not found (${Date.now() - startTime}ms)`);
      
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
      console.log(`[Keitaro API] Resolved: ${source} -> sub_id_2=${clickData.sub_id_2} (${Date.now() - startTime}ms)`);
      
      return res.json({
        success: true,
        sub_id_2: clickData.sub_id_2,
        source: source,
        found: true
      });
    } else {
      // Not found in database
      console.log(`[Keitaro API] Not found: ${source} -> sub_id_2=null (${Date.now() - startTime}ms)`);
      
      return res.json({
        success: true,
        sub_id_2: null,
        source: source,
        found: false
      });
    }
    
  } catch (error) {
    console.error('[Keitaro API] Error resolving sub_id_2:', error);
    
    return res.status(500).json({
      success: false,
      sub_id_2: null,
      error: error.message
    });
  }
};

