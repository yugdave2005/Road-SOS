import { Logger } from '../utils/Logger';
import { RateLimiter, RateLimitConfig } from '../utils/RateLimiter';

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY'; // In production, load from secure env
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MINUTE_LIMIT: RateLimitConfig = {
  key: 'groq_min',
  maxRequests: 24, // 80% of 30 req/min limit
  timeWindowMs: 60 * 1000,
};

const DAY_LIMIT: RateLimitConfig = {
  key: 'groq_day',
  maxRequests: 4800, // 80% of 6000 req/day limit
  timeWindowMs: 24 * 60 * 60 * 1000,
};

export class GroqClient {
  static async ask(prompt: string): Promise<string> {
    const minAllowed = await RateLimiter.checkLimit(MINUTE_LIMIT);
    if (!minAllowed) {
      throw new Error('Groq minute limit reached (80% cap). Please wait or use SMS fallback.');
    }

    const dayAllowed = await RateLimiter.checkLimit(DAY_LIMIT);
    if (!dayAllowed) {
      throw new Error('Groq daily limit reached (80% cap). Please use SMS fallback.');
    }

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are ROADSOS AI, an offline-first emergency assistant. Keep responses under 50 words. Provide direct, actionable survival/medical/repair advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response from AI.';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown network error';
      Logger.error('[GroqClient]', msg);
      throw new Error(`AI unavailable: ${msg}. Try SMS fallback.`);
    }
  }
}
