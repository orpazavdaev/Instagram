import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getUserFromRequest } from './auth';
import logger from './logger';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiHandlerOptions {
  // Methods that require authentication
  authRequired?: HttpMethod[];
  // Custom error handler
  onError?: (error: Error, req: NextApiRequest, res: NextApiResponse) => void;
}

// Wrapper for API handlers with logging and error handling
export function withLogging(
  handler: NextApiHandler,
  options: ApiHandlerOptions = {}
): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const method = req.method || 'UNKNOWN';
    const url = req.url || '';
    
    // Get user from request
    const payload = getUserFromRequest(req);
    const userId = payload?.userId;
    
    // Log incoming request
    logger.request(method, url, userId);
    
    // Check authentication if required
    if (options.authRequired?.includes(method as HttpMethod)) {
      if (!payload) {
        const duration = Date.now() - startTime;
        logger.response(method, url, 401, duration, userId);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }
    
    // Override res.json to log response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      logger.response(method, url, statusCode, duration, userId);
      return originalJson(body);
    };
    
    try {
      await handler(req, res);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('API Error', {
        method,
        url,
        userId,
        duration,
        error: errorMessage,
        statusCode: 500,
      });
      
      if (options.onError) {
        options.onError(error as Error, req, res);
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

// Helper to create handlers for different HTTP methods
export function createApiHandler(handlers: {
  GET?: NextApiHandler;
  POST?: NextApiHandler;
  PUT?: NextApiHandler;
  DELETE?: NextApiHandler;
  PATCH?: NextApiHandler;
}, options: ApiHandlerOptions = {}): NextApiHandler {
  return withLogging(async (req, res) => {
    const method = req.method as HttpMethod;
    const handler = handlers[method];
    
    if (!handler) {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    await handler(req, res);
  }, options);
}

export default withLogging;

