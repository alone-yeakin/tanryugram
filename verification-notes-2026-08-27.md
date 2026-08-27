# Release verification notes — 2026-08-27

## Public preview
- URL: https://3000-i0t66hb59l1lsof4yahwp-ef70a800.us4.manus.computer/?from_webdev=1
- Rendered the unauthenticated Tanryugram email/password login screen.
- Visible controls: email, password, Sign In, Forgot password, Create account, Recovery Bot, and onboarding.
- The browser did not show the prior `undefined id`, `referencedTable`, or `Please login` startup error.

## Published domain
- URL: https://tanryugram-njs4tc3o.manus.space/?from_webdev=1
- Rendered the same unauthenticated login screen without a visible runtime error.
- The sandbox browser did not have an authenticated owner session, so an authenticated feed/Creator Studio visual check still requires a user-provided logged-in browser session or credentials.

## API smoke checks
- `marketplace.getSettings` returned HTTP 200 with a valid JSON payload containing marketplace, payment, and platform settings.
- `discovery.feed` initially reproduced HTTP 500 from the generated Drizzle relational query; after replacing it with explicit batched selects, it returned HTTP 200 with a JSON data payload.
- Production database inspection confirmed the user customization columns and marketplace table are present.

## Post-deployment verification
- After the deployment-success notification, the published production RPCs returned HTTP 200 for both `marketplace.getSettings` and `discovery.feed`.
- The published domain initially showed the session-restoration interstitial, then settled on the clean unauthenticated login screen after waiting.
- No authenticated owner session was available in the sandbox browser for the requested Creator Studio/feed visual pass.
