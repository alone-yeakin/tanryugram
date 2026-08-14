# Tanryugram Groups Verification Notes

The live Messenger inbox now renders the **Chats**, **Requests**, and **Discover** tabs. The public-group search and empty state render correctly when no discoverable groups are available.

During public-group creation testing, the profile form correctly exposed name, description, public/private visibility, join mode, and posting mode. The current authenticated owner account could not find a selectable beta user in the member directory, so the creation form was updated to permit a creator to launch a public group without an initial invitee. The protected server contract already records the creator as the first administrator, and later public joins can add further members.

The next browser pass will create the confirmed public beta group using that creator-only path, then verify Discover and the second-account join flow.

## Public discovery and join result

The creator-only launch path was verified by creating **Public creator beta** with **Public** visibility and **Open** joining. Under the second beta account, **Theo Makes (`user2@test.com`)**, the group appeared in the Discover tab with its member count, visibility, join mode, and **Join group** control. Selecting Join opened the group chat immediately, increased the roster to **2 members**, and rendered the system message: **“Theo Makes joined the group.”**

## Events, moderation, and editable group details

As **Aria Sol (`user1@test.com`)**, the group administrator created **Creator feedback circle** for **13 August 2026 at 18:00** in **Tanryugram Studio**. The event card rendered its Going, Maybe, and Can’t go controls plus calendar export. Selecting **Going** persisted the RSVP, displayed the attendee summary as **1 going**, and named Aria in the attendee list.

Administrator controls were also exercised against the public beta group. The event message was pinned successfully, with the persistent pin banner shown at the top of the conversation. Group Info displayed the editable name and description fields, public/private selector, announcements setting, two-member roster, role selector, removal control, shared-media entry point, reporting control, and leave action. Saving the edited group name persisted it as **Public creator beta community**.

## Rich group sharing and member-access verification

The Group Sharing panel is available to every member from the conversation and exposes distinct **Photo**, **Video**, **Voice note**, **File**, and **Link** actions. It validates an explicit allow-list of common images, MP4/WebM/MOV video, browser-recorded audio formats, WAV, PDF, plain-text/CSV, ZIP, DOCX, and XLSX; individual attachments are capped at **12 MB** and uploaded into a group- and sender-scoped storage key.

Live verification established that an administrator can share an HTTPS link and that it appears in the group shared-media library. A real text-file attachment was uploaded through the protected group attachment procedure and appeared with its filename, size, and Download control. A short valid WAV attachment was also uploaded through the voice-note media path and presented a native playback control in the Group Sharing panel. The temporary messages and test attachments were removed after verification.

The second beta account, **Theo Makes**, successfully posted a regular text message through the protected group message procedure and saw existing group media. By contrast, **Nadia Codes (`user3@test.com`)**, who is not a member of this group, received a **403 FORBIDDEN** response when requesting its shared-media listing. This validates member-only access for group messages, member rosters, events, and shared media at the application API boundary.

> The browser test environment visibly confirmed the photo, video, voice-note, file, and link controls. Text, link, file, and audio paths were exercised end-to-end; a final physical-device pass should still select a real gallery image/video and permit microphone access before a public release.
