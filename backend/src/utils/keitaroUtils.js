const KEITARO_REDIRECT_BASE = process.env.KEITARO_REDIRECT_BASE;

if (!KEITARO_REDIRECT_BASE) {
  throw new Error('KEITARO_REDIRECT_BASE must be set in environment variables');
}

/**
 * Extract source (domain) from request parameters
 */
export const extractSourceFromParams = (params) => {
  // Possible parameter names for source
  return params.source || params.domain || params.referrer || null;
};

/**
 * Build redirect URL back to Keitaro with all original parameters
 */
export const buildKeitaroRedirect = (originalParams, resolvedSubId2) => {
  // Copy all original parameters
  const newParams = { ...originalParams };
  
  // Remove parameters that are not needed for redirect
  delete newParams.source;
  delete newParams.domain;
  delete newParams.referrer;
  
  // Always set sub_id_2 (even if null)
  newParams.sub_id_2 = resolvedSubId2 !== null && resolvedSubId2 !== undefined 
    ? resolvedSubId2 
    : null;
  
  // Build query string
  // For sub_id_2, always include it even if null (as "null" string)
  // For other params, filter out null/undefined/empty values
  const queryParams = new URLSearchParams();
  
  Object.entries(newParams).forEach(([key, value]) => {
    if (key === 'sub_id_2') {
      // Always include sub_id_2, even if null
      queryParams.append(key, value !== null && value !== undefined ? String(value) : 'null');
    } else if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  return `${KEITARO_REDIRECT_BASE}?${queryParams.toString()}`;
};

/**
 * Log click processing asynchronously (non-blocking)
 */
export const logClickProcessing = async (logData) => {
  try {
    const { createLog } = await import('../models/keitaroLogModel.js');
    await createLog(logData);
  } catch (error) {
    console.error('Error logging click processing:', error);
  }
};

