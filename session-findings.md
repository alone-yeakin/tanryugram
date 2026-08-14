# Tanryugram beta polish — session findings

## Media portability

Stored profile and post rows use the supported `/manus-storage/{key}` proxy path. A public `curl -I -L` check returned a signed CloudFront redirect followed by HTTP 200. The client now normalizes storage keys, keeps storage URLs same-origin, rejects device-local `blob:` URLs, and falls back to deterministic initials SVGs when a remote image fails.

Portable rendering is centralized in `client/src/components/SafeImage.tsx` and is now used for the Home feed and profile/header avatars, stories and story viewers, comments, reactions, one-to-one Messenger photos, Messenger search results, group shared images, moderation thumbnails, and Account Settings. The remaining raw image tags are intentional local upload previews or the shared SafeImage implementation itself.

## Responsive UI

At 375×812, the live preview shows a compact Tanryugram header with a search icon instead of a permanently open input, and profile/post media render visibly. At 1280×720, the desktop header retains the full search field and the feed remains balanced. The mobile search icon opens a full-screen overlay with a focused input and user-search dropdown. Account Settings uses a bounded `100dvh` dialog with an internal scrollable content region and a fixed footer.

## Calls and authorization

Call state/signaling polling is centralized in `client/src/lib/callPolling.ts`: 500 ms inside the active call overlay, 700 ms for global incoming calls with focus refresh, and 2500 ms for call history. The helper includes legal pending-to-terminal and accepted-to-ended transition checks, covered by regression tests. The backend `ownerOnly` middleware uses the shared `server/authorization.ts` helper, which validates the authenticated open ID against `ENV.ownerOpenId`.

## Validation

`pnpm check` passes. `pnpm test` passes with 15 test files and 38 tests, including media portability, call polling/state, and owner authorization regression tests. `pnpm build` passes for both Vite and the server bundle. The dev server restarts cleanly and final mobile and desktop preview screenshots render without TypeScript or build errors.

## Verification limitation

The available interactive browser session is unauthenticated, so I did not claim a two-account authenticated browser proof of cross-account media, call pickup, or owner moderation actions. The internal preview screenshot session did render the authenticated app shell and owner-space navigation; the direct non-owner/owner behavior is covered by backend tests. The remaining TODO item is to perform those authenticated browser checks when a logged-in session is available, then save the next checkpoint.
