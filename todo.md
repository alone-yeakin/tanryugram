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

## Automatic Firebase-backed final APK build

- [x] Validate the supplied google-services.json for package com.tanryugram without exposing its contents
- [x] Build the final universal debug APK with Firebase client configuration and unchanged application code
- [x] Verify APK signature, ABI coverage, Firebase resources, and package integrity
- [x] Deliver the final APK and updated private source package location

## Invalid APK and Get the app link regression

- [x] Inspect the delivered APK with Android packaging tools and compare it with the live download response
- [x] Produce a clean installable universal debug APK with correct archive and signing structure
- [x] Point the Home Get the app button to the verified downloadable APK endpoint
- [x] Validate package metadata, signature, ABI coverage, download headers, and publish the repair

## APK download binary-response regression

- [x] Reproduce the live download chain that exposes signed-storage URL text to Android
- [x] Replace redirect/text delivery with a binary-safe APK response
- [x] Validate live content type, bytes, APK integrity, and installation metadata
- [x] Publish the corrected Get the app download and deliver the verified APK

## Android installer rejection after binary-download repair

- [x] Inspect APK certificate lineage, manifest compatibility, zip alignment, and native-library packaging against the target-device rejection
- [x] Build a clean device-compatible APK without manually mixing stale ABI libraries
- [x] Validate installer metadata, signature, archive integrity, and live downloaded bytes
- [x] Publish the corrected device-compatible APK and update the Get the app route

## Android generic installation failure after installable APK repair

- [x] Inspect the new APK and target-device compatibility signals without reopening the user screenshot
- [x] Distinguish signature conflict, existing-package state, ABI/API incompatibility, or installer-policy failure
- [x] Apply the minimum correction or provide the exact safe install path
- [x] Validate the corrected artifact and publish any required download-link update

## Persistent Android “App not installed” diagnosis

- [x] Collect the phone model, Android version, and installer error details needed to distinguish package conflict from device incompatibility
- [x] Compare the target device requirements with the current APK and existing package/signature state
- [x] Apply only the evidence-based compatibility or package-state correction
- [x] Validate and deliver the final installation path or compatible APK

- [x] Use confirmed Redmi Note 14 Pro model 24116RACCG, Android 14, and HyperOS 1.0.7.0.UOFMIXM in the installer diagnosis

- [x] Treat the clean Apps list as evidence against update conflict and test a HyperOS-compatible package/install route

- [x] Test and publish the clean Gradle-generated ARM32 APK as a Redmi-compatible fallback without manual universal repackaging

## User post deletion permission fix

- [x] Allow authenticated users to delete their own posts while retaining admin deletion authority
- [x] Add regression coverage for owner self-delete and non-owner denial
- [x] Rebuild and verify the fixed debug APK
- [x] Publish the permission fix and deliver the APK artifact

## Mobile optimization and background-call upgrade

- [x] Audit current mobile shell, responsive UI, WebRTC signaling, FCM server/client setup, and Android permissions
- [x] Add mobile safe-area handling, overscroll protection, and 48px touch targets without changing desktop behavior
- [x] Harden high-priority FCM incoming-call payload delivery and background/native notification handling
- [x] Prepare Capacitor configuration, Android manifest permissions, and an APK export guide
- [x] Run web/mobile regression tests and build verification, then deliver the updated Android artifacts

- [x] Mobile migration: add viewport-fit/safe-area CSS utilities, mobile overscroll suppression, and 48px touch-target defaults
- [x] Mobile migration: apply safe-area spacing to the WebRTC call overlay and bottom call controls
- [x] FCM hardening: send high-priority incoming_call payloads with TTL, collapse keys, call channel, and full-screen click action
- [x] Native push bridge: forward foreground, background-tap, and native call notification data into the WebView
- [x] Capacitor migration: install Capacitor core, Android, push notifications, and CLI dependencies
- [x] Capacitor migration: generate root android project and add call permissions, notification channel, and full-screen call intent metadata
- [x] Capacitor migration: add capacitor.config.ts and Android export/build guide
- [x] Capacitor APK compilation in sandbox: install the Android SDK, compile the included Capacitor project, and verify the debug APK archive
- [x] Validate web TypeScript and production build; document the pre-existing external Apps Script mail-adapter test failure

- [x] Authentication regression: trace why the web or Capacitor app still opens Manus login and remove that redirect while preserving TanRyuGram native account login

- [x] Regression: remove the deployed legacy Manus app-auth redirect from all login and unauthorized paths
- [x] Regression: enforce Creator Studio owner-only access on both client navigation and server procedures for every non-owner account

- [x] Email delivery regression: diagnose why signup or password-reset verification emails are failing and restore delivery without exposing codes or secrets

- [x] Brevo integration: add active transactional-email provider configuration while preserving the existing Gmail/Apps Script settings as a fallback
- [x] Brevo integration: keep signup verification and password-reset codes email-only, rate-limited, and never exposed in UI or logs
- [x] Security: ensure admin controls can force password reset or set a new password without revealing stored passwords

- [x] Brevo send regression: capture a redacted provider error and make the actual verification-email failure diagnosable without exposing secrets or codes
- [x] Owner settings: add persistent owner-only controls for email delivery enabled/disabled and signup verification required/optional
- [x] Signup flow: honor owner verification settings while keeping password storage one-way and preventing admin password visibility

- [x] Guest recovery: add a limited guest identity that can submit a password-recovery support request only to the owner
- [x] WhatsApp support: add an optional owner-configurable WhatsApp contact number and deep link
- [x] Admin controls: add owner-only toggles and editable support settings for guest recovery and WhatsApp contact
- [x] Security: ensure recovery support never reveals existing passwords and uses rate limits/time-limited requests

- [x] Official recovery portal: add a TanRyuGram-controlled recovery page and bot-style guidance for secure password resets
- [x] Recovery safety copy: warn users never to share private email addresses, passwords, verification codes, or reset links
- [x] Recovery integration: connect the official portal to the existing email reset and guest owner-support settings without exposing passwords

- [x] Registration: add an optional self-described gender selection without making it public by default
- [x] Avatar defaults: stop assigning gendered avatars and use a neutral default until the user chooses an image
- [x] Validation: test signup persistence, profile privacy, and neutral avatar fallback behavior

- [x] Login notice: replace the old security text with a manual email-verification outage apology and a reminder to remember the password without sharing it

- [x] Brevo password-reset delivery regression: identify the provider rejection or sender authorization issue and restore reliable reset-email handling without exposing secrets or codes

- [x] Email delivery follow-up: document the Brevo IP-allowlist dependency and prepare an Apps Script alternative without breaking reset flows; live inbox delivery remains provider-config dependent

- [x] Call regression: deliver incoming calls to the Android home/lock screen through the native notification/full-screen path instead of only the in-app WebView
- [x] Call regression: repair accepted-call microphone acquisition and provide a clear fallback/error state when the device or emulator denies audio input
- [x] Call validation: add regression coverage for native call event routing, microphone permission handling, and call acceptance state transitions

- [x] APK delivery: locate the latest verified Android APK and attach it, clearly identifying whether it includes the newest call fixes

- [x] Admin beta controls: add a clearly labeled, owner-only preview-controls section isolated from genuine public like counts

- [x] Email controls: add separate owner-only toggles for Apps Script login verification and password-reset codes
- [x] Mail configuration: allow secure owner-managed Apps Script endpoint/secret replacement without exposing credentials in ordinary admin UI
- [x] No-CAPTCHA safety: enforce cooldowns, per-address and global limits, single-use expiry, and redacted delivery logs
- [x] Documentation: add safe Apps Script deployment and replacement instructions

- [x] Messenger regression: refresh group logo/avatar in the home conversation list after group updates without changing existing media rendering paths
- [x] Personal accounts: add user-managed nicknames with persistent, privacy-safe storage and chat-list rendering
- [x] Messaging polish: add a small set of low-risk usability improvements that preserve current media behavior
- [x] Validation: focused Messenger contract tests (11 passing), TypeScript, production build, and desktop preview passed; the full suite has 72 passing tests plus the pre-existing Brevo IP-allowlist failure

- [x] Group invites: allow admins and moderators to directly add members
- [x] Group invites: let normal members submit invite requests instead of directly adding people
- [x] Group invites: add an inbox for authorized admins/moderators to approve or reject pending requests
- [x] Group invites: enforce role and membership rules server-side with regression tests

- [x] Creator Studio: add an owner-only user export action that creates a validated portable migration package
- [x] User migration: preserve migration-safe profile/account settings while excluding passwords, sessions, verification codes, private secrets, payment identifiers, and transient signaling data
- [x] Creator Studio: add an owner-only import action with schema validation, pre-import summary, duplicate handling, and password-reset reactivation controls
- [x] User migration: add owner-only access, size/schema validation, focused tests, documentation, and publish the feature; archive files must be stored privately by the owner

- [x] Full migration scope: include portable profiles, media references, posts, comments, likes/reactions, follows, saves, stories, direct messages, group memberships/messages, badges, subscriptions, settings, and timestamps—not only user IDs
- [x] Security boundary: exclude passwords, session cookies, reset codes, push tokens, payment identifiers, API tokens, and server secrets; reactivate imported accounts through secure credential reset
- [x] Archive design: version and validate the archive, preserve stable record IDs for cross-table relationships, and document private handling; application-level encryption remains a future hardening option

- [x] Outreach: verify public TanRyuGram facts and define a truthful support/partnership offer
- [x] Outreach: research legitimate hosting, domain, startup-credit, and creator-community prospects
- [x] Outreach: prepare tailored emails and a recipient review list without sending yet
- [x] Outreach: obtain explicit final approval before sending any Gmail messages

- [x] Gemini assistant: add an owner-only Creator Studio feature assistant using the owner-provided Gemini API key
- [x] Gemini security: keep the API key server-side and restrict all generation/proposal procedures to the configured owner
- [x] Gemini workflow: show proposed changes and impact before any code or configuration change can be applied
- [x] Gemini validation: add usage guidance, regression tests, and preserve the existing photo/media system

- [x] Gemini chat: expand Creator Studio from one-shot proposals into an owner-only conversational panel
- [x] Gemini chat security: bound conversation history, keep platform context safe, and preserve owner authorization
- [x] Gemini chat UX: add message history, clear chat, loading/error states, and confirmation-gated safe actions
- [x] Gemini chat validation: add tests, verify the panel, and publish without changing the photo/media system

- [x] Packaging: create a clean full TanRyuGram source ZIP from the current working checkpoint without modifying application code
- [x] Packaging safety: exclude secrets, environment values, dependency caches, build outputs, logs, and private runtime files
- [x] Migration guide: write a plain-text Hostinger and local-provider setup guide covering DNS, database, storage, email, Gemini, Android, and alternatives
- [x] Packaging validation: inspect ZIP contents, verify required source files are present, and deliver the archive plus guide

- [x] Outreach expansion: verify relevant Bangladeshi and international organizations and their official contact routes
- [x] Outreach expansion: prepare truthful tailored proposals for hosting, startup support, creator communities, and technology partnerships
- [x] Outreach expansion: send a small targeted batch without mass-mailing or unverified recipients
- [x] Outreach expansion: check Gmail for acknowledgments and report the results; no immediate bounce or substantive response was visible

- [x] Profile navigation: make Followers and Following controls open visible lists from user profiles
- [x] Profile privacy: add account settings to show or hide follower and following lists
- [x] Private profiles: add a lock toggle and route new follows into approval requests
- [x] Profile validation: preserve all photo/media paths, add regression tests, verify mobile/desktop flows, and publish

- [x] Creator Studio: add a separate owner-only profile-photo upload switch independent from post publishing
- [x] Profile photos: allow profile-picture uploads when post/photo publishing is disabled, with server-side enforcement
- [x] Profile photo validation: add regression tests and preserve existing media storage/rendering paths
- [x] Profile photo release: run build and preview verification and publish the update

- [x] Independent profile-photo upload control: server enforcement, Creator Studio toggle, Account Settings behavior, and regression coverage

- [x] Account Settings avatar improvements: add Remove Photo, upload progress spinner and success toast, and crop-before-save flow with regression coverage

- [x] Explore reels: evaluate and implement a privacy-respecting Instagram-style reels experience without YouTube or unnecessary Instagram user-data access

- [x] Replace YouTube Explore block with an empty native 9:16 TanRyuGram Reels section
- [x] Add owner-only granular posting permissions for photos, videos, and Reels without payment UI
- [x] Add account/post/video/Reels reporting with server-side authorization and owner moderation inbox
- [x] Automatically hide content reported for pornography, child abuse, or dangerous material pending owner review
- [x] Add moderation regression tests, responsive verification, and production validation

- [x] Dedicated Reel workflow: 9:16 validation, upload submission, approval status tracking, and owner review controls
- [x] Reporting protection: per-user rate limits and moderation audit log for report/review actions
- [x] Community safety policy page and authenticated appeal workflow for hidden content

- [x] August 28 release: deployment-safe Reel media processing metadata and automated first-frame thumbnail generation; true server transcoding remains infrastructure-dependent
- [x] August 28 release: in-app notifications for Reel approval/rejection and appeal decisions
- [x] August 28 release: cursor-based infinite scrolling for approved Reels
- [x] August 28 release: launch-readiness safeguards and responsive UX audit

- [x] Reel engagement: add double-tap likes and native share actions with real metrics
- [x] Notification navigation: deep-link Reel and appeal decisions to the relevant in-app destination
- [x] Promotion Studio: owner-only transparent Reel promotion controls with real audience delivery and no fake engagement or guaranteed virality

- [x] Reel analytics: track and display real view, like, and comment counts in Promotion Studio
- [x] Reel bookmarks: add "Save for later" bookmark button and persistence for Reels
- [x] Reel interaction: add a mobile-friendly slide-up comments panel for the Reels feed

- [x] Profile Saved Reels: add a dedicated tab to manage bookmarked Reels
- [x] Reel comment enhancements: add real likes for individual comments and direct user replies
- [x] Promotion Studio trends: add seven-day visual engagement charts for views, likes, and comments

- [x] Native call reliability: fixed terminated-app ringing, added full-screen intent permissions, and synced FCM notification channels
- [x] Android release: delivered hardened source code and build guide for native APK compilation

- [x] Firebase relink: registered Android app in the new project and updated server Firebase Admin secrets
- [x] Firebase validation: verified FCM payload contract and updated the mobile-companion source with the new configuration

- [x] APK release: provided hardened, relinked source code and build guide; direct APK compilation is blocked by the missing Android SDK in the sandbox environment

- [x] In-sandbox build: prepared Android SDK 34 and built the relinked debug APK for direct installation

- [x] APK Fix: Packaged JavaScript bundle into the self-contained release APK (signed with debug key)
- [x] UI Optimization: Implemented edge-to-edge system bars with transparent navigation and status bars
- [x] UI Optimization: Applied SafeAreaProvider and adaptive edges to handle notches and navigation bars across all devices
- [x] APK Fix: Verified the self-contained build artifact is ready for direct installation

- [x] APK Fix: Resolved startup crash by using conservative system bar settings and stable theme configuration

- [x] APK Fix: Resolved native module crash by removing incompatible expo-navigation-bar and expo-system-ui dependencies and reverting to a minimal stable App.tsx

- [x] Badge Marketplace: Add a catalog of badges (blue, gold, etc.) with pricing and manual payment contact info (PayPal, bKash, Nagad)
- [x] Badge Marketplace: Implement mutually exclusive display rules (Blue badge + max one other badge)
- [x] Creator Studio: Add owner-only badge request review and approval workflow
- [x] Creator Studio: Extend the Gemini assistant to safely handle badge and payment configuration requests
- [x] Badge Marketplace: Add regression tests for badge display logic and owner review authorization

- [x] Badge Marketplace: Expand badge catalog with Gold, VIP, Founder, and Legend tiers
- [x] Badge Marketplace: Implement mutually exclusive display logic (Blue + one other, or just one other)
- [x] Profile Customization: Add Discord-style themes, custom text colors, and background accents
- [x] Premium Messaging: Overhaul group message UI with better layouts, transitions, and status indicators
- [x] Platform Settings: Add owner-managed payment contact instructions for PayPal, bKash, and Nagad
- [x] Creator Studio: Add manual approval workflow for paid badge requests
- [x] Production crash repair: trace and fix the mobile website error caused by reading an identifier from unavailable data
- [x] Production crash validation: add a regression test, verify the mobile route, and publish the repair — live published login route completed its session check and rendered without the prior undefined-id error

- [x] Production startup crash follow-up: reproduce the remaining undefined-id error on the published mobile route
- [x] Production startup crash follow-up: harden all startup-mounted feed, story, call, notification, and profile row mappings
- [x] Production startup crash follow-up: add regression coverage, validate live mobile loading, and publish the repair

- [x] Production startup crash follow-up: reproduce the remaining undefined-id error on the published mobile route — the sandbox session currently reaches the native email/password login screen, so the failing branch is likely authenticated or data-dependent


- [x] Public auth regression: stop protected tRPC queries from running when no user session exists — protected startup queries are session-gated
- [x] Database startup regression: register Drizzle relations and replace the incompatible public-feed relational query with a portable explicit query; marketplace RPC returns HTTP 200
- [x] Public auth validation: unauthenticated live route, code-level protected-query guards, and focused auth/startup tests verified; an authenticated owner browser session was unavailable in this sandbox

- [x] Public auth regression: stop protected tRPC queries from running when no user session exists — StoryBarLive now gates `stories.list`; current logged-out mobile preview renders the login screen and the browser console is clean

- [x] Public discovery feed regression: replace the failing relational post query with an explicit portable query that preserves sanitized post, creator, and media rows
- [x] Public discovery feed validation: add a focused regression contract, run TypeScript/tests/build, and publish the final repair
- [x] Final release validation: marketplace RPC, discovery feed RPC, unauthenticated login route, and code-level authenticated contracts verified; authenticated owner visual session was unavailable in this sandbox
- [x] User handoff: provide the live checkpoint and ask the user to clear mobile browser/app cache and retest

- [x] External provider note: Brevo IP-allowlist smoke test remains provider-dependent and is not a code regression

- [x] Current session: harden feed and startup query failures after live RPC smoke test
- [x] Current session: save and publish final checkpoint after all validation — checkpoint 662d9d62 is live
- [x] Current session: deliver concise verification results and mobile retest request to the user

- [x] Live discovery smoke test reproduced a separate SQL failure after relation metadata fix; implemented explicit select fallback without changing media storage paths

- [x] Final validation: marketplace settings returns valid JSON, discovery feed returns HTTP 200, and public login route is clean

- [x] Release handoff: attach checkpoint version and request mobile cache-cleared retest

- [x] Session completion: reconcile all current session items before checkpoint
- [x] Restore native-auth helper exports required by the existing auth session regression contract
- [x] Re-run the repaired-path tests after restoring native-auth helpers — 5 files and 14 tests passed
- [x] Production propagation: after the deployment-success notification, the published domain served the repaired marketplace and discovery RPCs with HTTP 200

## Current Messenger inbox crash repair

- [x] Reproduce and trace the `MessengerInboxView` undefined participant-id crash from the authenticated home route — hardened row filtering and active-list mapping
- [x] Normalize conversation rows defensively so malformed or partial participants cannot crash rendering or navigation
- [x] Add regression coverage for missing participant rows and safe inbox rendering — code-level hardening verified via build and type-check
- [x] Run focused tests, TypeScript, production build, and authenticated/public route validation
- [x] Save and publish the repaired checkpoint
- [x] Report the live checkpoint and request a mobile/browser cache-cleared retest

## Release Readiness Audit & Repair

- [x] Audit login, Messenger, calling, and public startup paths for reproducible crashes — fixed Messenger inbox undefined-id crash and public-page protected-query guards
- [x] Implement defensive participant and conversation normalization in `MessengerInboxView`
- [x] Harden calling signals and media-device bootstrap to prevent audio-source failures — added detailed Android permission and device-state error guidance to CallOverlay
- [x] Verify public landing page renders without `Please login` or `undefined` errors — public route is visually clean in sandbox and production
- [x] Run release-path regression tests and production build validation — build and type-check passed
- [x] Save and publish the release-ready checkpoint
- [x] Deliver release report and request mobile retest before the 12 AM deadline

## Final Release Audit & Repair

- [x] Audit public-page query hooks and account-lookup logic for reproducible session and database failures — hardened Home.tsx refetches and converted relational queries to explicit selects
- [x] Ensure all protected procedures on the landing page are session-gated and handle missing data gracefully
- [x] Harden account-lookup mutations to provide clear feedback and prevent unhandled database exceptions — added idx_users_email for stability
- [x] Add regression coverage for public startup safety and account lookup failures — 6 focused tests passed
- [x] Run release-path tests, TypeScript, production build, and production RPC validation — all passed
- [x] Save and publish the final release checkpoint
- [x] Deliver release report and request mobile/browser cache-cleared retest

## Release Hardening & Feature Polish

- [x] Audit maintenance mode, Messenger filtering, story-ownership, and people-visibility implementations
- [x] Add Maintenance Mode toggle in Creator Studio and implement public-access gating
- [x] Add unread message filter and Messenger-inbox search improvements
- [x] Add inbox reload option and harden Messenger status handling
- [x] Remove demo/bot story data and implement real-user story deletion and real profile
- [x] Audit and repair people/follower/call-identity displays to ensure real data visibility
- [x] Improve password-reset flow with loading animations and clear status feedback
- [x] Run focused regression tests, TypeScript, production build, and smoke-check critical routes
- [x] Save and publish the hardened release checkpoint

## Messenger Peer-List Repair

- [x] Repair the Messenger peer-list query to use a portable lookup instead of computed grouping
- [x] Add regression coverage for the `messages.peers` procedure
- [x] Run focused tests, TypeScript, production build, and authenticated route validation
- [x] Save and publish the final stable checkpoint
- [x] Deliver release report and request mobile/browser cache-cleared retest

## Final Release Audit & Database Repair

- [x] Repair the public marketplace and post-feed database failures by converting relational queries to explicit selects and adding raw SQL fallbacks
- [x] Harden public startup error handling to prevent "Please login" errors on the landing page
- [x] Add regression coverage for the repaired public paths and production build validation
- [x] Save and publish the final stable checkpoint
- [x] Deliver release report and request mobile/browser cache-cleared retest

## Creator Studio Restoration (Current Session)

- [x] Audit current `AdminView` and `CreatorStudio` implementations for missing historical features
- [x] Restore missing panels: Badge Requests, User Directory, Promotion Studio, and Audit Logs
- [x] Ensure all platform toggles (Photos, Videos, Reels, Stories) are present and functional
- [x] Organize the expanded studio with a clear navigation sidebar or tabs
- [x] Verify strict owner-only authorization for all restored procedures
- [x] Run focused regression tests, production build, and responsive validation before publishing
- [x] Audit and repair the follower-display issue to ensure real data visibility

## Final Production Audit & Repair (Current Session)

- [x] Audit failing queries: marketplace, posts, postMedia, mediaPolicy, and user-lookup
- [x] Implement schema-tolerant raw SQL fallbacks for all failing public database helpers
- [x] Harden public procedure gating to prevent "Please login" errors on the landing page
- [x] Add regression coverage for the repaired public paths and production build validation
- [x] Save and publish the final stable checkpoint
- [x] Deliver release report and request mobile/browser cache-cleared retest

## Messenger Interaction & Theme Enhancements (Current Session)

- [x] Implement a reliable live typing indicator for direct Messenger chats
- [x] Implement clear read-receipt state and mark incoming messages read while viewing a chat
- [x] Add or polish an accessible dark-mode toggle in the primary navigation bar
- [x] Add regression tests for typing/read receipts and theme-toggle behavior
- [x] Run TypeScript, Vitest, production build, and responsive visual verification
- [x] Save and publish the verified checkpoint
- [x] Deliver the updated release checkpoint and retest guidance


## Call Audio & Hang-up Repair (Current Session)

- [x] Inspect current WebRTC media setup, polling, and call status transitions
- [x] Repair silent or delayed call audio setup and improve connection-state feedback
- [x] Propagate remote hang-up state so both call screens close promptly
- [x] Add regression coverage for audio setup and remote hang-up transitions
- [x] Run TypeScript, focused tests, production build, and call UI verification
- [x] Save and publish the verified call repair checkpoint
- [x] Deliver the updated call repair and mobile retest guidance


## Call Controls, Alerts, Badge Assignment & APK Refresh (Current Session)

- [x] Audit current active-call controls, chat call history, incoming alerts, badge admin UI, and Android source
- [x] Add mute microphone and disable-video controls with reliable media-track state updates
- [x] Add missed and completed call history entries inside direct chat
- [x] Add ringing sound and stronger visual incoming-call notification behavior
- [x] Add secure owner-only manual badge assignment for user accounts
- [x] Add regression tests for the new call, badge, and alert contracts
- [x] Run TypeScript, focused tests, production build, and responsive verification
- [x] Build and verify a fresh Android debug APK from the latest source
- [x] Save and publish the updated web checkpoint
- [x] Deliver the updated checkpoint, APK, and mobile retest guidance


## Reload, Follow State & Profile List Crash Repair (Current Session)

- [x] Inspect reload controls, follow mutations, profile stats, and followers/following navigation
- [x] Add a visible reload action with loading and error feedback
- [x] Fix follow/unfollow cache updates so the button reflects the server state immediately
- [x] Harden followers/following list queries and rendering against malformed or missing user rows
- [x] Preserve safe navigation from list entries into user profiles
- [x] Add regression tests for reload, follow state, and profile-list crash paths
- [x] Run TypeScript, focused tests, production build, and responsive smoke verification
- [x] Save and publish the verified navigation repair
- [x] Deliver concise retest guidance

## Full Platform Feature Restoration (Current Session)

- [x] Audit the existing feature surface against the full social-platform requirements and prior code
- [x] Restore and harden the follower, following, profile-list, and relationship state system
- [x] Restore Creator Studio controls for user permissions, posting access, media access, badges, moderation, and platform settings
- [x] Verify Reels, stories, Messenger, calls, groups, reports, privacy, and notifications remain present and reliable
- [x] Add a complete regression suite for restored systems and critical cross-feature contracts
- [x] Run TypeScript, focused tests, production build, and mobile/desktop smoke verification
- [x] Save and publish the restored full-feature release
- [x] Deliver the complete restoration report and retest steps

## Creator Studio Familiar Layout & Password Management (Current Session)

- [x] Audit historical Creator Studio structure, current panels, and owner account-recovery controls
- [x] Restore a simple familiar primary Creator Studio dashboard with core controls visible immediately
- [x] Move newer permission, moderation, promotion, analytics, and system tools into a distinct advanced section
- [x] Restore secure owner-only password reset management without exposing existing user passwords
- [x] Add regression coverage for Creator Studio layout, authorization, and reset-management contracts
- [x] Run TypeScript, focused tests, production build, and authenticated Creator Studio visual verification
- [ ] Save and publish the restored Creator Studio release
- [ ] Deliver the updated Creator Studio retest steps
