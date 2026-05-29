import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from './Logger';

export interface RateLimitConfig {
  key: string;
  maxRequests: number;
  timeWindowMs: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

/**
 * Handles API rate limiting to strictly enforce free-tier limits.
 * Uses 80% safety margin caps.
 */
export class RateLimiter {
  static async checkLimit(config: RateLimitConfig): Promise<boolean> {
    try {
      const now = Date.now();
      const stateStr = await AsyncStorage.getItem(`ratelimit_${config.key}`);
      let state: RateLimitState = stateStr 
        ? JSON.parse(stateStr) 
        : { count: 0, resetAt: now + config.timeWindowMs };

      if (now > state.resetAt) {
        state = { count: 0, resetAt: now + config.timeWindowMs };
      }

      if (state.count >= config.maxRequests) {
        Logger.warn(`[RateLimiter] Limit reached for ${config.key}: ${state.count}/${config.maxRequests}`);
        return false;
      }

      state.count += 1;
      await AsyncStorage.setItem(`ratelimit_${config.key}`, JSON.stringify(state));
      return true;
    } catch (error) {
      Logger.error(`[RateLimiter] Failed to check limit for ${config.key}`, error);
      // Fail open if AsyncStorage fails to prevent breaking app completely, but log it
      return true;
    }
  }

  static async getRemaining(config: RateLimitConfig): Promise<number> {
    try {
      const now = Date.now();
      const stateStr = await AsyncStorage.getItem(`ratelimit_${config.key}`);
      if (!stateStr) return config.maxRequests;
      
      const state: RateLimitState = JSON.parse(stateStr);
      if (now > state.resetAt) return config.maxRequests;
      
      return Math.max(0, config.maxRequests - state.count);
    } catch (error) {
      return config.maxRequests;
    }
  }
}
