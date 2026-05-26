import DeviceInfo from 'react-native-device-info';
import { Logger } from '../utils/Logger';

const SYSTEM_PROMPT = `
You are ROADSOS, an emergency response assistant. You are running offline on a mobile device.
The user may be panicked. Extract their intent as a JSON command.
Always respond with ONLY valid JSON matching this schema:
{
  "action": "find_nearest" | "call_emergency" | "send_sms" | "navigate" | "unknown",
  "category": "hospital" | "police" | "ambulance" | "towing" | "pharmacy" | null,
  "urgency": "critical" | "high" | "medium",
  "raw_intent": "<original user words>"
}
Never add any preamble or explanation. Only JSON.
`;

export class LlamaController {
  static async selectModel(): Promise<string> {
    const ramTotal = await DeviceInfo.getTotalMemory();
    const ramGb = ramTotal / 1e9;
    
    if (ramGb >= 5) {
      Logger.info('[LlamaController] Selected Q4_K_M model (>= 5GB RAM)');
      return 'gemma-2b-it-q4_k_m.gguf';   // 1.4 GB
    }
    
    Logger.info('[LlamaController] Selected Q2_K model (< 5GB RAM)');
    return 'gemma-2b-it-q2_k.gguf';       // 0.9 GB
  }

  static async initialise(): Promise<void> {
    const model = await this.selectModel();
    Logger.info(`[LlamaController] Initialising with model: ${model}`);
    // Native bridge to llama.cpp initialization would go here
  }

  static async infer(transcript: string): Promise<string> {
    Logger.info(`[LlamaController] Running inference for: "${transcript}"`);
    
    // In Phase 6, we scaffold the interface that will call llama.cpp native module
    // For now, we return a mock JSON response based on simple keyword matching as a fallback
    
    const lower = transcript.toLowerCase();
    let action = "unknown";
    let category = null;
    let urgency = "medium";

    if (lower.includes('hospital') || lower.includes('doctor') || lower.includes('injured')) {
      action = "find_nearest";
      category = "hospital";
      urgency = "critical";
    } else if (lower.includes('police') || lower.includes('robbed') || lower.includes('attack')) {
      action = "find_nearest";
      category = "police";
      urgency = "critical";
    } else if (lower.includes('tow') || lower.includes('breakdown') || lower.includes('flat tire')) {
      action = "find_nearest";
      category = "towing";
      urgency = "high";
    }

    const mockResponse = JSON.stringify({
      action,
      category,
      urgency,
      raw_intent: transcript
    });

    return mockResponse;
  }
}
