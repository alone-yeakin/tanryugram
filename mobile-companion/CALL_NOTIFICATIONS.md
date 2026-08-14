# Tanryugram Call & Push Notification Architecture

Tanryugram implements robust, production-grade call signaling and background notification delivery designed for Android and iOS mobile wrappers and web apps.

## 1. Incoming Call Signaling
- **Polling & Realtime**: Active calls poll signaling states (`pending`, `accepted`, `declined`, `missed`, `ended`) with optimized intervals.
- **Global Alert**: The `IncomingCallAlert` component renders a full-screen or banner incoming call overlay with ringtone audio and vibration triggers.
- **Busy Call Protection**: Concurrent incoming calls automatically trigger a busy state if a user is already in an active or ringing call.

## 2. Push Notifications & Background Delivery (`expo-notifications`)
- Mobile companion apps register an Expo push token via `trpc.notifications.registerPushToken`.
- Server-side call creation dispatches Expo push notifications so backgrounded or closed-app recipients receive immediate alerts and wake-up rings.

## 3. Native Mobile Ringtone & Vibration Bridge
- `mobile-companion/App.tsx` embeds WebView listeners and native vibration/audio playback for `tanryugram-ringtone.wav`.
