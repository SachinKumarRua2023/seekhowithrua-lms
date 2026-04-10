# Mobile App P2P Architecture

## Platform Separation Policy

**IMPORTANT**: For peer-to-peer voice connections:
- **Mobile users connect to mobile users only**
- **Web users connect to web users only**

This separation is required because:
1. **Different WebRTC implementations**: Mobile uses `react-native-webrtc`, Web uses browser native WebRTC
2. **Different signaling protocols**: Mobile and web use different peer discovery mechanisms
3. **Connection reliability**: Cross-platform P2P connections have known compatibility issues

## Architecture Overview

### Mobile Stack
- **WebRTC Library**: `react-native-webrtc` (v124.0.7)
- **Signaling**: WebSocket to Django Channels
- **Transport**: UDP/TCP via mobile network/WiFi
- **Codec**: Opus for audio

### Web Stack  
- **WebRTC Library**: Browser native WebRTC API
- **Signaling**: WebSocket to Django Channels
- **Transport**: UDP/TCP via browser
- **Codec**: Opus for audio

## Implementation in VCRoom.tsx

The mobile app already handles this separation:
- Mobile panels are created/joined via `/api/panels/` endpoints
- Mobile uses WebSocket signaling at `EXPO_PUBLIC_WS_URL`
- Mobile-to-mobile connections are established via `RTCPeerConnection` from `react-native-webrtc`

## Environment Variables

Create `.env` file in `seekhowithrua-mobile/`:
```
EXPO_PUBLIC_API_URL=https://api.seekhowithrua.com
EXPO_PUBLIC_WS_URL=wss://api.seekhowithrua.com/ws
```

## Running the Mobile App

```bash
cd seekhowithrua-mobile
npm install
npx expo start
```

Scan QR code with Expo Go app on iOS/Android, or press 'a' for Android emulator, 'i' for iOS simulator.
