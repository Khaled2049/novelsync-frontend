import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, ChevronDown, PlusCircle, Trash2, TrendingUp, Users, MapPin, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlotLineEditModal } from "./PlotlineEditModal";
import { EventEditModal } from "./EventEditModal";
import { TensionCurveChart } from "./TensionCurveChart";
import { PlotEvent, PlotLine, TemplateData, DEFAULT_PLOT_EVENT_VALUES } from "@/types/IPlot";
import { Character } from "@/types/ICharacter";
import { Place } from "@/types/IPlace";
import { plotService } from "@/services/PlotService";
import { useParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import axios from "axios";

// Helper to ensure event has all required fields with defaults
function ensureEventDefaults(event: Partial<PlotEvent> & { id: string; name: string; content: string }, orderIndex: number): PlotEvent {
  return {
    ...DEFAULT_PLOT_EVENT_VALUES,
    ...event,
    characterIds: event.characterIds ?? [],
    locationId: event.locationId ?? null,
    dependencies: event.dependencies ?? [],
    dependents: event.dependents ?? [],
    tensionLevel: event.tensionLevel ?? 5,
    pacing: event.pacing ?? 'moderate',
    storyBeat: event.storyBeat ?? 'rising_action',
    orderIndex: event.orderIndex ?? orderIndex,
  };
}

// Get tension color for badge
function getTensionColor(level: number): string {
  if (level <= 3) return 'bg-green-500';
  if (level <= 5) return 'bg-yellow-500';
  if (level <= 7) return 'bg-orange-500';
  return 'bg-red-500';
}

const PlotTimeline: React.FC = () => {
  const [plotLines, setPlotLines] = useState<PlotLine[]>([]);
  const { storyId } = useParams<{ storyId: string }>();
  const { user } = useAuthContext();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isPlotLineModalOpen, setisPlotLineModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingPlotLine, setEditingPlotLine] = useState<PlotLine | null>(null);
  const [editingEvent, setEditingEvent] = useState<{
    plotLineId: string;
    event: PlotEvent;
  } | null>(null);

  // New state for tension chart visibility
  const [showTensionChart, setShowTensionChart] = useState(false);

  // Placeholder state for characters and places (would come from their respective services)
  const [characters] = useState<Character[]>([]);
  const [places] = useState<Place[]>([]);

  useEffect(() => {
    loadPlots();
  }, [storyId]);

  const loadPlots = async () => {
    if (!storyId) return;

    const plots = await plotService.getPlots(storyId);
    // Migrate events to ensure they have all required fields
    const migratedPlots = plots.map(plot => ({
      ...plot,
      events: plot.events.map((event, index) => ensureEventDefaults(event, index)),
    }));
    setPlotLines(migratedPlots);

    const data = await plotService.loadTemplateData();
    setTemplates(data);

    // TODO: Load characters and places from their respective services
    // setCharacters(await characterService.getCharacters(storyId));
    // setPlaces(await placeService.getPlaces(storyId));
  };

  const addPlotLine = async () => {
    if (!storyId) return;

    const plotId = await plotService.addPlot(storyId, "New PlotLine");
    setPlotLines([
      ...plotLines,
      {
        id: plotId,
        name: "New PlotLine",
        description: "",
        events: [],
      },
    ]);
  };

  const addEvent = async (plotLineId: string) => {
    if (!storyId || !user?.uid) return;

    const plotLine = plotLines.find(pl => pl.id === plotLineId);
    const orderIndex = plotLine ? plotLine.events.length : 0;

    const newEvent: PlotEvent = {
      ...DEFAULT_PLOT_EVENT_VALUES,
      id: new Date().getTime().toString(),
      name: "New Event",
      content: "",
      orderIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user.uid,
    };

    const eventId = await plotService.addEvent(storyId, plotLineId, newEvent);
    setPlotLines(
      plotLines.map((plotLine) =>
        plotLine.id === plotLineId
          ? {
              ...plotLine,
              events: [
                ...plotLine.events,
                { ...newEvent, id: eventId } as PlotEvent,
              ],
            }
          : plotLine
      )
    );
  };

  const removePlotline = async (plotLineId: string) => {
    if (!storyId) return;
    await plotService.deletePlot(storyId, plotLineId);
    setPlotLines(plotLines.filter((plotLine) => plotLine.id !== plotLineId));
  };

  const handleSavePlotLineModal = async () => {
    if (!storyId || !editingPlotLine) return;
    await plotService.updatePlot(storyId, editingPlotLine);
    if (editingPlotLine) {
      setPlotLines(
        plotLines.map((plotLine) =>
          plotLine.id === editingPlotLine.id ? editingPlotLine : plotLine
        )
      );
      closeEditPlotLineModal();
    }
  };

  const handleSaveEvent = async () => {
    if (!storyId || !editingEvent) return;

    if (editingEvent) {
      await plotService.updateEvent(
        storyId,
        editingEvent.plotLineId,
        editingEvent.event
      );
      setPlotLines(
        plotLines.map((plotLine) =>
          plotLine.id === editingEvent.plotLineId
            ? {
                ...plotLine,
                events: plotLine.events.map((event) =>
                  event.id === editingEvent.event.id
                    ? editingEvent.event
                    : event
                ),
              }
            : plotLine
        )
      );
      closeEditEventModal();
    }
  };

  const openEditPlotlineModal = (plotLine: PlotLine) => {
    setEditingPlotLine(plotLine);
    setisPlotLineModalOpen(true);
  };

  const closeEditPlotLineModal = () => {
    setisPlotLineModalOpen(false);
    setEditingPlotLine(null);
  };

  const openEditEventModal = (plotLineId: string, event: PlotEvent) => {
    const migratedEvent = ensureEventDefaults(event, event.orderIndex ?? 0);
    setEditingEvent({ plotLineId, event: { ...migratedEvent } });
    setIsEventModalOpen(true);
  };

  const closeEditEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const addPlotLineFromTemplate = async (template: TemplateData) => {
    if (!storyId || !user) {
      console.error("No storyId or user provided");
      return;
    }

    try {
      const plotId = await plotService.addPlot(storyId, template.name);

      const eventPromises = template.events.map((e, idx) => {
        const plotEvent: PlotEvent = {
          ...DEFAULT_PLOT_EVENT_VALUES,
          id: idx.toString(),
          content: e.content,
          name: e.name,
          orderIndex: idx,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: user.uid,
        };
        return plotService.addEvent(storyId, plotId, plotEvent);
      });

      await Promise.all(eventPromises);
      loadPlots();
    } catch (error) {
      console.error("Error adding plot line from template:", error);
      throw error;
    }
  };

  const generateText = async () => {
    if (!storyId) {
      console.error("No storyId provided");
      return;
    }

    try {
      const response = await axios.get(
        `http://127.0.0.1:5001/novelsync-f82ec/us-central1/createContext`,
        {
          params: {
            storyId: storyId,
          },
        }
      );

      const generatedText = response.data.generatedText;
      console.log("Generated text:", generatedText);
    } catch (error) {
      console.error("Error generating plot text:", error);
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) return;

    // Same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const plotLineId = source.droppableId;
    const plotLine = plotLines.find((pl) => pl.id === plotLineId);

    if (!plotLine) return;

    // Reorder within the same plot line
    if (source.droppableId === destination.droppableId) {
      const newEvents = Array.from(plotLine.events);
      const [removed] = newEvents.splice(source.index, 1);
      newEvents.splice(destination.index, 0, removed);

      // Update orderIndex for all events
      const updatedEvents = newEvents.map((event, index) => ({
        ...event,
        orderIndex: index,
        updatedAt: new Date().toISOString(),
      }));

      const updatedPlotLine = {
        ...plotLine,
        events: updatedEvents,
      };

      setPlotLines(
        plotLines.map((pl) =>
          pl.id === plotLineId ? updatedPlotLine : pl
        )
      );

      // Persist to backend
      if (storyId) {
        await plotService.updatePlot(storyId, updatedPlotLine);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 bg-neutral-50 dark:bg-black transition-colors duration-200">
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={addPlotLine}
          className="py-2 px-4 rounded-sm bg-dark-green dark:bg-light-green text-white flex items-center justify-center hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
        >
          Add Plot
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-neutral-50/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
            >
              <Book className="mr-2 h-4 w-4 text-dark-green dark:text-light-green" />
              Plot Templates
              <ChevronDown className="ml-2 h-4 w-4 text-black dark:text-white" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-black/20 dark:border-white/20 bg-neutral-50 dark:bg-black shadow-lg rounded-md p-1 min-w-[200px]">
            {templates.map((template, idx) => (
              <DropdownMenuItem
                key={idx}
                onSelect={() => addPlotLineFromTemplate(template)}
                className="px-4 py-2 hover:bg-black/10 dark:hover:bg-neutral-50/10 rounded-sm cursor-pointer transition-colors duration-150 ease-in-out text-black dark:text-white"
              >
                <span className="font-serif">{template.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setShowTensionChart(!showTensionChart)}
          className={`py-2 px-4 rounded-sm flex items-center gap-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 ${
            showTensionChart
              ? 'bg-dark-green dark:bg-light-green text-white'
              : 'bg-black/10 dark:bg-neutral-50/10 text-black dark:text-white hover:bg-black/20 dark:hover:bg-neutral-50/20'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Tension Curve
        </button>
      </div>

      {/* Tension Curve Chart */}
      <AnimatePresence>
        {showTensionChart && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
              <TensionCurveChart plotLines={plotLines} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {plotLines.map((plotLine) => (
            <div
              key={plotLine.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Plot Line Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-light-green dark:bg-dark-green text-white">
                <div
                  className="flex items-center gap-2 cursor-pointer flex-1"
                  onClick={() => openEditPlotlineModal(plotLine)}
                >
                  <h3 className="font-semibold">{plotLine.name}</h3>
                  <span className="text-xs opacity-70">
                    ({plotLine.events.length} event{plotLine.events.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addEvent(plotLine.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors text-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Event
                  </button>
                  <button
                    onClick={() => removePlotline(plotLine.id)}
                    className="p-1.5 rounded hover:bg-white/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Events List */}
              <Droppable droppableId={plotLine.id}>
                {(provided, droppableSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-4 min-h-[80px] ${
                      droppableSnapshot.isDraggingOver
                        ? 'bg-dark-green/5 dark:bg-light-green/5'
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    {plotLine.events.length === 0 ? (
                      <div className="flex items-center justify-center h-16 text-gray-400 dark:text-gray-500 text-sm">
                        No events yet. Click "Add Event" to create one.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {plotLine.events.map((event, index) => {
                          const migratedEvent = ensureEventDefaults(event, index);

                          return (
                            <Draggable
                              key={migratedEvent.id}
                              draggableId={migratedEvent.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  style={provided.draggableProps.style}
                                  className={`flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md hover:border-dark-green dark:hover:border-light-green transition-all ${
                                    snapshot.isDragging ? 'shadow-xl ring-2 ring-dark-green dark:ring-light-green' : ''
                                  }`}
                                  onClick={() => openEditEventModal(plotLine.id, migratedEvent)}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0"
                                  >
                                    <GripVertical className="w-5 h-5" />
                                  </div>

                                  {/* Event Number */}
                                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-8 flex-shrink-0">
                                    #{index + 1}
                                  </span>

                                  {/* Event Name & Content */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                      {migratedEvent.name}
                                    </h4>
                                    {migratedEvent.content && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {migratedEvent.content}
                                      </p>
                                    )}
                                  </div>

                                  {/* Metadata Badges */}
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Tension Badge */}
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTensionColor(
                                        migratedEvent.tensionLevel
                                      )} text-white`}
                                    >
                                      {migratedEvent.tensionLevel}
                                    </span>

                                    {/* Story Beat */}
                                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                      {migratedEvent.storyBeat.replace('_', ' ')}
                                    </span>

                                    {/* Pacing */}
                                    <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                      migratedEvent.pacing === 'slow' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                      migratedEvent.pacing === 'fast' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                    }`}>
                                      {migratedEvent.pacing}
                                    </span>

                                    {/* Characters Count */}
                                    {migratedEvent.characterIds.length > 0 && (
                                      <span className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                        <Users className="w-3 h-3" />
                                        {migratedEvent.characterIds.length}
                                      </span>
                                    )}

                                    {/* Location */}
                                    {migratedEvent.locationId && (
                                      <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                        <MapPin className="w-3 h-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {plotLines.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Book className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No plot lines yet.</p>
              <p className="text-sm">Click "Add Plot" or choose a template to get started.</p>
            </div>
          )}
        </div>
      </DragDropContext>

      <PlotLineEditModal
        isOpen={isPlotLineModalOpen}
        onClose={closeEditPlotLineModal}
        onSave={handleSavePlotLineModal}
        editingPlotLine={editingPlotLine}
        setEditingPlotLine={setEditingPlotLine}
      />

      <EventEditModal
        isOpen={isEventModalOpen}
        onClose={closeEditEventModal}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
        characters={characters}
        places={places}
      />

      <div className="flex mt-4">
        <button
          onClick={generateText}
          className="py-2 px-4 rounded-sm bg-dark-green dark:bg-light-green text-white flex items-center justify-center hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
        >
          Generate Plot Ideas
        </button>
      </div>
    </div>
  );
};

export default PlotTimeline;
