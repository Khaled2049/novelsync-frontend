/**
 * Which metadata-entity fields contribute to the embedded text, per kind.
 *
 * Deliberately free of firebase imports so it can be read by tooling and tests
 * without pulling in the functions runtime.
 *
 * This list decides *when* a re-embed fires. Its counterpart in the agents repo,
 * `agents/storyAgent/entity_schema.py`, decides *what* gets embedded and how it is
 * labelled in prompts. **The two must name the same fields, and nothing checks
 * that they do** — a cross-repo test used to, but it needed a credential to clone
 * the other private repo in CI and was removed as not worth the upkeep.
 *
 * So this is a manual convention now: change one side, change the other in the
 * same breath. A mismatch fails silently in both directions — edits to a field
 * either never re-embed (the AI keeps answering from a stale vector) or re-embed
 * needlessly (burning indexing budget). Neither surfaces as an error.
 *
 * A third consumer now reads the agents-side list: the MCP server projects
 * `get_entity` onto it (`mcp_server/data.py`), so a field removed there stops
 * being readable over MCP.
 */

export type EmbeddedEntityKind = "character" | "place" | "plot";

/** Fields that contribute to the embedded text, per kind. Anything else changing
 *  (timestamps, UI flags) must NOT trigger a re-embed. */
export const SIGNATURE_FIELDS: Record<EmbeddedEntityKind, string[]> = {
  character: [
    "name",
    "age",
    "soul",
    "personality",
    "voice",
    "backstory",
    "affiliations",
    "notes",
    "relationships",
  ],
  place: [
    "name",
    "description",
    "atmosphere",
    "geography",
    "history",
    "significance",
    "notes",
  ],
  plot: ["name", "description", "events"],
};

/** Array-of-object fields where only some sub-fields are embedded. We compare ONLY
 *  those sub-fields so volatile siblings — per-event updatedAt/createdAt/
 *  tensionLevel/orderIndex, a relationship's characterId — don't flip the signature
 *  and force a needless re-embed. */
export const EMBEDDED_SUBFIELDS: Record<string, string[]> = {
  events: ["name", "content"],
  relationships: ["name", "type", "description"],
};
