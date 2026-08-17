# Project TODO

- [x] Replace starter screen with a mobile-first Tanryugram calling home experience; existing Home already provides the responsive calling-focused shell
- [x] Add contact list with online presence and call action affordances; added responsive Contacts card with status dots and audio/video entry points
- [x] Add voice/video call interaction states with incoming-call overlay
- [x] Add call history and settings surfaces aligned with the requested ecosystem; existing Calls & ringtone section is shared with the mobile wrapper
- [x] Preserve existing authentication flow and make login state visible in the app shell
- [x] Document integration-ready boundaries for WebRTC, FCM, signaling, and shared data
- [x] Add or update Vitest coverage for the implemented behavior
- [x] Run typecheck, focused tests, typechecks, and visual verification; full suite has one unrelated external mail adapter failure
- [x] Save and deliver a checkpoint

## Change history

- [x] Initial implementation request: connected Tanryugram mobile calling experience delivered with integration-ready WebRTC/push bridge; native Telecom/foreground-service hardening remains device-level follow-up

- [x] Wire native incoming-call Decline to the web call state so the caller is notified
- [x] Add visible auth/loading state treatment around the mobile companion shell
- [x] Expand integration documentation for WebRTC, push, signaling, and shared data contracts

- [x] Reflect real signed-in, signed-out, and session-expired auth state from the web app in the native session bar
- [x] Investigate the pre-existing mail adapter test failure and document its scope: external MAIL_API_URL returned HTML instead of the expected JSON; unrelated to mobile changes
- [x] Perform browser visual verification of the connected calling surfaces; findings recorded in mobile-companion/QA_NOTES.md
