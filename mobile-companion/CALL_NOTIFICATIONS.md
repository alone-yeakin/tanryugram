# Tanryugram Mobile Calling Integration

Tanryugram uses the existing web application as the authenticated call room and the Expo mobile companion as a native delivery and presentation layer. The mobile app preserves the web session through a shared WebView cookie jar, registers a native push token, and forwards native call events back into the web call experience.

## Runtime responsibilities

| Concern | Web platform | Mobile companion |
|---|---|---|
| Authentication | Existing Manus session and protected tRPC procedures | Shared WebView cookies and the existing login flow |
| Call signaling | `messages.incomingCalls`, `messages.signal`, and `messages.updateCall` | Push delivery plus injected `tanryugram-native-call-open` and `tanryugram-native-call-response` events |
| Media | Browser WebRTC `RTCPeerConnection` with microphone/camera permissions | WebView media permissions and native permission declarations |
| Background delivery | Server push dispatch to registered device token | Expo notification channels, lock-screen-visible alerts, and native incoming-call card |
| History and status | Shared `messages` call records | Read through the same web experience; no second local call database |

## Incoming-call contract

The server creates a pending call record with a call type of `audio` or `video`. The web client polls for pending calls and, when running inside the native wrapper, posts this payload to the bridge:

```json
{
  "type": "incoming-call",
  "callId": 123,
  "callType": "audio",
  "callerName": "TanRyuGram member"
}
```

The mobile companion schedules a notification and displays a native incoming-call card when a notification is received or opened. **Answer** injects a `tanryugram-native-call-open` event into the WebView so the existing web call overlay can accept and establish the WebRTC session. **Decline** injects a `tanryugram-native-call-response` event with `status: "declined"`; the web client then calls `messages.updateCall` so the remote caller is notified and the pending call cannot remain open.

## WebRTC and signaling flow

The current browser call implementation is the media owner. It requests microphone and, for video calls, camera access, creates an `RTCPeerConnection`, exchanges offer/answer payloads through `messages.signal`, and updates lifecycle state through `messages.updateCall`. A TURN service can be added to the server-side signaling configuration when peer-to-peer connectivity is insufficient; the mobile wrapper does not maintain a separate signaling protocol.

The native wrapper must therefore keep JavaScript enabled, allow inline media playback, grant media capture for the Tanryugram host, preserve cookies, and avoid opening the call route in an external browser. These settings are already applied in `mobile-companion/App.tsx`.

## Push and background delivery

The web client registers the native device token through `notifications.registerPushToken`. The mobile companion creates Android notification channels for the configured ringtone choices and uses public lock-screen visibility. The platform notification payload should include `event: "incoming_call"`, `route: "call"`, `callId`, `callType`, and `callerName`. If the operating system terminates the JavaScript process, the notification remains the delivery mechanism; opening the notification reconstructs the same WebView event contract.

Expo notification delivery is not a substitute for a native Telecom/ConnectionService implementation. A future production-hardening pass may add a custom Android config plugin for a full-screen call activity and foreground media service. The current companion provides a reliable integration-ready bridge without claiming those platform-specific services are already present.

## Shared data boundaries

Call records remain in the shared server database and are accessed through the existing tRPC procedures. The mobile companion intentionally does not duplicate users, contacts, messages, presence, or call history locally. This prevents divergent state between the web and mobile surfaces and keeps authentication, privacy checks, blocked-user rules, and call lifecycle validation on the server.

## Verification scenarios

Test web-to-mobile calls while the companion is foregrounded, backgrounded, and opened from a notification. Verify that answer opens the existing WebRTC call overlay, decline updates the call to `declined`, and missed calls transition to the server-defined missed state. Repeat the same scenarios for audio and video, then test microphone and camera permission denial, app reload, and network interruption. These scenarios validate the bridge and shared call lifecycle; they do not replace device-level Android testing for full-screen lock-screen activities or foreground services.
