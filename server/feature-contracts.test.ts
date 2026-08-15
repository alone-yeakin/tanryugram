import { describe, expect, it } from "vitest";
import { groupEventRsvps, groupMessages } from "../drizzle/schema";
import { appRouter } from "./routers";

const caller = appRouter.createCaller({ req: {} as any, res: {} as any, user: null } as any) as any;

function expectProcedures(router: any, names: string[]) {
  for (const name of names) expect(typeof router[name]).toBe("function");
}

describe("Tanryugram major feature contracts", () => {
  it("exposes the story viewer lifecycle procedures", () => {
    expectProcedures(caller.stories, ["list", "create", "view", "viewers"]);
  });

  it("exposes six-reaction and carousel post procedures", () => {
    expectProcedures(caller.posts, ["create", "reaction", "reactions", "media"]);
  });

  it("exposes Messenger reply, voice, deletion, and call procedures", () => {
    expectProcedures(caller.messages, ["list", "send", "react", "delete", "startCall", "getCall", "signal", "updateCall", "recentCalls"]);
  });

  it("exposes member-aware group creation and group conversation procedures", () => {
    expectProcedures(caller.messages, ["createGroup", "groups", "groupMembers", "groupMessages", "sendGroupMessage"]);
  });

  it("exposes group discovery, moderation, polls, events, and shared-media procedures", () => {
    expectProcedures(caller.messages, ["discoverGroups", "updateGroupProfile", "joinGroup", "joinRequests", "reviewJoinRequest", "setGroupMemberRole", "pinGroupMessage", "deleteGroupMessage", "createPoll", "poll", "votePoll", "createEvent", "events", "rsvpEvent", "groupMedia", "uploadGroupAttachment"]);
  });

  it("preserves all RSVP states required for event attendee summaries", () => {
    expect(groupEventRsvps.status.enumValues).toEqual(["going", "maybe", "cant_go"]);
  });

  it("supports the rich attachment categories available to group members", () => {
    expect(groupMessages.attachmentType.enumValues).toEqual(["image", "video", "audio", "file", "link"]);
    expect(groupMessages.attachmentDurationSeconds).toBeDefined();
  });
});
