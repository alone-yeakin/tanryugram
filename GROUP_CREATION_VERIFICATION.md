# Messenger Group-Creation Verification

The Messenger inbox now includes a dedicated **Create group** action beside **New message**. The creation sheet requires a group name and at least one selected person, shows every selected person as a removable chip, and treats the creator as the group administrator.

## Live beta verification

The following groups were created through the browser using the beta account **Aria Sol (`user1@test.com`)**.

| Group | Selected people | Verified result |
|---|---|---|
| `Beta creator room` | Theo Makes | The group opened immediately and its info sheet showed Aria Sol as **Admin** and Theo Makes as the second member. |
| `Multi-member beta room` | Theo Makes and Nadia Codes | The group opened immediately with a **3 members** count. Its info sheet listed Aria Sol as **Admin**, Theo Makes, and Nadia Codes. |

The member-aware `messages.createGroup` procedure accepts a deduplicated list of member IDs, writes the creator and selected people to the group roster, and returns the new group ID for immediate navigation into the chat. TypeScript compilation and the full Vitest suite passed after the group-creation contract test was added.
