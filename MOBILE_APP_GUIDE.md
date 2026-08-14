# Tanryugram Mobile App Guide

Tanryugram provides two separate versions as requested:

1. **Web Version**: Fully responsive web app optimized for desktop and mobile browsers, supporting dark/light mode, real-time messaging, stories, Stripe monetization, and the admin moderation gallery.
2. **Mobile App Version**: Configured for React Native / Expo. You can initialize the mobile build and distribute it via Expo EAS or build native APK / IPA packages.

## How to Get the Mobile App

To bundle Tanryugram as a native mobile app:
1. Initialize an Expo project wrapper in your local environment using the shared tRPC client configuration pointing to your deployed Tanryugram API URL.
2. Run `npx expo prebuild` and `npx expo run:ios` or `npx expo run:android`.
3. Distribute test builds via TestFlight (iOS) or internal APK sharing (Android).
