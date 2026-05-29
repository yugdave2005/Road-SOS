<div align="center">
  <img src="./docs/banner.png" alt="RoadSOS Banner" width="100%" />

  # RoadSOS 🚑🚗
  
  **Offline-first emergency services & vehicular support in your pocket.**

  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
  [![Realm](https://img.shields.io/badge/Realm-39477F?style=for-the-badge&logo=realm&logoColor=white)](https://realm.io/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
</div>

<br />

RoadSOS is a privacy-focused mobile application built to provide immediate access to emergency services during critical situations—especially when cellular connectivity is unavailable, spotty, or unreliable. 

Built with React Native (Expo SDK 56) and optimized for low-resource environments, RoadSOS uses a highly efficient local caching strategy powered by Realm DB and OpenStreetMap data to ensure that users are never stranded.

---

## 📸 Interactive Preview

<div align="center">
  <img src="./docs/sos.png" alt="SOS Screen" width="45%" style="border-radius: 12px; margin-right: 2%; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />
  <img src="./docs/map.png" alt="Offline Map Screen" width="45%" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />
</div>

---

## 🚀 Key Features

- 📶 **True Offline Capability:** Browse nearby hospitals, police stations, trauma centers, and towing services with zero internet connection via pre-bundled and pre-cached OpenStreetMap data.
- 🗺️ **Smart Trip Corridors:** Plan your road trip and automatically download an offline emergency POI buffer along your exact OSRM-routed corridor before departure.
- ⏱️ **5-Second SOS Dialer:** A built-in panic button that initiates an auto-dial countdown to emergency services. 
- 🎙️ **Voice-Activated AI Assistant:** "Hold for AI" voice button powered by the Groq LLaMA-3 API provides instantaneous, voice-transcribed emergency guidance.
- 📱 **Intelligent Fallbacks:** SMS fallbacks directly trigger your native SMS app to send your exact GPS coordinates to designated emergency contacts if internet API requests fail. 
- 💸 **Rate-Limited API:** Implements strict client-side hard caps (80% free tier margins) on API integrations, ensuring completely $0.00/month running costs.

---

## 🧠 System Architecture

The core philosophy of RoadSOS is **"Zero network calls in the hot path"**. All critical emergency queries hit a local Realm Database first.

<div align="center">
  <img src="./docs/flowchart.png" alt="RoadSOS System Architecture Flowchart" width="80%" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.3);" />
</div>

---

## 🎙️ AI Voice Workflow

Our AI processing ensures that if the API is unreachable, the system gracefully degrades to a native SMS intent, ensuring the user is always heard.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Groq as Groq AI API
    participant OS as Native Dialer/SMS

    User->>App: Holds "AI Button" (Starts speaking)
    User->>App: Releases Button
    App->>App: react-native-voice processes STT
    
    alt Internet is Fast
        App->>Groq: Query LLaMA-3 with Transcript
        Groq-->>App: Returns Advice
        App->>User: Displays Instant AI Advice
    else Internet Failed / Rate Limited
        App->>App: Trigger SmsFallback
        App->>OS: Opens sms: URI with Transcript + GPS
        OS->>User: Native Messages App Ready to Send
    end
```

---

## 🛠️ Tech Stack

- **Framework:** React Native / Expo (SDK 56, Expo Router)
- **Database:** Realm DB (Local-first, encrypted schema v2)
- **Map Engine:** `react-native-maps` with offline MBTiles support and dynamic OSM fallback 
- **AI Processing:** `@react-native-voice/voice` (STT) + Groq API
- **Background Sync:** `react-native-background-fetch` (24hr periodic sync for 50km home zones)

---

## 📦 Getting Started

### Prerequisites
- Node.js >= 18
- Android Studio / Xcode (for emulation)
- EAS CLI (`npm i -g eas-cli`)

### Installation & Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/yugdave2005/Road-SOS.git
cd Road-SOS/apps/mobile

# 2. Install dependencies
npm install

# 3. (Optional) Run Expo prebuild to generate native directories
npx expo prebuild

# 4. Launch the Metro bundler
npx expo start --dev-client
```

### Building the APK (Android)
Generate an Android APK directly via EAS:
```bash
npx eas build --profile preview --platform android
```

---

## 🔒 Privacy First

RoadSOS does not require user accounts, tracks zero analytics, and performs all primary geofencing and POI queries locally on the device using Realm DB. Your location data never leaves your device unless you explicitly trigger an AI query or SMS fallback.

---

## 📝 License

This project is licensed under the MIT License.
