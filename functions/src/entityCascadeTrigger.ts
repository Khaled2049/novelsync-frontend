/**
 * Referential-integrity triggers for characters and places.
 *
 * Plot events reference characters and places by ID (`characterIds`, `locationId`),
 * and a character's `relationships[]` denormalizes the *name* of the character it
 * points at. Nothing else sweeps those references, so without this file deleting an
 * entity leaves broken IDs behind and renaming one leaves a stale name copy — which
 * also feeds the vector embedding, since `relationships[].name` is an embedded field.
 *
 * Runs alongside `entityIndexTrigger`'s handlers on the same document paths (v2
 * allows multiple triggers per path). Cascade writes intentionally re-fire those
 * indexing triggers: a propagated rename *should* re-embed. They do not recurse —
 * the cascade only reacts to a delete or to a change in the entity's *own* name,
 * and the writes it makes change neither on the documents it touches.
 */
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

type CascadeKind = "character" | "place";

interface Relationship {
  characterId?: string;
  name?: string;
  [key: string]: unknown;
}

interface PlotEventDoc {
  characterIds?: string[];
  locationId?: string | null;
  [key: string]: unknown;
}

/**
 * Strip a deleted character from every plot event that casts it, and from every
 * sibling character's relationships.
 */
async function cascadeCharacterDelete(
  storyId: string,
  characterId: string,
): Promise<void> {
  const storyRef = db.collection("stories").doc(storyId);
  const [plotsSnap, charactersSnap] = await Promise.all([
    storyRef.collection("plots").get(),
    storyRef.collection("characters").get(),
  ]);

  const batch = db.batch();
  let writes = 0;

  for (const plotDoc of plotsSnap.docs) {
    const events = (plotDoc.data().events as PlotEventDoc[]) ?? [];
    let touched = false;

    const next = events.map((event) => {
      const ids = event.characterIds ?? [];
      if (!ids.includes(characterId)) return event;
      touched = true;
      return { ...event, characterIds: ids.filter((id) => id !== characterId) };
    });

    if (touched) {
      batch.update(plotDoc.ref, { events: next });
      writes++;
    }
  }

  for (const charDoc of charactersSnap.docs) {
    const relationships = (charDoc.data().relationships as Relationship[]) ?? [];
    const next = relationships.filter((r) => r.characterId !== characterId);
    if (next.length !== relationships.length) {
      batch.update(charDoc.ref, { relationships: next });
      writes++;
    }
  }

  if (writes > 0) {
    await batch.commit();
    logger.info("cascade: cleared references to deleted character", {
      storyId,
      characterId,
      documentsUpdated: writes,
    });
  }
}

/** Null out a deleted place on every plot event that was set there. */
async function cascadePlaceDelete(
  storyId: string,
  placeId: string,
): Promise<void> {
  const plotsSnap = await db
    .collection("stories")
    .doc(storyId)
    .collection("plots")
    .get();

  const batch = db.batch();
  let writes = 0;

  for (const plotDoc of plotsSnap.docs) {
    const events = (plotDoc.data().events as PlotEventDoc[]) ?? [];
    let touched = false;

    const next = events.map((event) => {
      if (event.locationId !== placeId) return event;
      touched = true;
      return { ...event, locationId: null };
    });

    if (touched) {
      batch.update(plotDoc.ref, { events: next });
      writes++;
    }
  }

  if (writes > 0) {
    await batch.commit();
    logger.info("cascade: cleared references to deleted place", {
      storyId,
      placeId,
      documentsUpdated: writes,
    });
  }
}

/**
 * Propagate a character rename into the denormalized `relationships[].name`
 * copies held by other characters.
 */
async function propagateCharacterRename(
  storyId: string,
  characterId: string,
  newName: string,
): Promise<void> {
  const charactersSnap = await db
    .collection("stories")
    .doc(storyId)
    .collection("characters")
    .get();

  const batch = db.batch();
  let writes = 0;

  for (const charDoc of charactersSnap.docs) {
    if (charDoc.id === characterId) continue;

    const relationships = (charDoc.data().relationships as Relationship[]) ?? [];
    let touched = false;

    const next = relationships.map((r) => {
      if (r.characterId !== characterId || r.name === newName) return r;
      touched = true;
      return { ...r, name: newName };
    });

    if (touched) {
      batch.update(charDoc.ref, { relationships: next });
      writes++;
    }
  }

  if (writes > 0) {
    await batch.commit();
    logger.info("cascade: propagated character rename to relationships", {
      storyId,
      characterId,
      documentsUpdated: writes,
    });
  }
}

/** Deleting a whole story removes its subcollections — no point sweeping them. */
async function storyStillExists(storyId: string): Promise<boolean> {
  const story = await db.collection("stories").doc(storyId).get();
  return story.exists;
}

function makeCascadeHandler(kind: CascadeKind) {
  return async (event: {
    params: Record<string, string>;
    data?: {
      before: FirebaseFirestore.DocumentSnapshot;
      after: FirebaseFirestore.DocumentSnapshot;
    };
  }): Promise<void> => {
    const storyId = event.params.storyId;
    const entityId = event.params.entityId;

    const before = event.data?.before.exists
      ? event.data.before.data() ?? null
      : null;
    const after = event.data?.after.exists
      ? event.data.after.data() ?? null
      : null;

    const isDelete = before !== null && after === null;
    const renamedTo =
      before !== null && after !== null && before.name !== after.name
        ? (after.name as string)
        : null;

    if (!isDelete && renamedTo === null) return;

    try {
      if (!(await storyStillExists(storyId))) return;

      if (isDelete) {
        if (kind === "character") {
          await cascadeCharacterDelete(storyId, entityId);
        } else {
          await cascadePlaceDelete(storyId, entityId);
        }
        return;
      }

      // Only characters denormalize their name into another document.
      if (kind === "character" && renamedTo !== null) {
        await propagateCharacterRename(storyId, entityId, renamedTo);
      }
    } catch (error) {
      logger.error("cascade sweep failed", {
        storyId,
        kind,
        entityId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

const cascadeOpts = (collection: string) => ({
  document: `stories/{storyId}/${collection}/{entityId}`,
  memory: "256MiB" as const,
  timeoutSeconds: 120,
});

export const onCharacterCascade = onDocumentWritten(
  cascadeOpts("characters"),
  makeCascadeHandler("character"),
);
export const onPlaceCascade = onDocumentWritten(
  cascadeOpts("places"),
  makeCascadeHandler("place"),
);
