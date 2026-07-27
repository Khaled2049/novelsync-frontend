import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { PlotEvent, PlotLine } from "@/types/IPlot";
import { firestore } from "@/config/firebase";
import { storiesRepo } from "@/services/StoriesRepo";

/**
 * Plot lines are one document per line with their events in a nested array
 * field, so every event write is a read-modify-write of the parent document.
 * All of those go through a transaction and reconcile by event id — a
 * concurrent edit to a *different* event in the same line must survive.
 */
class PlotService {
  private storiesCollection = collection(firestore, "stories");

  private plotRef(storyId: string, plotId: string) {
    const storyRef = doc(this.storiesCollection, storyId);
    return doc(collection(storyRef, "plots"), plotId);
  }

  async addPlot(storyId: string, plotName: string): Promise<string> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const plotsCollection = collection(storyRef, "plots");

      const story = await storiesRepo.getStory(storyId);
      if (!story) throw new Error("Story not found");

      const newPlotRef = doc(plotsCollection);
      const newPlot: PlotLine = {
        id: newPlotRef.id,
        name: plotName,
        description: "",
        events: [],
      };

      await setDoc(newPlotRef, newPlot);

      return newPlot.id;
    } catch (error) {
      console.error("Error adding plot:", error);
      throw error;
    }
  }

  /** Metadata-only write — deliberately never touches the events array. */
  async updatePlotMeta(
    storyId: string,
    plotId: string,
    meta: { name: string; description: string },
  ): Promise<void> {
    try {
      await updateDoc(this.plotRef(storyId, plotId), {
        name: meta.name,
        description: meta.description,
      });
    } catch (error) {
      console.error("Error updating plot:", error);
      throw error;
    }
  }

  async deletePlot(storyId: string, plotId: string): Promise<void> {
    try {
      await deleteDoc(this.plotRef(storyId, plotId));
    } catch (error) {
      console.error("Error deleting plot:", error);
      throw error;
    }
  }

  /**
   * Mints the event id here so no call site can invent its own scheme.
   * `arrayUnion` is already atomic, so this needs no transaction.
   */
  async addEvent(
    storyId: string,
    plotLineId: string,
    event: Omit<PlotEvent, "id">,
  ): Promise<PlotEvent> {
    try {
      const newEvent: PlotEvent = { ...event, id: crypto.randomUUID() };
      await updateDoc(this.plotRef(storyId, plotLineId), {
        events: arrayUnion(newEvent),
      });
      return newEvent;
    } catch (error) {
      console.error("Error adding event:", error);
      throw error;
    }
  }

  /** Splices only the matching event, leaving concurrent sibling edits intact. */
  async updateEvent(
    storyId: string,
    plotId: string,
    updatedEvent: PlotEvent,
  ): Promise<void> {
    const ref = this.plotRef(storyId, plotId);
    try {
      await runTransaction(firestore, async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) {
          throw new Error("Plot not found");
        }

        const events = (snapshot.data() as PlotLine).events ?? [];
        const index = events.findIndex((e) => e.id === updatedEvent.id);
        if (index === -1) {
          throw new Error("Event not found in the plot");
        }

        const next = [...events];
        next[index] = updatedEvent;
        tx.update(ref, { events: next });
      });
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }

  /**
   * Array-level rewrite for drag-reorder. `orderedIds` is applied to whatever
   * the document currently holds; events added since the caller's read are
   * appended rather than dropped.
   */
  async reorderEvents(
    storyId: string,
    plotId: string,
    orderedIds: string[],
  ): Promise<PlotEvent[]> {
    const ref = this.plotRef(storyId, plotId);
    try {
      return await runTransaction(firestore, async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) {
          throw new Error("Plot not found");
        }

        const current = (snapshot.data() as PlotLine).events ?? [];
        const byId = new Map(current.map((e) => [e.id, e]));

        const ordered = orderedIds
          .map((id) => byId.get(id))
          .filter((e): e is PlotEvent => e !== undefined);

        // Anything that appeared between the caller's read and this write.
        const seen = new Set(orderedIds);
        const appended = current.filter((e) => !seen.has(e.id));

        const next = [...ordered, ...appended].map((event, index) => ({
          ...event,
          orderIndex: index,
        }));

        tx.update(ref, { events: next });
        return next;
      });
    } catch (error) {
      console.error("Error reordering events:", error);
      throw error;
    }
  }

  /** Removes one event and renumbers the survivors, preserving concurrent adds. */
  async deleteEvent(
    storyId: string,
    plotId: string,
    eventId: string,
  ): Promise<PlotEvent[]> {
    const ref = this.plotRef(storyId, plotId);
    try {
      return await runTransaction(firestore, async (tx) => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) {
          throw new Error("Plot not found");
        }

        const events = (snapshot.data() as PlotLine).events ?? [];
        const next = events
          .filter((e) => e.id !== eventId)
          .map((event, index) => ({ ...event, orderIndex: index }));

        tx.update(ref, { events: next });
        return next;
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }

  async getPlots(storyId: string): Promise<PlotLine[]> {
    try {
      const plotsCollection = collection(
        this.storiesCollection,
        storyId,
        "plots",
      );
      const plotsSnapshot = await getDocs(plotsCollection);
      return plotsSnapshot.docs.map((doc) => doc.data() as PlotLine);
    } catch (error) {
      console.error("Error getting plots:", error);
      throw error;
    }
  }
}

export const plotService = new PlotService();
