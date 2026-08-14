# Tanryugram Android APK Build & Distribution Guide

To provide your 200-person beta testers with a native Android APK of **Tanryugram**, follow these simple steps using Expo / React Native:

## 1. Prerequisites
- Node.js installed in your environment.
- An Expo account (free at [expo.dev](https://expo.dev)).

## 2. Initialize the Mobile App Wrapper
1. Create a mobile client workspace:
   ```bash
   npx create-expo-app tanryugram-mobile --template blank
   cd tanryugram-mobile
   ```
2. Install the tRPC client and React Query packages matching your web project:
   ```bash
   pnpm add @trpc/client @trpc/react-query @tanstack/react-query superjson
   ```

## 3. Configure API Endpoint
Point your mobile app client to your live Tanryugram backend URL (e.g. `https://your-domain.manus.space/api/trpc`).

## 4. Build the APK via EAS Build
1. Install the EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Configure your build profile in `eas.json`:
   ```json
   {
     "cli": { "version": ">= 5.0.0" },
     "build": {
       "development": { "developmentClient": true, "distribution": "internal" },
       "preview": { "distribution": "internal" },
       "production": { "android": { "buildType": "apk" } }
     }
   }
   ```
3. Run the APK build command:
   ```bash
   eas build --platform android --profile production
   ```
4. Once completed, Expo provides a secure direct download link for your `app-release.apk` file, which you can share directly with your 200 beta testers!
