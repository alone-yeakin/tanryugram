import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessengerSearchResult } from "./MessengerSearchResult";

describe("MessengerSearchResult", () => {
  it("renders the selected profile identity and opens a conversation target", () => {
    const markup = renderToStaticMarkup(<MessengerSearchResult person={{ id: "42", name: "Rabbi", username: "evo_rabby" }} onSelect={() => undefined} />);
    expect(markup).toContain('data-peer-id="42"');
    expect(markup).toContain("Rabbi");
    expect(markup).toContain("@evo_rabby");
  });

  it("renders nothing for an invalid search result without an id", () => {
    const markup = renderToStaticMarkup(<MessengerSearchResult person={{ name: "Missing id" }} onSelect={() => undefined} />);
    expect(markup).toBe("");
  });
});
