import { describe, expect, it } from "vitest";

import {
  describeScopes,
  gatingScopes,
  knownScopes,
} from "../src/routes/Auth/mcpConsentScopes";

describe("describeScopes", () => {
  it("describes the read-only grant that ships today", () => {
    const copy = describeScopes(["stories:read"]);
    expect(copy.grants).toEqual([
      "Read your stories, chapters, characters, places, and plots",
    ]);
    expect(copy.unrecognized).toEqual([]);
    expect(copy.withheld).toEqual([
      "Edit or delete anything",
      "See other writers' unpublished work",
      "Spend your AI credits",
    ]);
  });

  it("stops claiming read-only once a write scope is requested", () => {
    const copy = describeScopes(["stories:read", "stories:write"]);
    expect(copy.withheld).not.toContain("Edit or delete anything");
    // Unrelated reassurances still stand.
    expect(copy.withheld).toContain("Spend your AI credits");
    expect(copy.withheld).toContain("See other writers' unpublished work");
  });

  it("describes what a write scope lets the app do, not just what it removes", () => {
    const copy = describeScopes(["stories:read", "stories:write"]);
    expect(copy.grants).toContain(
      "Create, edit, and delete your stories and chapters",
    );
    expect(copy.unrecognized).toEqual([]);
  });

  it("keeps every gating scope describable", () => {
    // A gate on a scope with no grant copy is dead code: granting it marks the
    // scope unrecognized, which suppresses the whole conditional list before
    // the gate is ever consulted. This caught exactly that bug once already.
    for (const scope of gatingScopes()) {
      expect(knownScopes()).toContain(scope);
    }
  });

  it("surfaces an unknown scope verbatim instead of ignoring it", () => {
    const copy = describeScopes(["stories:read", "stories:publish"]);
    expect(copy.unrecognized).toEqual(["stories:publish"]);
    expect(copy.grants).toEqual([
      "Read your stories, chapters, characters, places, and plots",
    ]);
  });

  it("drops every non-structural reassurance when a scope is unrecognized", () => {
    // We cannot reason about what an unknown scope permits, so we must not
    // guess in the application's favour.
    const copy = describeScopes(["stories:read", "something:new"]);
    expect(copy.withheld).not.toContain("Edit or delete anything");
    expect(copy.withheld).not.toContain("Spend your AI credits");
    // Ownership is enforced server-side regardless of scope, so this holds.
    expect(copy.withheld).toEqual(["See other writers' unpublished work"]);
  });

  it("keeps display order stable regardless of requested order", () => {
    const a = describeScopes(["stories:write", "stories:read"]);
    const b = describeScopes(["stories:read", "stories:write"]);
    expect(a.grants).toEqual(b.grants);
    expect(a.withheld).toEqual(b.withheld);
  });

  it("handles empty, undefined, and whitespace-only scope lists", () => {
    for (const input of [undefined, [], [""], ["  "]]) {
      const copy = describeScopes(input);
      expect(copy.grants).toEqual([]);
      expect(copy.unrecognized).toEqual([]);
      // Nothing was granted, so every reassurance is true.
      expect(copy.withheld).toHaveLength(3);
    }
  });

  it("trims whitespace around scopes rather than treating them as unknown", () => {
    const copy = describeScopes([" stories:read "]);
    expect(copy.unrecognized).toEqual([]);
    expect(copy.grants).toHaveLength(1);
  });
});
