# Tanryugram Groups Upgrade Documentation

Tanryugram features a robust, feature-complete group messaging and community coordination ecosystem built on top of tRPC and Drizzle ORM.

## 1. Group Discovery & Creation
- **Public & Private Groups**: Users can create public or private groups with custom avatars, descriptions, and join modes (open, approval, invite).
- **Creator Autonomy**: Group creators can launch public groups immediately without requiring initial member selection.
- **Directory Search**: Explore and discover active public groups with instant name and description filtering.

## 2. Membership & Roles
- **Member Management**: Administrators can add members, review join requests, and assign roles (`admin`, `moderator`, `member`).
- **Security & Privacy**: Strict non-member boundaries return clear authorization errors when accessing protected group feeds, polls, or events.

## 3. Rich Community Interaction
- **In-Chat Polls**: Single or multi-choice polls with voting, option visibility, and closing schedules.
- **Events & RSVP**: Group events with location, image, start time, and live RSVP state tracking (`going`, `maybe`, `cant_go`).
- **Shared Media & Files**: Indexed media, document attachments, and link previews with secure storage proxy integration.
