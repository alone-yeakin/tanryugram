# Project TODO: Messenger-Level Upgrade

- [x] Audit current messaging schema, procedures, UI, storage, and authentication limits
- [x] Build Messenger-style inbox with conversation list, online status, Active Now, search, pin, archive/delete, and message requests tab
- [x] Implement typing indicators, delivery/read receipts (single/double gray, double blue, 'Seen' timestamps), and unread badges
- [x] Add offline message queueing with automatic retry on reconnection, sending spinner, and error retry state
- [x] Implement enhanced chat UI with date separators, unread divider line, scroll-to-bottom button, and replied message anchor scrolling
- [x] Build rich group chat with member lists, add/remove members, leave group, @mentions with notifications, admin badges, and colored names
- [x] Add advanced media sharing (gallery/camera images, pre-send preview, multi-image, fullscreen viewer), location map thumbnails, and contact cards
- [x] Implement per-chat settings (mute notifications, custom theme/color, conversation search, shared media drawer)
- [x] Build message forwarding (multi-select, forward to multiple chats with 'Forwarded' label) and chat backup/export (text file export)
- [x] Run two-account verification tests across inbox, calls, typing, and media sharing, then checkpoint
- [x] Replace the current messages surface with a full-screen Messenger chat flow and mobile back navigation
- [x] Add full-screen New Message user search and immediate chat opening
- [x] Restore WebRTC audio and video call controls in the chat header
- [x] Implement outgoing, incoming, active, ended, missed, timeout, and truly global busy call states
- [x] Add call duration, mute, speaker, video, camera flip, and picture-in-picture controls
- [x] Connect call signaling and call history to the existing backend procedures
- [x] Complete typing, receipts, unread/date separators, mentions, media, voice notes, reply, forward, delete, reactions, pinning, mute, and in-chat search interactions
- [x] Verify user1@test.com and user2@test.com chat and audio call flows on desktop and mobile-sized browser views
- [x] Run Vitest and browser checks, repair regressions, and save a final checkpoint
- [x] Wire a real deliveryStatus value into direct-message list data and distinguish sent, delivered, and read states
- [x] Add end-to-end receipt verification and Seen timestamps using the two beta accounts
- [x] Surface mention notifications in Messenger and verify the group @mention flow end to end
- [x] Verify a beta message transitions sent → delivered → read with both account sessions and confirm each UI receipt state
- [x] Implement truly global busy-call protection across all pending and accepted calls
- [x] Add a graceful picture-in-picture control for video calls using the browser PiP API
- [x] Implement delivery/read receipt visuals with sent, delivered, read, and Seen states
- [x] Capture direct-chat sent, delivered, and read receipt visuals from real message data in the browser
- [x] Verify the reachable two-account chat/call states on mobile-sized layout and document the sandbox media-device limitation
- [x] Capture the direct-chat read-state UI showing a blue double-check icon from real message data
- [x] Re-run and document the sent, delivered, and read browser visual states together
- [x] Implement @mention suggestions, mention rendering, and mention notification handling in the final chat/group chat UI
- [x] Add an inbox-visible Create group action alongside New message
- [x] Build a group-creation sheet with group name, searchable people picker, selected-member chips, and minimum-member validation
- [x] Connect group creation to the protected messaging procedure and open the new group chat immediately on success
- [x] Add Vitest coverage and browser-verify group creation with multiple selected beta accounts
- [x] Save a new checkpoint documenting the Messenger group-creation enhancement
- [x] Browser-verify group creation with two selected beta members and confirm every member appears in Group info
- [x] Record multi-member group-creation verification evidence
- [x] Extend groups with photo, description, visibility, messaging mode, and configurable member roles
- [x] Add public group discovery, name search, and public/private join or request-to-join flows
- [x] Add editable Group Info with member search, role management, mute, leave, reporting, and shared-media sections
- [x] Add group-system messages, admin message pinning/deletion, and announcements-only mode
- [x] Add in-chat polls with multiple-choice options, single or multiple votes, vote changes, and closing periods
- [x] Add group event creation, RSVP states, attendee lists, and calendar export data
- [x] Add group media, files, and links indexing with search and grouping views
- [x] Test group discovery, three-member creation, mentions, polls, admin moderation, events, and join lifecycle with beta accounts
- [x] Document the full Groups upgrade and save a delivery checkpoint
- [x] Allow a group creator to launch a public group without selecting an initial invited member
- [x] Repair and verify public-group creator membership visibility and administrator event permissions after beta-account session switching
- [x] Add and verify live RSVP attendee counts and attendee names on each group event card
- [x] Enable every group member to send standard text messages with responsive delivery feedback
- [x] Add secure group photo and video uploads with inline preview, playback, metadata, and shared-media indexing
- [x] Add in-browser group voice-note recording, review, send, and playback with duration display
- [x] Add document and general file attachments with names, type labels, sizes, and download links
- [x] Add explicit link sharing with URL previews and include rich attachments in the group shared-media view
- [x] Test group text, photo, video, voice-note, file, and link sharing between beta accounts
- [x] Render every rich group attachment type correctly inside the message thread rather than treating all attachment URLs as images
- [x] Return a clear forbidden response when a non-member attempts to read protected group media, messages, members, or events
- [x] Align rich-media security copy with the implemented allow-list and member-access protections
- [x] Fix profile Message flow so the selected user is automatically registered in the Messenger inbox and appears as a selectable direct-chat row
- [x] Ensure the selected user's identity is loaded in the direct chat and the first message can be sent from the profile handoff
- [x] Add or update Vitest coverage for the profile-to-Messenger handoff behavior
- [x] Verify the published UI and direct-message flow after the fix
- [x] Browser-verify the published profile-to-Messenger flow with an authenticated session: search a real user, open the profile, tap Message, confirm the chat header and composer, send the first DM, return to inbox, and confirm the seeded conversation row
- [x] Capture explicit verification evidence for the published direct-message handoff after authentication is available
- [x] Reproduce and fix the Evo Rabby profile Message flow so a valid peer, chat header, composer, and send path always load
- [x] Add direct user search inside Messages with the same username/name search behavior as the global search, including a selectable result that opens a chat
- [x] Ensure a selected Messenger search result is registered in the inbox and remains available after returning from chat
- [x] Add regression tests for profile handoff, Messenger search selection, peer identity, and first-message bootstrap
- [x] Verify the repaired flow in the published app with an authenticated session
- [x] Add a component or integration test for MessengerInboxView search selection opening the correct peer chat
- [x] Add a component or integration test for the Home profile Message handoff rendering the selected peer header and composer
- [x] Browser-verify authenticated profile-to-message and Messages-search-to-chat flows, send the first DM, and confirm the seeded inbox row on return
- [x] Add dual blue and black owner-assigned verification badges and user badge application flow
- [x] Restrict creator badges so only the owner can grant them or approve badge applications
- [x] Add owner override controls for displayed follower counts without changing real following relationships
- [x] Test badge approvals, badge rendering, and follower overrides with Vitest and browser checks
- [x] Browser-test the owner portal with an authenticated owner session: approve or reject a badge application, assign blue and black badges, and verify each badge renders on profile and search surfaces
- [x] Browser-test displayed follower-count overrides end to end and confirm following remains the real relationship count
- [x] Add integration coverage for badge application submission plus owner approval updating profile badge state and stats rendering
- [x] Diagnose and fix native email/password login failure reported by the user
- [x] Refactor owner portal user directory into clean responsive cards with properly spaced badge, creator, follower, ban, and role controls
- [x] Add functional Follow/Following button to targeted user profiles connected to follow procedures with live updates
- [x] Fix session persistence on browser refresh so users remain signed in
- [x] Reset selectedUser to null when navigating to My Profile so viewing other profiles does not stick
- [x] Restrict follower-list visibility to the account owner while keeping following lists publicly viewable
- [x] Add per-user toggle settings for follower and following list visibility
- [x] Optimize call signaling poll interval and WebRTC connection latency for faster call pickup and media delivery
- [x] Ensure profile photos and avatar URLs resolve reliably across different user accounts without breaking
- [x] Fix searched-profile identity handoff so the top-right header avatar stays the signed-in user while selected profiles show their own data
- [x] Add mobile search bar in header for phone and tablet users
- [x] Browser-test the new mobile header search at phone and tablet widths and fix any overflow/clipping so search is fully usable on mobile
- [x] Remove or owner-gate all remaining Creator Studio entry points so non-owner accounts cannot see or open that surface
- [x] Enforce strict owner-only check for Creator Studio so non-owner accounts cannot see or open it
- [x] Fix cross-account profile and post image rendering so photos appear correctly on all devices
- [x] Redesign mobile search as an Instagram-style expandable icon that opens a clean search overlay
- [x] Make Account Settings fully scrollable and responsive on mobile screens

- [x] Session follow-up: normalize and harden cross-device profile and post media rendering with portable fallbacks
- [x] Session follow-up: replace cramped mobile header search with an expandable search overlay
- [x] Session follow-up: add bounded scrolling and responsive spacing to Account Settings
- [x] Session follow-up: reduce call signaling polling latency without breaking call state transitions
- [x] Session follow-up: re-verify owner-only Creator Studio controls and regression tests

- [x] Session follow-up: run TypeScript, Vitest, and responsive visual verification; save a live checkpoint

- [x] Follow-up gap: apply shared portable media handling to Messenger, stories, comments, reactions, and group surfaces
- [x] Follow-up gap: add explicit owner-only Creator Studio regression coverage for owner and non-owner identities
- [x] Follow-up gap: add call-state transition regression coverage after signaling poll changes
- [x] Follow-up gap: authenticate and browser-verify cross-account media, mobile search overlay, Account Settings scrolling, and call pickup
- [x] Follow-up gap: save a new checkpoint after the expanded verification work

- [x] New beta fix: audit and harden photo upload paths, size/type validation, and cross-device media persistence
- [x] New beta fix: add owner-controlled photo/video upload switches with photos enabled for everyone and video disabled by default
- [x] New beta fix: expose the upload policy in the owner portal without granting non-owners moderation access
- [x] New beta fix: repair follow, follow-back, comment, like, and notification generation/display flows
- [x] New beta fix: add regression tests and verify photo uploads plus notifications across accounts/devices
- [x] New beta fix: save a checkpoint after validation

- [x] Database media audit: inspect storage proxy helpers, postMedia table rows, and user avatarUrl records
- [x] Database media repair: ensure stored storage paths resolve correctly via S3 presigned URLs or public storage proxy endpoints across accounts
- [x] Profile and post media rendering fix: inspect fallback logic so profile pictures and post media never render blank placeholders or raw initials when storage URLs exist
- [x] Cross-account validation and source code packaging: test media rendering with multiple user sessions and package the complete repository archive for user download

- [x] APK diagnosis: inspect attached tanryugram-debug.apk and mobile-companion configuration
- [x] Mobile companion fix: ensure Expo app correctly connects to the live production server, uses safe image fallbacks, and supports photo uploads without crashing
- [x] Build and test: verify mobile app build, run type-check and Vitest suites, and save a final checkpoint

- [x] Recovery gap: reapply additive follower stats, foreground/notification call delivery, push-token storage, ringtone bridge, and documentation on the current shared checkout after uncheckpointed changes were replaced by the last saved source

## Current source migration record

- [x] Copy the current TanRyuGram source archive into the active full-stack project
- [x] Preserve the requested TanryugramAdvancedFeatures, TanryugramBetaPolish, TanryugramMessengerAdvanced, and TanryugramPanels component files
- [x] Preserve migrated App.tsx navigation and source route structure
- [x] Preserve the complete source Drizzle schema and historical migration SQL files
- [x] Apply the source schema to the active database, including social, messaging, groups, privacy, badges, media policy, and verification tables
- [x] Preserve migrated server routers and business logic for signup, login, authorization, social actions, messaging, groups, privacy, notifications, badges, and owner controls
- [x] Remove the suspended email from code and documentation; ownership now uses ENV.ownerOpenId or the authenticated admin role
- [x] Run typecheck, production build, and the 17-file/44-test Vitest suite successfully
- [x] Capture an unauthenticated desktop preview of the migrated app shell
- [x] Complete authenticated owner browser verification for Creator Studio, badge controls, and current-account routing; cross-account messaging/media/call verification remains outside this owner-access repair because a second logged-in test account is unavailable

## Current owner-access repair

- [x] Audit all remaining suspended-email references and owner identity checks in authentication, verification-code, Creator Studio, and badge controls
- [x] Ensure current Manus session owner identity is the sole owner authorization source via ENV.ownerOpenId
- [x] Repair current owner account reconciliation so the current email can access Creator Studio without fabricating lost historical data
- [x] Fix signup/login verification-code behavior so the suspended email is never required for owner access
- [x] Add regression tests for current owner authorization, Creator Studio visibility, and badge controls
- [x] Verify the repaired owner flow and save an updated checkpoint

## Authentication and owner-routing repair

- [x] Audit the actual authenticated user response and verify that owner status reaches the client after login
- [x] Fix current-account routing so Creator Studio is visible after authentication
- [x] Require and persist native password setup for email accounts instead of silently accepting missing passwords
- [x] Make beta verification-code requirements explicit for signup and password reset, with clear code-entry states; production Gmail delivery still requires an email provider configuration
- [x] Ensure password-reset completion writes the new password hash for subsequent login
- [x] Add regression tests for owner routing, password requirements, and verification-code validity; password-reset persistence uses the same validated code path
- [x] Run visual and automated verification and save an updated checkpoint

## Current owner password registration

- [x] Set a native password for the current owner account without storing the plaintext password in source or logs
- [x] Verify the current owner record has a password hash and remains admin/owner-authorized
- [x] Save a checkpoint documenting the password registration without exposing the secret

## Public authentication panel update

- [x] Audit the public login panel for Manus and Google entry points
- [x] Remove the public Manus login option while preserving native TanRyuGram email/password account creation and login
- [x] Preserve any existing Google login option only if it is already part of the original public auth flow; no public Google option existed in the supplied panel
- [x] Verify signup, password login, verification-code, and reset UI states
- [x] Save an updated checkpoint for the public authentication change

## Verification-code insert error repair

- [x] Audit the live emailVerificationCodes schema and database error cause
- [x] Repair signup and password-reset verification-code persistence for repeated requests
- [x] Replace raw SQL mutation errors with actionable user-facing verification messages
- [x] Add regression coverage for repeated code requests and invalid/expired codes
- [x] Run tests/build and save an updated checkpoint

## Secure password-reset email delivery

- [x] Remove password-reset codes from website responses, client messages, and server logs
- [x] Add secure email-provider delivery for reset codes to the requested Gmail address
- [x] Request and store provider credentials only through project secrets, never source code
- [x] Add regression coverage proving reset responses do not contain the code
- [x] Run tests/build and save an updated security checkpoint

## Owner-only Gmail API OAuth delivery

- [x] Keep Gmail OAuth controls, sender identity, tokens, and provider configuration owner-only
- [x] Remove reset codes from API responses and all server logs
- [x] Send signup and password-reset codes through the owner-only Apps Script Gmail mailer from the configured mailbox
- [x] Add secure OAuth secret handling and an owner-only authorization/configuration path
- [x] Add regression tests proving the Apps Script secret is accepted without sending and reset responses contain no code
- [x] Verify delivery behavior and save an updated checkpoint

## Apps Script Gmail mailer connection

- [x] Store the deployed Apps Script mailer URL as a server-only configuration value
- [x] Request and store the Apps Script MAIL_API_SECRET securely
- [x] Replace the Gmail API OAuth stub with the Apps Script delivery adapter
- [x] Add regression coverage proving reset responses do not expose codes
- [x] Validate the private mailer endpoint authentication without sending an unsolicited email and save an updated checkpoint

## Apps Script email-template correction

- [x] Update the Apps Script mail template to include the generated verification code in the email body
- [x] Redeploy the Apps Script and verify the new deployment is used by TanRyuGram
- [x] Confirm codes remain absent from the website response and server logs
- [x] Save an updated checkpoint

## Branded verification email design

- [x] Create a polished TanRyuGram HTML email template with a clear verification-code card
- [x] Add responsive styling, expiry messaging, and security guidance for recipients
- [x] Preserve plain-text fallback and keep codes out of website responses/logs
- [x] Redeploy the owner-controlled Apps Script template and record the update

## Branded Apps Script deployment update

- [x] Replace the server-only mailer URL with the newly redeployed branded Apps Script URL
- [x] Validate the new deployment with the existing private MAIL_API_SECRET
- [x] Save a checkpoint for the branded email deployment update

## APK delivery request

- [x] Search the project, upload area, and supplied archives for an existing TanRyuGram APK artifact; none was found
- [x] Verify that no APK file is available for delivery; the available mobile artifact is Expo/EAS source only
- [x] Explain that a new Expo/EAS Android APK build is required

## Focused Android APK build

- [x] Audit the supplied Expo mobile source and production server URL
- [x] Configure the mobile app to connect to the live TanRyuGram server
- [x] Improve the mobile app launch and error states without changing the server contract
- [x] Attempt local Android APK build; the environment lacks a stable Android toolchain and Gradle was terminated under memory pressure
- [x] Report the unavoidable APK build blocker; no APK artifact was available and local Gradle build could not complete

## Website signup verification delivery repair

- [x] Audit the signup verification mutation and current Apps Script deployment payload
- [x] Ensure signup verification codes are emailed reliably and are included in the email body; user confirmed delivery, including Spam-folder placement
- [x] Keep signup responses and server logs free of verification-code values
- [x] Add regression coverage for signup delivery and code redaction
- [x] Run validation and save an updated checkpoint

## Cross-account media visibility repair

- [x] Audit profile avatar, AI-generated profile image, and post-media storage records and URL resolvers
- [x] Fix media access and URL normalization for non-owner accounts such as aayanafilmz@gmail.com
- [x] Preserve creator-owner media access and existing upload behavior
- [x] Add regression coverage for owner and non-owner media resolution
- [x] Run visual and automated verification and save an updated checkpoint

## Exact creator feed-media failure

- [x] Trace the screenshot’s creator post through feed data and postMedia records
- [x] Verify the stored media URL and public storage-proxy response for the exact post
- [x] Repair feed media URL resolution or persistence so non-owner viewers see the real photo by hardening SafeImage against stale fallback races
- [x] Add a regression test for the creator post media path
- [x] Verify the non-owner feed and save an updated checkpoint

## Owner versus non-owner media contradiction

- [x] Compare owner and non-owner feed payloads for the same creator post
- [x] Compare browser image-request behavior and storage responses between both sessions
- [x] Repair the account-specific difference causing the non-owner AI fallback tile by remounting feed cards when the viewer account changes
- [x] Verify both sessions render the same creator image and save a checkpoint

## Remove visible storage configuration card

- [x] Locate the Google Cloud Storage owner-config card in the public UI
- [x] Remove the card without changing backend storage or upload behavior
- [x] Run validation and save an updated checkpoint

## Home and Explore mobile polish

- [x] Replace the Home “The daily pulse” headline with stronger TanRyuGram copy
- [x] Fix the Explore navigation button and active-view behavior
- [x] Make Explore render as a mobile-native responsive surface instead of a desktop webview-like layout
- [x] Run desktop/mobile visual verification and save an updated checkpoint

## Android APK and background-call delivery

- [x] Audit the existing Expo mobile source, Android configuration, call signaling, and notification support
- [x] Implement reliable incoming-call alerts for web users outside the active call screen
- [x] Implement mobile background/foreground incoming-call notification handling with a call entry action
- [x] Attempt the standard Android Studio/Gradle APK build; the generated project reaches native compilation but the sandbox Gradle daemon is terminated before producing an APK
- [x] Validate call-alert behavior and document any platform or build limitations
- [x] Save a verified checkpoint and document that no APK artifact is available from this sandbox build; the generated Android Studio project is ready for local assembly

## Android Studio / Gradle route clarification

- [x] Replace the EAS-based mobile build plan with a standard Android Studio/Gradle APK build
- [x] Audit and adapt the native Android project for background call notifications without EAS
- [x] Document required Firebase or other native push credentials before closed-app call delivery

## Final call UX, Firebase, and APK download

- [x] Add custom ringtone selection and stronger incoming-call visual feedback
- [x] Add a visual missed/received call history section on Home
- [x] Add a website section that directly downloads the final APK
- [x] Configure Firebase Android client support as far as available and document account-dependent steps
- [x] Rebuild, validate, and deliver the final APK/source package

## Profile navigation and social controls repair

- [x] Make names and photos open the correct selected profile
- [x] Repair the Follow/Following button state and mutation flow
- [x] Restore follower and following counts/lists for the selected profile
- [x] Add regression coverage and publish the verified fix

## Regression repair: owner portal, media, and profiles

- [x] Restore Creator Studio visibility and owner portal access for the current owner
- [x] Restore same-origin media proxy normalization for avatars and post photos
- [x] Repair selected-profile navigation and Follow/follower controls without removing existing panels
- [x] Add regression coverage, verify the owner surface, and publish the repair

## Creator Studio web redesign

- [x] Restore owner Creator Studio access without removing badge and moderation tools
- [x] Redesign Creator Studio into a clean responsive web dashboard
- [x] Preserve cross-account media and selected-profile/social fixes while redesigning the studio
- [x] Add visual/regression verification and publish the repaired owner experience

## Production and universal APK regression repair

- [x] Verify Creator Studio owner visibility on the deployed website, not only preview
- [x] Restore cross-account photo/avatar delivery on production
- [x] Ensure the Home incoming-call surface refreshes and presents calls consistently
- [x] Build a universal APK containing arm64-v8a, armeabi-v7a, and x86_64 where supported
- [x] Run production/live-route regression checks and publish the repair

## Profile badge rendering regression

- [x] Preserve badgeType, badgeLabel, creator, and verification fields through profile queries
- [x] Render custom badge levels consistently on profile, post, and message identity surfaces
- [x] Add badge regression coverage and include it in the final publish validation

- [x] Final delivery: render persisted custom badge labels/types on feed author surfaces
- [x] Final delivery: point Get the app to the signed universal-compatible Android debug APK
- [x] Final delivery: validate universal APK ABI contents, tests, production build, archive, and checkpoint

## Reported production regression: media, calls, and Creator Studio

- [x] Review the attached recording and reproduce the cross-account photo failure on production
- [x] Trace and repair live media-proxy authorization, cache, and URL normalization failures
- [x] Restore Creator Studio visibility for the authenticated owner on the published domain
- [x] Trace incoming-call handoff and notification behavior when the Android app is backgrounded or closed
- [x] Add regression coverage, validate owner/non-owner authorization and public media access, then publish the repaired release

## Production media/API regression: non-owner visibility

- [x] Reproduce the live non-owner failure for post photos and profile avatars
- [x] Verify media proxy status, redirects, content types, and storage-key permissions on production
- [x] Trace feed, profile, Messenger, and post-media API payloads for owner/non-owner differences
- [x] Repair server-side media access and API error handling so stored photos are public to authorized signed-in users
- [x] Repair the website Get the app download route and validate the hosted APK asset
- [x] Add regression coverage, test owner/non-owner production paths, and publish the repair
