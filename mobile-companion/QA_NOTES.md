# Mobile Companion QA Notes

## Preview review

A 390 × 844 responsive preview of the Tanryugram web surface was captured after the bridge changes. The mobile layout keeps the primary header controls visible, presents the Stories rail as a horizontally compact card, and exposes the Calls & ringtone section before the fixed bottom navigation. The call history rows remain readable at the narrow viewport and the “Get the app” action stays available without causing horizontal overflow.

The native-only incoming-call card cannot be rendered by the web preview because it is owned by the Expo wrapper. Its contract was verified through the mobile companion typecheck and `server/mobileCompanion.contract.test.ts`, which assert the answer/decline bridge event names, declined payload, push-token event, and session-expired label. Device-level testing is still required for lock-screen behavior, notification channel sounds, microphone/camera permissions, and Android background execution.

## Known test environment limitation

The full Vitest suite currently contains one pre-existing external integration failure in `server/mailAdapter.test.ts`: the configured `MAIL_API_URL` returned an HTML document, so the test could not parse the expected JSON response. This test is unrelated to the mobile companion changes. The project typecheck, mobile TypeScript check, and focused mobile integration contract test pass.
