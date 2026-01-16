/**
 * Extract source (domain) from request parameters
 */
export const extractSourceFromParams = (params) => {
  // Possible parameter names for source
  return params.source || params.domain || params.referrer || null;
};

