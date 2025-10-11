import { createMiddleware } from 'hono/factory';
import { config } from '../config';

/**
 * Middleware to enforce API key authentication.
 *
 * This middleware checks for the presence of the `X-API-Key` header and validates
 * its value against the `API_KEY` defined in the application configuration.
 */
export const apiKeyAuth = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('X-API-Key');

  // Reject if the API key is missing or is not a string
  if (!apiKey || typeof apiKey !== 'string') {
    return c.json({ error: 'Unauthorized', message: 'API key is missing or invalid.' }, 401);
  }

  // Reject if the API key is incorrect
  if (apiKey !== config.apiKey) {
    return c.json({ error: 'Unauthorized', message: 'Invalid API key.' }, 401);
  }

  // Reject if the configured API key is not set
  if (!config.apiKey) {
    console.error('CRITICAL: API_KEY is not configured on the server, but authentication is enabled. Rejecting all requests.');
    return c.json({ error: 'Internal Server Error', message: 'Server configuration error.' }, 500);
  }


  // If the key is valid, proceed to the next middleware or handler
  await next();
});