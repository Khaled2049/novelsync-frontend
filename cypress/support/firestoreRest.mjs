/**
 * Minimal Firestore REST <-> JS value conversion, shared by the Cypress Node
 * tasks. The Firestore emulator speaks the same typed-value wire format as
 * production (stringValue / integerValue / mapValue / ...). Kept tiny on
 * purpose — only the field types this suite actually seeds and asserts on.
 *
 * Plain ESM (.mjs): this file is imported by cypress.config.mjs and runs in
 * Node. The repo is "type": "module", so a .ts config + ts-node would emit CJS
 * and fail to load — hence JS here. Browser-side specs/support stay .ts.
 */

/** Encode a JS value into a Firestore REST typed Value. */
export function toValue(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toValue) } };
  }
  return { mapValue: { fields: toFields(v) } };
}

/** Encode a plain object into a Firestore REST `fields` map. */
export function toFields(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) fields[k] = toValue(val);
  return fields;
}

/** Decode a Firestore REST typed Value back into a JS value. */
export function fromValue(value) {
  if (value == null) return null;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) {
    return (value.arrayValue?.values ?? []).map(fromValue);
  }
  if ("mapValue" in value) {
    return fromFields(value.mapValue?.fields ?? {});
  }
  return null;
}

/** Decode a Firestore REST `fields` map into a plain object. */
export function fromFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromValue(v);
  return out;
}
