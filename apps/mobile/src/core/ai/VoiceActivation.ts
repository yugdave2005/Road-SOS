import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Logger } from '../utils/Logger';
import { Platform, PermissionsAndroid } from 'react-native';

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
    
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (grants !== PermissionsAndroid.RESULTS.GRANTED) {
          if (onError) onError('Microphone permission denied.');
          return;
        }
      } catch (err) {
        Logger.error('[VoiceActivation] Permission error', err);
        if (onError) onError('Permission error');
        return;
      }
    }

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

