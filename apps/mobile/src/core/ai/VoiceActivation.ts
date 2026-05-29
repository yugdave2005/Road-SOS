import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Logger } from '../utils/Logger';

export class VoiceActivation {
  private static isListening = false;
  private static onResultCallback: ((transcript: string) => void) | null = null;
  private static onErrorCallback: ((error: string) => void) | null = null;

  static async initialise(): Promise<void> {
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      Logger.error('[VoiceActivation] Speech error:', e);
      if (this.onErrorCallback) {
        this.onErrorCallback(e.error?.message || 'Unknown speech error');
      }
      this.isListening = false;
    };
  }

  static async startRecording(onResult: (t: string) => void, onError?: (e: string) => void): Promise<void> {
    if (this.isListening) return;
    this.onResultCallback = onResult;
    if (onError) this.onErrorCallback = onError;
    
    try {
      await Voice.start('en-US');
      this.isListening = true;
      Logger.info('[VoiceActivation] Started recording...');
    } catch (e) {
      Logger.error('[VoiceActivation] Failed to start recording', e);
      if (this.onErrorCallback) this.onErrorCallback('Failed to start recording');
    }
  }

  static async stopRecording(): Promise<void> {
    if (!this.isListening) return;
    try {
      await Voice.stop();
      this.isListening = false;
      Logger.info('[VoiceActivation] Stopped recording.');
    } catch (e) {
      Logger.error('[VoiceActivation] Failed to stop recording', e);
    }
  }

  private static onSpeechResults(e: SpeechResultsEvent) {
    const transcript = e.value?.[0] ?? '';
    Logger.info(`[VoiceActivation] Transcript: "${transcript}"`);

    if (this.onResultCallback && transcript.trim().length > 0) {
      this.onResultCallback(transcript);
    }
    
    // Auto stop after result
    this.stopRecording();
  }
}

