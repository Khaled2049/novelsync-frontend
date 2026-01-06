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
}

export const plotService = new PlotService();
