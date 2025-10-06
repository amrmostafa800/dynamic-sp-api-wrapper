/**
 * Configuration for a single rate limit bucket.
 */
export interface RateLimitConfig {
  /**
   * The number of requests allowed per second (the rate).
   */
  requestsPerSecond: number;
  /**
   * The maximum number of requests that can be made in a burst.
   */
  burstLimit: number;
}

/**
 * Represents a token bucket for a specific API operation.
 */
interface Bucket {
  tokens: number;
  lastRefill: number;
  config: RateLimitConfig;
  requestQueue: (() => void)[]; // A queue of promise resolve functions
  isProcessing: boolean; // Flag to prevent multiple concurrent processing loops
}

/**
 * A service that provides rate limiting with a long-polling (wait) mechanism.
 * It uses the token bucket algorithm to enforce rate limits per operation.
 */
export class RateLimiterService {
  private buckets = new Map<string, Bucket>();

  /**
   * Initializes the rate limiter with configurations for various operations.
   * @param configs A record where keys are operation IDs and values are their rate limit configs.
   */
  constructor(configs: Record<string, RateLimitConfig>) {
    for (const operationId in configs) {
      const config = configs[operationId];
      if (config && config.requestsPerSecond > 0) {
        this.buckets.set(operationId, {
          tokens: config.burstLimit,
          lastRefill: Date.now(),
          config,
          requestQueue: [],
          isProcessing: false,
        });
      }
    }
  }

  /**
   * Refills the token bucket based on the elapsed time since the last refill.
   * @param bucket The bucket to refill.
   */
  private refillBucket(bucket: Bucket): void {
    const now = Date.now();
    const elapsedMs = now - bucket.lastRefill;
    const tokensToAdd = (elapsedMs / 1000) * bucket.config.requestsPerSecond;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        bucket.config.burstLimit,
        bucket.tokens + tokensToAdd,
      );
      bucket.lastRefill = now;
    }
  }

  /**
   * Processes the request queue for a given operation.
   * It dequeues and resolves promises as long as tokens are available.
   * If the queue remains non-empty, it schedules the next processing loop.
   * @param operationId The ID of the operation whose queue needs processing.
   */
  private processQueue(operationId: string): void {
    const bucket = this.buckets.get(operationId);
    if (!bucket || bucket.requestQueue.length === 0) {
      if(bucket) bucket.isProcessing = false;
      return;
    }

    bucket.isProcessing = true;
    this.refillBucket(bucket);

    while (bucket.requestQueue.length > 0 && bucket.tokens >= 1) {
      bucket.tokens--;
      const resolve = bucket.requestQueue.shift();
      if (resolve) {
        resolve();
      }
    }

    if (bucket.requestQueue.length > 0) {
      // Calculate the wait time for the next token.
      const timeToNextTokenMs = 1000 / bucket.config.requestsPerSecond;
      setTimeout(() => this.processQueue(operationId), timeToNextTokenMs);
    } else {
      bucket.isProcessing = false;
    }
  }

  /**
   * Acquires a token for a given operation.
   * If a token is not immediately available, the request is queued and will
   * resolve once its turn comes and a token is available.
   * @param operationId The ID of the operation to acquire a token for.
   * @returns A promise that resolves when the request is allowed to proceed.
   */
  public async acquire(operationId: string): Promise<void> {
    const bucket = this.buckets.get(operationId);

    // If no rate limit is configured for this operation, allow it immediately.
    if (!bucket) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      bucket.requestQueue.push(resolve);

      // If the queue is not already being processed, kick off the processing.
      if (!bucket.isProcessing) {
        this.processQueue(operationId);
      }
    });
  }
}