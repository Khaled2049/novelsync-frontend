/**
 * Metadata-entity write triggers — keep the vector index in sync for characters,
 * places, and plots, the same way onChapterWrite does for chapters.
 *
 * One shared handler, three exports (one per subcollection, since v2 triggers need
 * a literal document path). Re-embedding is DEBOUNCED via indexEntityTask so form
 * autosaves don't cause churn; deletes run immediately. Only the fields we actually
 * embed are compared (see `entityFields.ts`), so an `updatedAt`-only write doesn't
 * trigger a re-embed.
 *
 * Referential integrity on delete/rename lives in `entityCascadeTrigger.ts`.
 *
 * See chat-scaling-design.md.
 */
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { callAgent } from "./agentService";
import {
  VECTOR_INDEX_DISABLED,
  debounceBucket,
  enqueueDebounced,
  resolveOwnerId,
} from "./indexShared";
import { EntityKind, IndexEntityTaskPayload } from "./indexEntityTask";
import { EMBEDDED_SUBFIELDS, SIGNATURE_FIELDS } from "./entityFields";

/** Project a field down to just what contributes to the embedded text. */
function projectField(field: string, value: unknown): unknown {
  const sub = EMBEDDED_SUBFIELDS[field];
  if (sub && Array.isArray(value)) {
    return value.map((item) => {
      if (!item || typeof item !== "object") return item;
      const picked: Record<string, unknown> = {};
      for (const s of sub) picked[s] = (item as Record<string, unknown>)[s] ?? null;
      return picked;
    });
  }
  return value ?? null;
}

/** Stable JSON of just the embedded fields, used to detect meaningful changes. */
function signature(kind: EntityKind, data: FirebaseFirestore.DocumentData | undefined): string {
  if (!data) return "";
  const picked: Record<string, unknown> = {};
  for (const f of SIGNATURE_FIELDS[kind]) picked[f] = projectField(f, data[f]);
  return JSON.stringify(picked);
}

async function enqueueEntityIndex(
  storyId: string,
  kind: EntityKind,
  entityId: string,
): Promise<void> {
  const id = `idx_${kind}_${storyId}_${entityId}_${debounceBucket()}`;
  const payload: IndexEntityTaskPayload = { storyId, kind, entityId };
  await enqueueDebounced("indexEntityTask", id, payload);
}

function makeHandler(kind: EntityKind) {
  return async (
    event: {
      params: Record<string, string>;
      data?: {
        before: FirebaseFirestore.DocumentSnapshot;
        after: FirebaseFirestore.DocumentSnapshot;
      };
    },
  ): Promise<void> => {
    const storyId = event.params.storyId;
    const entityId = event.params.entityId;

    const before = event.data?.before.exists ? event.data.before.data() : null;
    const after = event.data?.after.exists ? event.data.after.data() : null;

    // Deleted → remove chunks immediately (rare).
    if (!after) {
      if (VECTOR_INDEX_DISABLED) {
        logger.info("emulator: skipping entity chunk delete (prod would delete)", { storyId, kind, entityId });
      } else {
        const ownerId = await resolveOwnerId(storyId);
        const res = await callAgent("deleteEntityChunks", { storyId, entityId }, ownerId);
        if (!res.success) {
          logger.warn("deleteEntityChunks failed", { storyId, kind, entityId, error: res.error });
        }
      }
      return;
    }

    // Re-embed only when an embedded field actually changed (or on create).
    if (before !== null && signature(kind, before) === signature(kind, after)) {
      return;
    }
    if (VECTOR_INDEX_DISABLED) {
      logger.info("emulator: skipping entity vector index (prod would index)", { storyId, kind, entityId });
      return;
    }
    await enqueueEntityIndex(storyId, kind, entityId);
  };
}

const triggerOpts = (collection: string) => ({
  document: `stories/{storyId}/${collection}/{entityId}`,
  memory: "256MiB" as const,
  timeoutSeconds: 60,
});

export const onCharacterWrite = onDocumentWritten(
  triggerOpts("characters"),
  makeHandler("character"),
);
export const onPlaceWrite = onDocumentWritten(
  triggerOpts("places"),
  makeHandler("place"),
);
export const onPlotWrite = onDocumentWritten(
  triggerOpts("plots"),
  makeHandler("plot"),
);
