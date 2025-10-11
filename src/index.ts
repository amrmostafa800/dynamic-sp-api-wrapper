import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { swaggerUI } from '@hono/swagger-ui';
import { HTTPException } from 'hono/http-exception';
import pino from 'pino';

import { config } from './config';
import { apiKeyAuth } from './middleware/auth';
import { generatedRouters } from './generated/routers';
import { openApiSpec } from './generated/openapi';

// Initialize structured logger
const log = pino({ level: config.logging.level });

// Initialize Hono app
const app = new Hono();

// --- Middleware ---

// Structured request logging
app.use('*', logger((message, ...rest) => log.info({ message, ...rest })));

// --- Error Handling ---
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Use the HTTPException's response
    return err.getResponse();
  }
  // Log the unexpected error
  log.error({
    err,
    req: {
      method: c.req.method,
      url: c.req.url,
    },
  }, 'An unexpected error occurred');

  // Return a generic 500 error response
  return c.json({ message: 'Internal Server Error' }, 500);
});


// --- API Key Authentication ---

// Protect all /api routes with API key authentication
app.use('/api/*', apiKeyAuth);


// --- Dynamically Register Routers ---

// Loop through the generated routers and mount them
generatedRouters.forEach((router, modelName) => {
  app.route(`/api/${modelName}`, router);
  log.info(`Mounted router for /api/${modelName}`);
});


// --- Documentation ---

// Serve Swagger UI for API documentation
app.get(
  '/ui',
  swaggerUI({
    url: '/doc',
  }),
);

// Serve the dynamically generated OpenAPI specification
app.get('/doc', (c) => {
  return c.json(openApiSpec);
});


// --- Server ---

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

log.info(`Server is running on port ${port}`);
log.info(`Swagger UI available at http://localhost:${port}/ui`);

export default {
  port,
  fetch: app.fetch,
};