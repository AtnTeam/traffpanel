import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware for JWT token authentication
 * Validates JWT token from Authorization header
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token has expired'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

/**
 * Middleware for Keitaro API authentication
 * Optional security layer for server-to-server requests
 */
export const keitaroApiAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key || req.body.api_key;
  const validApiKey = process.env.KEITARO_API_KEY;
  
  // If API key is not configured, skip authentication
  if (!validApiKey) {
    return next();
  }
  
  // If API key is configured but not provided or invalid
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing API key'
    });
  }
  
  next();
};

