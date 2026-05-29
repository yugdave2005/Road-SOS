import { Linking, Platform } from 'react-native';
import { Logger } from '../utils/Logger';
import { UserLocation } from '@shared/hooks/useLocation';

const AI_BOT_NUMBER = 'YOUR_AI_BOT_NUMBER'; // A twilio or similar number that receives SMS and queries Groq
const KEYWORDS = ['HELP', 'SOS', 'MEDICAL', 'TOW', 'FIRE', 'POLICE'];

export class SmsFallback {
  /**
   * Generates a pre-filled SMS intent for offline keyword-based fallback.
   * Completely free as it uses the user's native SMS plan.
   */
  static async triggerSmsFallback(query: string, location?: UserLocation | null): Promise<void> {
    try {
      const isKeyword = KEYWORDS.some(k => query.toUpperCase().includes(k));
      let body = query;
      
      if (!isKeyword) {
        body = `[Query: ${query}] Please reply with standard advice.`;
      }

      if (location) {
        body += `\nLoc: ${location.lat.toFixed(4)},${location.lon.toFixed(4)}`;
      }

      const separator = Platform.OS === 'ios' ? '&' : '?';
      const url = `sms:${AI_BOT_NUMBER}${separator}body=${encodeURIComponent(body)}`;
      
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Logger.error('[SmsFallback] SMS URI not supported on this device.');
      }
    } catch (error) {
      Logger.error('[SmsFallback] Failed to open SMS client', error);
    }
  }
}
