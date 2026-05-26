import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Logger } from '../utils/Logger';
import { LlamaController } from './LlamaController';
import { CommandParser } from './CommandParser';

const WAKE_WORDS = ['sos', 'emergency', 'help', 'accident', 'injured'];

export class VoiceActivation {
  private static isListening = false;
  private static onCommandExtractedCallback: ((cmd: any) => void) | null = null;

  static async initialise(onCommandCallback?: (cmd: any) => void): Promise<void> {
    if (onCommandCallback) {
      this.onCommandExtractedCallback = onCommandCallback;
    }

    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = (e: SpeechErrorEvent) => Logger.error('[VoiceActivation] Speech error:', e);
    
    await LlamaController.initialise();
  }

  static async startListening(): Promise<void> {
    if (this.isListening) return;
    try {
      await Voice.start('en-US');
      this.isListening = true;
      Logger.info('[VoiceActivation] Started listening for wake words...');
    } catch (e) {
      Logger.error('[VoiceActivation] Failed to start listening', e);
    }
  }

  static async stopListening(): Promise<void> {
    if (!this.isListening) return;
    try {
      await Voice.stop();
      this.isListening = false;
      Logger.info('[VoiceActivation] Stopped listening.');
    } catch (e) {
      Logger.error('[VoiceActivation] Failed to stop listening', e);
    }
  }

  private static async onSpeechResults(e: SpeechResultsEvent) {
    const transcript = e.value?.[0]?.toLowerCase() ?? '';
    Logger.info(`[VoiceActivation] Transcript: "${transcript}"`);

    const isWake = WAKE_WORDS.some(w => transcript.includes(w));
    
    if (isWake) {
      Logger.info('[VoiceActivation] Wake word detected!');
      await this.onWakeWordDetected(transcript);
    }
  }

  private static async onWakeWordDetected(transcript: string) {
    try {
      // 1. Pass to local LLM for intent extraction
      const llmOutput = await LlamaController.infer(transcript);
      
      // 2. Parse the JSON
      const command = CommandParser.parse(llmOutput);
      
      if (command) {
        CommandParser.executeCommand(command);
        if (this.onCommandExtractedCallback) {
          this.onCommandExtractedCallback(command);
        }
      }
    } catch (e) {
      Logger.error('[VoiceActivation] Error processing wake word intent', e);
    }
  }
}
