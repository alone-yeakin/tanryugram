# Tanryugram verification notes

## Two-account message receipts

- `user1@test.com` (Aria Sol, user ID 1260013) sent `Receipt pipeline check` to `user2@test.com` (Theo Makes, user ID 1260014).
- The authenticated messages query returned `deliveryStatus: "sent"` and `isRead: false` immediately after send.
- Fetching the conversation as user2 promoted the message to `deliveryStatus: "delivered"` while leaving `isRead: false`.
- Marking the conversation read as user2 changed the sender-visible record to `deliveryStatus: "read"` and `isRead: true`.
- The direct chat rendered `Seen 05:34 PM` for the read message.
- A separate live UI message, `Receipt visual sent`, rendered a single `lucide-check` icon in muted gray.
- A separate live UI message, `Receipt visual delivered`, rendered a `lucide-check-check` icon in muted gray.
- The previously read message rendered `lucide-check-check` with the blue class and a Seen label.

## Calls

- The full-screen Messenger flow showed outgoing call, incoming call, active call controls, timeout/missed, ended, and busy-call handling.
- The sandbox browser has no microphone/camera device; the call overlay now reports `Call unavailable`, ends the call record safely, and offers Back to chat/Try again instead of leaving a false active call.
- Video-call controls include mute, speaker, video toggle, camera flip, end call, and a browser picture-in-picture fallback.

## Responsive verification

- Desktop full-screen Messenger inbox and chat were verified in the authenticated preview.
- A 375x812 mobile-sized preview captured the Tanryugram mobile shell with bottom navigation and responsive story/feed layout.

## Remaining data limitation

- The seeded beta group currently contains only the owner account, so an end-to-end two-beta-account group mention notification could not be run without changing seeded membership. The code includes group mention suggestions, highlighted mention rendering, backend mention notification creation, and a Messenger unread mention alert.

## Read-state visual evidence

- In the live user1 chat, the `Receipt pipeline check` message contained `lucide-check-check h-3.5 w-3.5 text-blue-500` and the visible `Seen 05:34 PM` label, confirming the blue double-check read state from real message data.
