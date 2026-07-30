const SCOPE_GRANTS: Record<string, string> = {
  "stories:read": "Read your stories, chapters, characters, places, and plots",
  "stories:write": "Create, edit, and delete your stories and chapters",
};

const WITHHELD: {
  text: string;
  unlessScope?: string;
  unconditional?: boolean;
}[] = [
  { text: "Edit or delete anything", unlessScope: "stories:write" },
  { text: "See other writers' unpublished work", unconditional: true },
  { text: "Spend your AI credits" },
];

export interface ConsentCopy {
  grants: string[];
  withheld: string[];
  unrecognized: string[];
}

export const knownScopes = (): string[] => Object.keys(SCOPE_GRANTS);

export const gatingScopes = (): string[] =>
  WITHHELD.flatMap(({ unlessScope }) => (unlessScope ? [unlessScope] : []));

export const describeScopes = (
  rawScopes: string[] | undefined,
): ConsentCopy => {
  const scopes = (rawScopes ?? []).map((s) => s.trim()).filter(Boolean);

  const granted = new Set(scopes);
  const unrecognized = scopes.filter((s) => !(s in SCOPE_GRANTS));

  const grants = Object.keys(SCOPE_GRANTS)
    .filter((scope) => granted.has(scope))
    .map((scope) => SCOPE_GRANTS[scope]);

  const withheld = WITHHELD.filter(({ unlessScope, unconditional }) => {
    if (unconditional) return true;
    if (unrecognized.length > 0) return false;
    return !unlessScope || !granted.has(unlessScope);
  }).map(({ text }) => text);

  return { grants, withheld, unrecognized };
};
