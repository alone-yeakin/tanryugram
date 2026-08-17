# TanRyuGram Capacitor Android Setup

This project now contains a Capacitor configuration for the existing TanRyuGram web application. The web application remains the source of truth for the UI and WebRTC signaling; the Android project supplies native push delivery, notification channels, wake-screen behavior, and APK packaging.

## Prerequisites

Use Node.js 22 or newer, pnpm, Android Studio with the Android SDK and build tools installed, and a Firebase Android application whose package name is `com.tanryugram`. Keep the private `google-services.json` outside source control and place it at `android/app/google-services.json` after the Capacitor Android project is generated.

## Generate or refresh the Capacitor Android project

From the repository root:

```bash
pnpm install
pnpm run build
pnpm exec cap add android       # run once; skip if android/ already exists
pnpm exec cap sync android
pnpm exec cap open android
```

The current `capacitor.config.ts` uses `dist/public`, which is the production output directory produced by this repository’s build script. Run `pnpm run build` before every APK build so Android receives the latest web assets.

## Firebase and FCM

Enable Firebase Cloud Messaging for the Android app and add `google-services.json` to `android/app/`. The server already sends a high-priority data-plus-notification payload for `event=incoming_call`, with a 60-second TTL, a dedicated `calls_default` channel, `clickAction=TANRYUGRAM_CALL`, public lock-screen visibility, and a unique collapse key. The native shell also forwards received and tapped notification data to the WebView through `tanryugram-native-call-open`.

For a Capacitor-native wrapper, register the device token with the existing `notifications.registerPushToken` procedure. The web layer must continue to send its token using the existing `tanryugram-native-push-token` event contract, or the equivalent Capacitor push-registration callback.

## Android manifest requirements

The generated `android/app/src/main/AndroidManifest.xml` must retain these permissions for call delivery and WebRTC:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
```

The call entry activity should be exported, use `singleTask`, and include `showWhenLocked="true"` and `turnScreenOn="true"`. Add an intent filter for `TANRYUGRAM_CALL` and declare the Firebase default channel:

```xml
<meta-data
  android:name="com.google.firebase.messaging.default_notification_channel_id"
  android:value="calls_default" />
```

Android 14 and newer may restrict full-screen intents for apps that are not recognized as calling or alarm apps. The app must request notification permission, create a high-importance call channel, and the user may need to allow full-screen notifications in system settings. Battery optimization should be disabled for reliable ringing on aggressive OEM firmware such as Xiaomi HyperOS.

## Universal signed debug APK

In Android Studio select **Build > Generate App Bundles or APKs > Generate APKs**, or run:

```bash
cd android
./gradlew assembleDebug
```

The universal debug artifact is normally located at `android/app/build/outputs/apk/debug/app-debug.apk`. For a signed release APK, configure a local keystore through Gradle properties and run `./gradlew assembleRelease`. Do not commit keystores or Firebase private credentials.

## Capacitor push registration example

A Capacitor frontend can register for native push notifications with:

```ts
import { PushNotifications } from "@capacitor/push-notifications";

await PushNotifications.requestPermissions();
await PushNotifications.register();
PushNotifications.addListener("registration", ({ value }) => {
  window.dispatchEvent(new CustomEvent("tanryugram-native-push-token", { detail: { token: value } }));
});
PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
  window.dispatchEvent(new CustomEvent("tanryugram-native-call-open", { detail: notification.data }));
});
```

Use a native Android notification service or the Firebase/Capacitor notification bridge to create the `calls_default` channel and route `TANRYUGRAM_CALL` into the call activity. WebSockets remain the low-latency in-app path; FCM is the wake-up path when the app is backgrounded or terminated.
