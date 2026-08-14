# Tanryugram Native Android App (`com.tanryugram`)

We have fully developed the native Android mobile app wrapper for **Tanryugram**, configured with the exact package name **`com.tanryugram`**, integrated with `react-native-webview` for full in-app access to all platform features (Messenger groups, WebRTC calls, polls, events, stories, and rich media), and connected directly to your live platform at `https://pulsesocil-ya4mwil9.manus.space`.

---

## Why Cloud APK Compilation is Required
Because Android compilation (`.apk` generation via Gradle / Android SDK) requires heavy native tooling (Java JDK 17, Android Build Tools, Gradle daemon) that cannot run locally on standard Windows machines without installing Android Studio, Expo's cloud compiler (EAS Build) compiles the app securely on remote Linux servers and provides a direct download link for your `.apk` file.

---

## 3-Step Instant APK Build (No Linux / Android Studio Required on Windows)

You can trigger the cloud build right now from any terminal or PowerShell window on Windows:

1. **Install Node.js** (if not already installed) from [nodejs.org](https://nodejs.org).
2. **Open PowerShell / Command Prompt** and run:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Navigate to the mobile app folder and build your APK**:
   ```bash
   cd C:\path\to\pulse-social\mobile-companion
   eas build --platform android --profile production
   ```

- EAS will compile your app with package name **`com.tanryugram`** and output a direct download link for your standalone `.apk` file.
- Share that `.apk` file directly with your 200 beta testers!

---
*Tanryugram Native Android App · Package: com.tanryugram*
