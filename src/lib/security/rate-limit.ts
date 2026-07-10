interface RateLimitRecord {
  count: number;
  timestamp: number;
}

export class RateLimiter {
  private cache = new Map<string, RateLimitRecord>();
  private capacity: number;
  private windowMs: number;
  private maxRequests: number;

  constructor(options: { capacity?: number; windowMs?: number; maxRequests?: number } = {}) {
    this.capacity = options.capacity || 10000;
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 100;
  }

  public check(key: string, customMax?: number, customWindow?: number): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now();
    const limit = customMax || this.maxRequests;
    const window = customWindow || this.windowMs;
    
    let record = this.cache.get(key);
    
    if (record) {
      this.cache.delete(key);
      
      if (now - record.timestamp > window) {
        record = { count: 1, timestamp: now };
      } else {
        record.count += 1;
      }
    } else {
      record = { count: 1, timestamp: now };
    }
    
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, record);
    
    const remaining = Math.max(0, limit - record.count);
    const reset = record.timestamp + window;
    
    return {
      success: record.count <= limit,
      limit,
      remaining,
      reset
    };
  }
}

export const globalRateLimiter = new RateLimiter();
