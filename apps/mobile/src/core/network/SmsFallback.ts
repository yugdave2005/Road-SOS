import { Linking, Platform } from 'react-native';

const TWILIO_RELAY_NUMBER = process.env.TWILIO_RELAY_NUMBER ?? '+15005550006';
const MAX_SMS_CHARS = 160;

export interface SmsPayload {
  userLat: number;
  userLon: number;
  accuracyM: number;
  nearestPoiName: string;
  nearestPoiLat: number;
  nearestPoiLon: number;
}

export function buildSmsBody(payload: SmsPayload): string {
  const ts = Math.floor(Date.now() / 1000);
  const poiNameTrunc = payload.nearestPoiName.substring(0, 20);
  const body = [
    'ROADSOS',
    `${payload.userLat.toFixed(4)},${payload.userLon.toFixed(4)}`,
    `${Math.round(payload.accuracyM)}`,
    poiNameTrunc,
    `${payload.nearestPoiLat.toFixed(4)},${payload.nearestPoiLon.toFixed(4)}`,
    `${ts}`,
  ].join('|');

  if (body.length > MAX_SMS_CHARS) {
    throw new Error(`SMS payload too long: ${body.length} chars`);
  }
  return body;
}

export async function sendSosSms(payload: SmsPayload): Promise<void> {
  const body = buildSmsBody(payload);
  if (Platform.OS === 'android') {
    await Linking.openURL(`sms:${TWILIO_RELAY_NUMBER}?body=${encodeURIComponent(body)}`);
  } else {
    await Linking.openURL(`sms:${TWILIO_RELAY_NUMBER}&body=${encodeURIComponent(body)}`);
  }
}
