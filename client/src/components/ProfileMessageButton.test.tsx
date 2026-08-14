import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileMessageButton } from "./ProfileMessageButton";

describe("ProfileMessageButton", () => {
  it("renders the selected profile id and Message action", () => {
    const markup = renderToStaticMarkup(<ProfileMessageButton user={{ id: "42", name: "Rabbi", username: "evo_rabby" }} onOpen={() => undefined} />);
    expect(markup).toContain('data-peer-id="42"');
    expect(markup).toContain("Message");
  });

  it("does not render for a profile without a valid id", () => {
    const markup = renderToStaticMarkup(<ProfileMessageButton user={{ name: "Missing id" }} onOpen={() => undefined} />);
    expect(markup).toBe("");
  });
});
