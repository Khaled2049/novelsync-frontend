import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book,
  ChevronDown,
  PlusCircle,
  Trash2,
  TrendingUp,
  Users,
  MapPin,
  GripVertical,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from "@hello-pangea/dnd";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlotLineEditModal } from "./PlotlineEditModal";
import { EventEditModal } from "./EventEditModal";
import { TensionCurveChart } from "./TensionCurveChart";
import {
  PlotEvent,
  PlotLine,
  TemplateData,
  DEFAULT_PLOT_EVENT_VALUES,
} from "@/types/IPlot";
import { Character } from "@/types/ICharacter";
import { Place } from "@/types/IPlace";
import { plotService } from "@/services/PlotService";
import { characterService } from "@/services/CharacterService";
import { useParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";


// Helper to ensure event has all required fields with defaults
function ensureEventDefaults(
  event: Partial<PlotEvent> & { id: string; name: string; content: string },
  orderIndex: number,
): PlotEvent {
  return {
    ...DEFAULT_PLOT_EVENT_VALUES,
    ...event,
    characterIds: event.characterIds ?? [],
    locationId: event.locationId ?? null,
    dependencies: event.dependencies ?? [],
    dependents: event.dependents ?? [],
    tensionLevel: event.tensionLevel ?? 5,
    pacing: event.pacing ?? "moderate",
    storyBeat: event.storyBeat ?? "rising_action",
    orderIndex: event.orderIndex ?? orderIndex,
  };
}

// Tension color — semantic heat map
function getTensionColor(level: number): string {
  if (level <= 3) return "bg-emerald-500";
  if (level <= 5) return "bg-amber-500";
  if (level <= 7) return "bg-orange-500";
  return "bg-rose-500";
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

  const [showTensionChart, setShowTensionChart] = useState(false);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [places] = useState<Place[]>([]);

  useEffect(() => {
    loadPlots();
    if (storyId) {
      characterService
        .getCharacters(storyId)
        .then(setCharacters)
        .catch(() => {});
    }
  }, [storyId]);

  const loadPlots = async () => {
    if (!storyId) return;

    const plots = await plotService.getPlots(storyId);
    const migratedPlots = plots.map((plot) => ({
      ...plot,
      events: plot.events.map((event, index) =>
        ensureEventDefaults(event, index),
      ),
    }));
    setPlotLines(migratedPlots);

    const data = await plotService.loadTemplateData();
    setTemplates(data);
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

    const plotLine = plotLines.find((pl) => pl.id === plotLineId);
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
          : plotLine,
      ),
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
          plotLine.id === editingPlotLine.id ? editingPlotLine : plotLine,
        ),
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
        editingEvent.event,
      );
      setPlotLines(
        plotLines.map((plotLine) =>
          plotLine.id === editingEvent.plotLineId
            ? {
                ...plotLine,
                events: plotLine.events.map((event) =>
                  event.id === editingEvent.event.id
                    ? editingEvent.event
                    : event,
                ),
              }
            : plotLine,
        ),
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
      const url = new URL(
        "http://127.0.0.1:5001/story-6f89f/us-central1/createContext",
      );
      url.searchParams.set("storyId", storyId);
      const res = await fetch(url.toString());
      const data = await res.json();
      const generatedText = data.generatedText;
      console.log("Generated text:", generatedText);
    } catch (error) {
      console.error("Error generating plot text:", error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const plotLineId = source.droppableId;
    const plotLine = plotLines.find((pl) => pl.id === plotLineId);

    if (!plotLine) return;

    if (source.droppableId === destination.droppableId) {
      const newEvents = Array.from(plotLine.events);
      const [removed] = newEvents.splice(source.index, 1);
      newEvents.splice(destination.index, 0, removed);

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
        plotLines.map((pl) => (pl.id === plotLineId ? updatedPlotLine : pl)),
      );

      if (storyId) {
        await plotService.updatePlot(storyId, updatedPlotLine);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-ns-bg">
      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ns-border bg-ns-surface">
        {/* Page title */}
        <span className="font-heading italic text-lg text-ns-ink mr-2 hidden sm:block">
          Plot Timeline
        </span>

        <div className="w-px h-5 bg-ns-border hidden sm:block" />

        <button
          onClick={addPlotLine}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ns-accent text-white font-ui text-xs font-medium rounded-ns hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Plot Line
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="inline-flex items-center gap-1.5 h-auto px-3 py-1.5 bg-transparent border border-ns-border text-ns-ink-secondary font-ui text-xs font-normal rounded-ns hover:bg-ns-surface-hover hover:text-ns-ink transition-all duration-150 shadow-none"
            >
              <Book className="w-3.5 h-3.5" />
              Templates
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border border-ns-border bg-ns-elevated shadow-ns-lg rounded-ns-lg p-1 min-w-[200px]">
            {templates.map((template, idx) => (
              <DropdownMenuItem
                key={idx}
                onSelect={() => addPlotLineFromTemplate(template)}
                className="px-3 py-2 hover:bg-ns-surface-hover rounded-ns cursor-pointer font-ui text-sm text-ns-ink"
              >
                <span className="font-heading italic">{template.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setShowTensionChart(!showTensionChart)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-ui text-xs font-medium rounded-ns border transition-all duration-150 ${
            showTensionChart
              ? "bg-ns-accent border-ns-accent text-white"
              : "border-ns-border text-ns-ink-secondary hover:bg-ns-surface-hover hover:text-ns-ink"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Tension Curve
        </button>

        {/* Generate — pushed to right */}
        <button
          disabled={true}
          onClick={generateText}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 border border-ns-gold/40 text-ns-gold font-ui text-xs font-medium rounded-ns hover:bg-ns-gold/5 active:scale-[0.97] transition-all duration-150"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate Ideas
        </button>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4 max-w-5xl mx-auto">
          {/* Tension Curve Chart */}
          <AnimatePresence>
            {showTensionChart && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 border border-ns-border rounded-ns-lg bg-ns-elevated shadow-ns-sm">
                  <TensionCurveChart plotLines={plotLines} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plot Lines */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-4">
              {plotLines.map((plotLine) => (
                <div
                  key={plotLine.id}
                  className="border border-ns-border rounded-ns-lg overflow-hidden shadow-ns-sm"
                >
                  {/* Plot Line Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-ns-accent text-white">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      onClick={() => openEditPlotlineModal(plotLine)}
                    >
                      <h3 className="font-heading italic text-base font-normal truncate">
                        {plotLine.name}
                      </h3>
                      <span className="font-ui text-xs opacity-60 flex-shrink-0">
                        {plotLine.events.length} event
                        {plotLine.events.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => addEvent(plotLine.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-ns bg-white/20 hover:bg-white/30 font-ui text-xs transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Add Event
                      </button>
                      <button
                        onClick={() => removePlotline(plotLine.id)}
                        className="p-1.5 rounded-ns hover:bg-white/20 transition-colors"
                        aria-label="Delete plot line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Events Drop Zone */}
                  <Droppable droppableId={plotLine.id}>
                    {(
                      provided: DroppableProvided,
                      droppableSnapshot: DroppableStateSnapshot,
                    ) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 min-h-[80px] transition-colors duration-150 ${
                          droppableSnapshot.isDraggingOver
                            ? "bg-ns-accent-subtle"
                            : "bg-ns-bg"
                        }`}
                      >
                        {plotLine.events.length === 0 ? (
                          <div className="flex items-center justify-center h-16 font-ui text-xs text-ns-ink-muted">
                            No events yet — click "Add Event" to create one
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {plotLine.events.map((event, index) => {
                              const migratedEvent = ensureEventDefaults(
                                event,
                                index,
                              );

                              return (
                                <Draggable
                                  key={migratedEvent.id}
                                  draggableId={migratedEvent.id}
                                  index={index}
                                >
                                  {(
                                    provided: DraggableProvided,
                                    snapshot: DraggableStateSnapshot,
                                  ) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      style={provided.draggableProps.style}
                                      className={`flex items-center gap-3 bg-ns-elevated border rounded-ns p-3 cursor-pointer transition-all duration-150 ${
                                        snapshot.isDragging
                                          ? "border-ns-accent shadow-ns-xl ring-1 ring-ns-accent"
                                          : "border-ns-border hover:border-ns-border-strong hover:shadow-ns"
                                      }`}
                                      onClick={() =>
                                        openEditEventModal(
                                          plotLine.id,
                                          migratedEvent,
                                        )
                                      }
                                    >
                                      {/* Drag Handle */}
                                      <div
                                        {...provided.dragHandleProps}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-ns-ink-muted hover:text-ns-ink cursor-grab active:cursor-grabbing flex-shrink-0"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>

                                      {/* Index */}
                                      <span className="font-ui text-[10px] text-ns-ink-muted tabular-nums w-5 flex-shrink-0 text-right">
                                        {index + 1}
                                      </span>

                                      {/* Name & Content */}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-ui text-sm font-medium text-ns-ink truncate">
                                          {migratedEvent.name}
                                        </p>
                                        {migratedEvent.content && (
                                          <p className="font-ui text-xs text-ns-ink-secondary truncate mt-0.5">
                                            {migratedEvent.content}
                                          </p>
                                        )}
                                      </div>

                                      {/* Badges */}
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {/* Tension */}
                                        <span
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-ui text-[10px] font-semibold text-white ${getTensionColor(
                                            migratedEvent.tensionLevel,
                                          )}`}
                                        >
                                          {migratedEvent.tensionLevel}
                                        </span>

                                        {/* Story Beat */}
                                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full font-ui text-[10px] bg-ns-accent-subtle text-ns-accent capitalize">
                                          {migratedEvent.storyBeat.replace(
                                            "_",
                                            " ",
                                          )}
                                        </span>

                                        {/* Pacing */}
                                        <span
                                          className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full font-ui text-[10px] capitalize ${
                                            migratedEvent.pacing === "slow"
                                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                              : migratedEvent.pacing === "fast"
                                                ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
                                                : "bg-ns-surface text-ns-ink-secondary"
                                          }`}
                                        >
                                          {migratedEvent.pacing}
                                        </span>

                                        {/* Characters */}
                                        {migratedEvent.characterIds.length >
                                          0 && (
                                          <span className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-ui text-[10px] bg-ns-accent-subtle text-ns-accent">
                                            <Users className="w-3 h-3" />
                                            {migratedEvent.characterIds.length}
                                          </span>
                                        )}

                                        {/* Location */}
                                        {migratedEvent.locationId && (
                                          <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full font-ui text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
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

              {/* Empty state */}
              {plotLines.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4 animate-ns-fade-in">
                  <div className="w-16 h-16 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                    <Book className="w-7 h-7 text-ns-accent opacity-60" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="font-heading italic text-xl text-ns-ink-secondary">
                      No plot lines yet
                    </p>
                    <p className="font-ui text-sm text-ns-ink-muted">
                      Add a plot line or choose a template to structure your
                      story
                    </p>
                  </div>
                  <button
                    onClick={addPlotLine}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-ns-accent text-white font-ui text-sm font-medium rounded-ns hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150 shadow-ns-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Plot Line
                  </button>
                </div>
              )}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* ── Modals ── */}
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
    </div>
  );
};

export default PlotTimeline;
