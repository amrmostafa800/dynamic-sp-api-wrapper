import SellingPartnerAPI from 'amazon-sp-api';
import { config } from '../config';
import { RateLimiterService } from './rate-limiter.service';
import rateLimitConfigs from '../config/rate-limits.json';

/**
 * Maps an AWS region to a Selling Partner API region.
 * @param awsRegion The AWS region (e.g., 'us-east-1').
 * @returns The corresponding SP-API region ('na', 'eu', 'fe').
 */
const getSpApiRegion = (awsRegion: string): 'na' | 'eu' | 'fe' => {
  if (awsRegion.startsWith('eu')) {
    return 'eu';
  }
  if (awsRegion.startsWith('ap')) {
    return 'fe';
  }
  return 'na';
};

/**
 * A service to interact with the Amazon Selling Partner API (SP-API).
 * It encapsulates the `amazon-sp-api` client and integrates the rate limiter.
 * This service is designed to be called dynamically by the generated routers.
 */
class SpApiServiceImpl {
  private spApiClient: SellingPartnerAPI;
  private rateLimiter: RateLimiterService;

  constructor() {
    const spApiRegion = getSpApiRegion(config.amazonSpApi.awsRegion);
    const hasCredentials =
      config.amazonSpApi.clientId &&
      config.amazonSpApi.clientSecret &&
      config.amazonSpApi.refreshToken;

    this.spApiClient = new SellingPartnerAPI({
      region: spApiRegion,
      refresh_token: config.amazonSpApi.refreshToken,
      credentials: {
        SELLING_PARTNER_APP_CLIENT_ID: config.amazonSpApi.clientId,
        SELLING_PARTNER_APP_CLIENT_SECRET: config.amazonSpApi.clientSecret,
        AWS_ACCESS_KEY_ID: '',
        AWS_SECRET_ACCESS_KEY: '',
        AWS_SELLING_PARTNER_ROLE: '',
      },
      options: {
        timeout: config.amazonSpApi.requestTimeout,
        only_grantless_operations: !hasCredentials,
      },
    });

    // Initialize the rate limiter with all known rate limits
    this.rateLimiter = new RateLimiterService(rateLimitConfigs);
  }

  /**
   * A generic method to call any SP-API operation.
   * It acquires a rate limit token before making the actual API call.
   * @param operation The ID of the operation to call (e.g., 'getOrders').
   * @param params An object containing path, query, and body parameters.
   * @returns The response from the SP-API.
   */
  public async callApi(
    operation: string,
    params: {
      path?: Record<string, any>;
      query?: Record<string, any>;
      body?: Record<string, any>;
    },
  ) {
    // Acquire a token from the rate limiter for the specific operation
    await this.rateLimiter.acquire(operation);

    // Add the default marketplace ID to the query if it's not already there
    const query = {
      ...params.query,
      MarketplaceIds: params.query?.MarketplaceIds || [config.amazonSpApi.marketplaceId],
    };

    const res = await this.spApiClient.callAPI({
      operation,
      path: params.path,
      query: Object.keys(query).length > 0 ? query : undefined,
      body: params.body,
    });

    return res;
  }
}

// Export a singleton instance of the service
export const SpApiService = new SpApiServiceImpl();