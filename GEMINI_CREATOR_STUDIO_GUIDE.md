# Gemini Creator Studio Assistant

The Creator Studio now includes an owner-only Gemini assistant. The owner can describe a desired feature or setting in plain language, receive a structured proposal, review the steps and warning, and then approve supported settings.

The assistant currently supports only safe, existing Creator Studio settings: account email delivery, signup verification, Apps Script login/reset delivery, photo uploads, and video uploads. It does not modify passwords, authentication ownership, roles, user records, private messages, storage paths, payment settings, API secrets, media rendering code, or database schema.

A proposal marked `CODE REVIEW NEEDED` is guidance only. It does not claim that source code was changed or deployed. Source-code features require a reviewed engineering change, tests, and a new deployment checkpoint. This boundary prevents a natural-language prompt from silently changing security-sensitive code or the working photo/media system.

The Gemini key is stored as the server-side `GEMINI_API_KEY` secret. It is never sent to the browser or displayed in Creator Studio. Because the key was shared in chat during setup, revoke or rotate it in Google AI Studio and replace the project secret with a new restricted key. Apply API restrictions and usage limits where Google makes them available, and monitor the Google account for unexpected usage.

Gemini requests use the owner’s Google API quota and are subject to Google’s model availability, rate limits, and billing terms. The API smoke test checks only authentication against the model-list endpoint; it does not guarantee that every model or future request will be available.
