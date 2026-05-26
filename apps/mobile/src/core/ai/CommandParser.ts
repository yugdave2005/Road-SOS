import { Logger } from '../utils/Logger';

export interface SosCommand {
  action: 'find_nearest' | 'call_emergency' | 'send_sms' | 'navigate' | 'unknown';
  category: 'hospital' | 'police' | 'ambulance' | 'towing' | 'pharmacy' | null;
  urgency: 'critical' | 'high' | 'medium';
  raw_intent: string;
}

export class CommandParser {
  static parse(jsonStr: string): SosCommand | null {
    try {
      // Find the first '{' and last '}' to strip out any LLM hallucinated preamble/postamble
      const startIdx = jsonStr.indexOf('{');
      const endIdx = jsonStr.lastIndexOf('}');
      
      if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
        Logger.warn('[CommandParser] Could not find valid JSON block in LLM response');
        return null;
      }

      const cleanJson = jsonStr.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(cleanJson);

      // Validate required fields
      if (!parsed.action || !parsed.urgency) {
        Logger.warn('[CommandParser] Parsed JSON missing required fields');
        return null;
      }

      return parsed as SosCommand;
    } catch (e) {
      Logger.error('[CommandParser] Failed to parse LLM output', e);
      return null;
    }
  }

  static executeCommand(command: SosCommand) {
    Logger.info(`[CommandParser] Executing command: ${command.action} for ${command.category}`);
    // Here we would orchestrate the UI or background actions based on the command
    // e.g., using a global event emitter or zustand store to trigger the SOS Screen search
  }
}
