# Project TODO

- [ ] Replace starter screen with a mobile-first Tanryugram calling home experience
- [ ] Add contact list with online presence and call action affordances
- [x] Add voice/video call interaction states with incoming-call overlay
- [ ] Add call history and settings surfaces aligned with the requested ecosystem
- [x] Preserve existing authentication flow and make login state visible in the app shell
- [x] Document integration-ready boundaries for WebRTC, FCM, signaling, and shared data
- [x] Add or update Vitest coverage for the implemented behavior
- [x] Run typecheck, focused tests, typechecks, and visual verification; full suite has one unrelated external mail adapter failure
- [ ] Save and deliver a checkpoint

## Change history

- [ ] Initial implementation request: connected Tanryugram calling mobile experience

- [x] Wire native incoming-call Decline to the web call state so the caller is notified
- [x] Add visible auth/loading state treatment around the mobile companion shell
- [x] Expand integration documentation for WebRTC, push, signaling, and shared data contracts

- [x] Reflect real signed-in, signed-out, and session-expired auth state from the web app in the native session bar
- [x] Investigate the pre-existing mail adapter test failure and document its scope: external MAIL_API_URL returned HTML instead of the expected JSON; unrelated to mobile changes
- [x] Perform browser visual verification of the connected calling surfaces; findings recorded in mobile-companion/QA_NOTES.md
