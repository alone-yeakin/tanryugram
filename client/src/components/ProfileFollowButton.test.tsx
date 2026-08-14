import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileFollowButton } from "./ProfileFollowButton";

describe("ProfileFollowButton", () => {
  it("renders Follow for an authenticated profile that is not followed", () => {
    const html = renderToStaticMarkup(<ProfileFollowButton isAuthenticated isFollowing={false} isPending={false} onFollow={vi.fn()} onLogin={vi.fn()} />);
    expect(html).toContain(">Follow</button>");
    expect(html).toContain('data-following="false"');
  });

  it("renders Following state and preserves the pressed relationship", () => {
    const html = renderToStaticMarkup(<ProfileFollowButton isAuthenticated isFollowing isPending={false} onFollow={vi.fn()} onLogin={vi.fn()} />);
    expect(html).toContain(">Following</button>");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-following="true"');
  });
});
