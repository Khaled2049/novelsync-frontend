import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  PlotEvent,
  PlotLine,
  TemplateData,
  PLOT_TEMPLATES,
  EventDependency,
  DEFAULT_PLOT_EVENT_VALUES,
} from "@/types/IPlot";
import { firestore } from "@/config/firebase";
import { storiesRepo } from "@/services/StoriesRepo";

class PlotService {
  private storiesCollection = collection(firestore, "stories");

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

  async updatePlot(storyId: string, plot: PlotLine): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const plotRef = doc(collection(storyRef, "plots"), plot.id);
      await setDoc(plotRef, plot);
    } catch (error) {
      console.error("Error updating plot:", error);
      throw error;
    }
  }

  async deletePlot(storyId: string, plotId: string): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const plotRef = doc(collection(storyRef, "plots"), plotId);
      await deleteDoc(plotRef);
    } catch (error) {
      console.error("Error deleting plot:", error);
      throw error;
    }
  }

  async addEvent(storyId: string, plotLineId: string, event: PlotEvent) {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const plotRef = doc(collection(storyRef, "plots"), plotLineId);

      await updateDoc(plotRef, {
        events: arrayUnion(event),
      });

      return event.id;
    } catch (error) {
      console.error("Error adding event:", error);
      throw error;
    }
  }

  // Given plotId and eventId, it should update the event in the plot.
  async updateEvent(
    storyId: string,
    plotId: string,
    updatedEvent: PlotEvent
  ): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const plotRef = doc(collection(storyRef, "plots"), plotId);

      // First, get the current plot data
      const plotSnapshot = await getDoc(plotRef);
      if (!plotSnapshot.exists()) {
        throw new Error("Plot not found");
      }

      const plotData = plotSnapshot.data() as PlotLine;

      // Find the index of the event to update
      const eventIndex = plotData.events.findIndex(
        (event) => event.id === updatedEvent.id
      );

      if (eventIndex === -1) {
        throw new Error("Event not found in the plot");
      }

      // Update the event in the events array
      plotData.events[eventIndex] = updatedEvent;

      // Update the entire plot document with the modified events array
      await setDoc(plotRef, plotData);
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }

  async getPlots(storyId: string): Promise<PlotLine[]> {
    try {
      const plotsCollection = collection(
        this.storiesCollection,
        storyId,
        "plots"
      );
      const plotsSnapshot = await getDocs(plotsCollection);
      return plotsSnapshot.docs.map((doc) => doc.data() as PlotLine);
    } catch (error) {
      console.error("Error getting plots:", error);
      throw error;
    }
  }

  async loadTemplateData(): Promise<TemplateData[]> {
    return PLOT_TEMPLATES;
  }

  // Migrate a legacy event to the new format with default values
  migrateEvent(event: Partial<PlotEvent> & { id: string; name: string; content: string }, orderIndex: number): PlotEvent {
    return {
      ...DEFAULT_PLOT_EVENT_VALUES,
      ...event,
      orderIndex: event.orderIndex ?? orderIndex,
      characterIds: event.characterIds ?? [],
      locationId: event.locationId ?? null,
      dependencies: event.dependencies ?? [],
      dependents: event.dependents ?? [],
      tensionLevel: event.tensionLevel ?? 5,
      pacing: event.pacing ?? 'moderate',
      storyBeat: event.storyBeat ?? 'rising_action',
      updatedAt: new Date().toISOString(),
    };
  }

  // Add a dependency between two events
  async addEventDependency(
    storyId: string,
    sourceEvent: { plotLineId: string; eventId: string },
    targetEvent: { plotLineId: string; eventId: string },
    relationshipType: EventDependency['relationshipType'],
    description?: string
  ): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);

      // Get both plot lines
      const sourcePlotRef = doc(collection(storyRef, "plots"), sourceEvent.plotLineId);
      const targetPlotRef = doc(collection(storyRef, "plots"), targetEvent.plotLineId);

      const [sourcePlotSnapshot, targetPlotSnapshot] = await Promise.all([
        getDoc(sourcePlotRef),
        getDoc(targetPlotRef),
      ]);

      if (!sourcePlotSnapshot.exists() || !targetPlotSnapshot.exists()) {
        throw new Error("Plot line not found");
      }

      const sourcePlotData = sourcePlotSnapshot.data() as PlotLine;
      const targetPlotData = targetPlotSnapshot.data() as PlotLine;

      // Find the events
      const sourceEventIndex = sourcePlotData.events.findIndex(e => e.id === sourceEvent.eventId);
      const targetEventIndex = targetPlotData.events.findIndex(e => e.id === targetEvent.eventId);

      if (sourceEventIndex === -1 || targetEventIndex === -1) {
        throw new Error("Event not found");
      }

      // Create dependency objects
      const dependencyForSource: EventDependency = {
        eventId: targetEvent.eventId,
        plotLineId: targetEvent.plotLineId,
        relationshipType,
        description,
      };

      const dependentForTarget: EventDependency = {
        eventId: sourceEvent.eventId,
        plotLineId: sourceEvent.plotLineId,
        relationshipType,
        description,
      };

      // Update source event's dependencies
      const sourceEventData = this.migrateEvent(sourcePlotData.events[sourceEventIndex], sourceEventIndex);
      sourceEventData.dependencies = [...sourceEventData.dependencies, dependencyForSource];
      sourcePlotData.events[sourceEventIndex] = sourceEventData;

      // Update target event's dependents
      const targetEventData = this.migrateEvent(targetPlotData.events[targetEventIndex], targetEventIndex);
      targetEventData.dependents = [...targetEventData.dependents, dependentForTarget];
      targetPlotData.events[targetEventIndex] = targetEventData;

      // Save both plot lines
      if (sourceEvent.plotLineId === targetEvent.plotLineId) {
        // Same plot line, save once
        await setDoc(sourcePlotRef, sourcePlotData);
      } else {
        // Different plot lines, save both
        await Promise.all([
          setDoc(sourcePlotRef, sourcePlotData),
          setDoc(targetPlotRef, targetPlotData),
        ]);
      }
    } catch (error) {
      console.error("Error adding event dependency:", error);
      throw error;
    }
  }

  // Remove a dependency between two events
  async removeEventDependency(
    storyId: string,
    sourceEvent: { plotLineId: string; eventId: string },
    targetEvent: { plotLineId: string; eventId: string }
  ): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);

      const sourcePlotRef = doc(collection(storyRef, "plots"), sourceEvent.plotLineId);
      const targetPlotRef = doc(collection(storyRef, "plots"), targetEvent.plotLineId);

      const [sourcePlotSnapshot, targetPlotSnapshot] = await Promise.all([
        getDoc(sourcePlotRef),
        getDoc(targetPlotRef),
      ]);

      if (!sourcePlotSnapshot.exists() || !targetPlotSnapshot.exists()) {
        throw new Error("Plot line not found");
      }

      const sourcePlotData = sourcePlotSnapshot.data() as PlotLine;
      const targetPlotData = targetPlotSnapshot.data() as PlotLine;

      const sourceEventIndex = sourcePlotData.events.findIndex(e => e.id === sourceEvent.eventId);
      const targetEventIndex = targetPlotData.events.findIndex(e => e.id === targetEvent.eventId);

      if (sourceEventIndex === -1 || targetEventIndex === -1) {
        throw new Error("Event not found");
      }

      // Remove from source's dependencies
      const sourceEventData = this.migrateEvent(sourcePlotData.events[sourceEventIndex], sourceEventIndex);
      sourceEventData.dependencies = sourceEventData.dependencies.filter(
        d => !(d.eventId === targetEvent.eventId && d.plotLineId === targetEvent.plotLineId)
      );
      sourcePlotData.events[sourceEventIndex] = sourceEventData;

      // Remove from target's dependents
      const targetEventData = this.migrateEvent(targetPlotData.events[targetEventIndex], targetEventIndex);
      targetEventData.dependents = targetEventData.dependents.filter(
        d => !(d.eventId === sourceEvent.eventId && d.plotLineId === sourceEvent.plotLineId)
      );
      targetPlotData.events[targetEventIndex] = targetEventData;

      if (sourceEvent.plotLineId === targetEvent.plotLineId) {
        await setDoc(sourcePlotRef, sourcePlotData);
      } else {
        await Promise.all([
          setDoc(sourcePlotRef, sourcePlotData),
          setDoc(targetPlotRef, targetPlotData),
        ]);
      }
    } catch (error) {
      console.error("Error removing event dependency:", error);
      throw error;
    }
  }

  // Get all events across all plot lines for a story (useful for dependency selection)
  async getAllEvents(storyId: string): Promise<{ plotLineId: string; plotLineName: string; event: PlotEvent }[]> {
    try {
      const plots = await this.getPlots(storyId);
      const allEvents: { plotLineId: string; plotLineName: string; event: PlotEvent }[] = [];

      for (const plot of plots) {
        for (let i = 0; i < plot.events.length; i++) {
          allEvents.push({
            plotLineId: plot.id,
            plotLineName: plot.name,
            event: this.migrateEvent(plot.events[i], i),
          });
        }
      }

      return allEvents;
    } catch (error) {
      console.error("Error getting all events:", error);
      throw error;
    }
  }
}

export const plotService = new PlotService();
