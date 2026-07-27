/**
 * `ensureEventDefaults` is the single backfill path for plot events read out of
 * Firestore. The version it replaced spread the defaults *after* the stored event,
 * so every real value was silently overwritten — these tests pin the correct order.
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLOT_EVENT_VALUES,
  ensureEventDefaults,
  type PlotEvent,
} from "@/types/IPlot";

const legacy = { id: "e1", name: "Ambush", content: "They are cornered." };

describe("ensureEventDefaults", () => {
  it("backfills a legacy { id, name, content } event", () => {
    const event = ensureEventDefaults(legacy, 3);

    expect(event).toMatchObject({
      ...DEFAULT_PLOT_EVENT_VALUES,
      ...legacy,
      orderIndex: 3,
    });
  });

  it("never lets a default overwrite a stored value", () => {
    const stored: Partial<PlotEvent> & typeof legacy = {
      ...legacy,
      tensionLevel: 9,
      pacing: "fast",
      storyBeat: "climax",
      characterIds: ["c1", "c2"],
      locationId: "p1",
      orderIndex: 2,
    };

    const event = ensureEventDefaults(stored, 99);

    expect(event.tensionLevel).toBe(9);
    expect(event.pacing).toBe("fast");
    expect(event.storyBeat).toBe("climax");
    expect(event.characterIds).toEqual(["c1", "c2"]);
    expect(event.locationId).toBe("p1");
    // The stored orderIndex wins over the positional fallback.
    expect(event.orderIndex).toBe(2);
  });

  it("preserves createdAt rather than stamping a new one", () => {
    const createdAt = "2024-01-01T00:00:00.000Z";
    const event = ensureEventDefaults({ ...legacy, createdAt }, 0);

    expect(event.createdAt).toBe(createdAt);
  });

  it("falls back to the positional index only when orderIndex is absent", () => {
    expect(ensureEventDefaults(legacy, 7).orderIndex).toBe(7);
    expect(ensureEventDefaults({ ...legacy, orderIndex: 0 }, 7).orderIndex).toBe(
      0,
    );
  });

  it("substitutes empty collections for missing reference fields", () => {
    const event = ensureEventDefaults(legacy, 0);

    expect(event.characterIds).toEqual([]);
    expect(event.dependencies).toEqual([]);
    expect(event.dependents).toEqual([]);
    expect(event.locationId).toBeNull();
  });
});
