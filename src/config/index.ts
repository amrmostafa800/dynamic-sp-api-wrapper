import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration.
 */
export const config = {
  /**
   * Selling Partner API (SP-API) configuration.
   */
  amazonSpApi: {
    /**
     * The client ID for your SP-API application.
     * @env SP_CLIENT_ID
     */
    clientId: process.env.SP_CLIENT_ID || '',
    /**
     * The client secret for your SP-API application.
     * @env SP_CLIENT_SECRET
     */
    clientSecret: process.env.SP_CLIENT_SECRET || '',
    /**
     * The refresh token for your SP-API application.
     * @env SP_REFRESH_TOKEN
     */
    refreshToken: process.env.SP_REFRESH_TOKEN || '',
    /**
     * The marketplace ID for the requests.
     * @env SP_MARKETPLACE_ID
     * @default 'ATVPDKIKX0DER'
     */
    marketplaceId: process.env.SP_MARKETPLACE_ID || 'ATVPDKIKX0DER',
    /**
     * The AWS region for the SP-API endpoint.
     * @env SP_AWS_REGION
     * @default 'us-east-1'
     */
    awsRegion: process.env.SP_AWS_REGION || 'us-east-1',
    /**
     * The request timeout in milliseconds.
     * @env SP_REQUEST_TIMEOUT
     * @default 300000 (5 minutes)
     */
    requestTimeout: process.env.SP_REQUEST_TIMEOUT
      ? parseInt(process.env.SP_REQUEST_TIMEOUT, 10)
      : 300000,
  },
  /**
   * Logging configuration.
   */
  logging: {
    /**
     * The log level.
     * @env LOG_LEVEL
     * @default 'info'
     */
    level: process.env.LOG_LEVEL || 'info',
  },
  /**
   * The secret key for API authentication.
   * @env API_KEY
   */
  apiKey: process.env.API_KEY || '',
};

// Validate that essential credentials are provided
if (
  !config.amazonSpApi.clientId ||
  !config.amazonSpApi.clientSecret ||
  !config.amazonSpApi.refreshToken
) {
  console.warn(
    'SP-API credentials (SP_CLIENT_ID, SP_CLIENT_SECRET, SP_REFRESH_TOKEN) are not set in the environment. API calls will likely fail.',
  );
}

// Validate that the API key is provided
if (!config.apiKey) {
  console.warn(
    'API_KEY is not set in the environment. All incoming requests will be rejected.',
  );
}