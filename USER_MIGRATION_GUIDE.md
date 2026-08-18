# TanRyuGram Full User Migration

The Creator Studio migration panel exports a versioned JSON archive containing the portable application history needed to move the community to a compatible TanRyuGram destination. This is intentionally more than a list of user IDs.

The archive includes profiles, avatar and media references, posts, post media, comments, likes, post reactions, saves, follows, stories and story views, groups, memberships, group messages and attachments, polls and votes, events and RSVPs, group invite and join-request history, badges, subscriptions without payment-provider identifiers, tips without payment-provider identifiers, notifications, direct messages, message reactions, hidden-message records, call history without signaling data, and per-conversation settings.

Passwords, session cookies, email verification codes, push tokens, password-reset material, WebRTC signaling data, payment-provider identifiers, API keys, and server secrets are never exported. Imported accounts therefore keep their identity and history but must complete the normal password-reset flow before signing in. The archive does not make passwords visible to the owner or administrators.

Import is deliberately protected against duplicate user identities and is intended for a fresh compatible destination. First choose the archive in Creator Studio; the server validates its version, required record collections, size limit, and security flags. Review the record summary, then confirm the irreversible import. Record identifiers are preserved so foreign-key relationships remain connected across posts, messages, groups, reactions, and settings.

Store the downloaded file privately. It contains personal messages and community history. Do not upload it to public file-sharing services, commit it to source control, or send it through ordinary email. Before a real migration, keep the original database backup as an additional recovery option and test the archive on a separate destination.
