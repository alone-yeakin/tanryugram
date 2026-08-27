# TanRyuGram Native Call Release Guide (Hardened)

This version of the mobile companion has been hardened for **reliable background incoming-call delivery** and **terminated-app ringing**.

## Key Fixes in this Release
1.  **Native FCM Integration**: Added `google-services` plugin and `firebase-messaging` dependencies to the Android build.
2.  **Full-Screen Intent**: Added `USE_FULL_SCREEN_INTENT` permission and category registration for lock-screen ringing.
3.  **Background Waking**: Added `WAKE_LOCK` and `SYSTEM_ALERT_WINDOW` permissions to ensure the app can wake the screen.
4.  **Foreground Media**: Added `FOREGROUND_SERVICE` permissions to maintain call audio/video stability.
5.  **Channel Sync**: Synchronized the notification channel (`calls_default`) with the server-side push payload.
6.  **Deep Link Routing**: Added `TANRYUGRAM_CALL` intent filter to `MainActivity` for direct call-UI triggering.

## Prerequisites
Before building, you **MUST** have:
-   **Android Studio** installed on your computer.
-   A **google-services.json** file from your Firebase project.
    -   Go to [Firebase Console](https://console.firebase.google.com/).
    -   Project Settings -> General -> Your apps -> TanRyuGram (Android).
    -   Download `google-services.json`.

## Build Instructions
1.  **Replace Configuration**:
    -   Copy your `google-services.json` into `mobile-companion/android/app/google-services.json`.
2.  **Open in Android Studio**:
    -   Launch Android Studio.
    -   Select **Open** and choose the `mobile-companion/android` folder.
3.  **Sync Gradle**:
    -   Wait for Android Studio to finish syncing the Gradle files.
4.  **Build Debug APK**:
    -   In the menu, go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
    -   The APK will be generated at `mobile-companion/android/app/build/outputs/apk/debug/app-debug.apk`.

## Testing Background Calls
1.  Install the APK on your device.
2.  Open the app, sign in, and **allow all permissions** (Microphone, Camera, Notifications, Draw over other apps).
3.  Close the app completely (kill it from the task switcher).
4.  Have another user call you.
5.  The device should show a high-priority notification or a full-screen ringing UI even if the app was closed.
