# Tanryugram Beta Runbook

## Starting the beta build

Run `pnpm dev` from the project root to start the web application. The Expo companion remains in `mobile/`; consult `MOBILE_APP_GUIDE.md` for its local development workflow. The five shared beta accounts use the password `test123`:

| Account | Test role |
| --- | --- |
| `user1@test.com` | Aria Sol — administrator of the public beta group |
| `user2@test.com` | Theo Makes — public beta group member |
| `user3@test.com` | Nadia Codes — non-member access-control test account |
| `user4@test.com` | Mika Studio — additional beta account |
| `user5@test.com` | Lena Ray — additional beta account |

## Group sharing workflow

Open **Messages**, select a group, and use **Share media** above the composer. Members can attach photos, videos, voice notes, documents, and HTTPS links. The panel accepts individual attachments up to **12 MB** and exposes an optional message field before upload. Browser-recorded voice notes are sent as audio attachments after recording stops.

| Content | Supported upload formats | Display behavior |
| --- | --- | --- |
| Images | JPEG, PNG, WebP, GIF | Previewed as media and indexed in shared media |
| Video | MP4, WebM, MOV | Playable in the shared-media panel |
| Voice notes | WebM, OGG, MP3, MP4, WAV | Native audio playback control in shared media |
| Documents | PDF, TXT, CSV, ZIP, DOCX, XLSX | Filename, file size, and download action |
| Links | HTTPS or HTTP URLs | Named link card with an external destination |

## Access-control check

Use `user1@test.com` to enter **Public creator beta community** and share a small file. A current member such as `user2@test.com` should see it in Group Sharing. A non-member such as `user3@test.com` must not be able to query the group’s messages, members, events, or shared media; the protected API returns a **403 FORBIDDEN** response.

## Pre-release device check

Before wider distribution, test on a physical Android or iOS device: select a real gallery image and video, record and play back a microphone voice note, download a small document, and confirm a non-member cannot access any group media through the app interface.
