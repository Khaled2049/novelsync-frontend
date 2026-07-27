/**
 * Cross-repo guard for the embedded-field lists.
 *
 * `functions/src/entityFields.ts` (this repo) decides WHEN a re-embed fires;
 * `agents/storyAgent/entity_schema.py` (novelsync-agents) decides WHAT gets embedded
 * and how it's labelled in prompts. Nothing but this test keeps them in lockstep, and
 * a mismatch is silent: edits to a field either never re-embed (the AI keeps
 * answering from a stale vector) or re-embed needlessly (burning indexing budget).
 *
 * Skips cleanly when the sibling repo isn't checked out.
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  SIGNATURE_FIELDS,
  type EmbeddedEntityKind,
} from "../functions/src/entityFields";

const SCHEMA_PATH = path.resolve(
  __dirname,
  "../../novelsync-agents/agents/storyAgent/entity_schema.py",
);

const agentsRepoPresent = fs.existsSync(SCHEMA_PATH);

/** Extract one `Dict[...] = { ... }` literal body by name. */
function extractDictBody(source: string, name: string): string {
  const start = source.indexOf(`${name}: Dict`);
  if (start === -1) throw new Error(`${name} not found in entity_schema.py`);
  const open = source.indexOf("{", start);
  if (open === -1) throw new Error(`${name} has no opening brace`);

  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  throw new Error(`${name} literal is unterminated`);
}

/** Per-kind entries out of a dict body: `"character": [ ... ],` */
function entriesByKind(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /"(\w+)"\s*:\s*\[([\s\S]*?)\]\s*,?\s*(?=("|\}|$))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    out[match[1]] = match[2];
  }
  return out;
}

/** `ENTITY_FIELD_SCHEMA` holds `(field, label, cap)` tuples — take the field. */
function scalarFields(entry: string): string[] {
  return [...entry.matchAll(/\(\s*"(\w+)"/g)].map((m) => m[1]);
}

/** `ENTITY_ARRAY_FIELDS` holds bare strings. */
function arrayFields(entry: string): string[] {
  return [...entry.matchAll(/"(\w+)"/g)].map((m) => m[1]);
}

/** Mirror of the Python `embedded_field_names()` helper. */
function embeddedFieldNames(
  source: string,
  kind: EmbeddedEntityKind,
): string[] {
  const scalars = entriesByKind(extractDictBody(source, "ENTITY_FIELD_SCHEMA"));
  const arrays = entriesByKind(extractDictBody(source, "ENTITY_ARRAY_FIELDS"));
  return [
    "name",
    ...scalarFields(scalars[kind] ?? ""),
    ...arrayFields(arrays[kind] ?? ""),
  ];
}

describe.skipIf(!agentsRepoPresent)(
  "SIGNATURE_FIELDS matches the agents' entity_schema.py",
  () => {
    const source = agentsRepoPresent
      ? fs.readFileSync(SCHEMA_PATH, "utf8")
      : "";

    const kinds: EmbeddedEntityKind[] = ["character", "place", "plot"];

    it.each(kinds)("%s embeds the same fields on both sides", (kind) => {
      const agentFields = embeddedFieldNames(source, kind);
      expect(agentFields.length).toBeGreaterThan(0);
      expect([...agentFields].sort()).toEqual(
        [...SIGNATURE_FIELDS[kind]].sort(),
      );
    });

    it("covers every kind the frontend knows about", () => {
      expect(Object.keys(SIGNATURE_FIELDS).sort()).toEqual([...kinds].sort());
    });
  },
);

describe.skipIf(agentsRepoPresent)("entity field sync (skipped)", () => {
  it("reports why it could not run", () => {
    console.warn(
      `Skipped cross-repo field sync: ${SCHEMA_PATH} not found. ` +
        "Check out novelsync-agents alongside this repo to enable it.",
    );
    expect(agentsRepoPresent).toBe(false);
  });
});
