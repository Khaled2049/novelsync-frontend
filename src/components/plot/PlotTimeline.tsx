import React, { useEffect, useRef, useState } from "react";
import { Book, ChevronDown, PlusCircle, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { PlotLineEditModal } from "./PlotlineEditModal";
import { EventEditModal } from "./EventEditModal";
import PlotGrid from "./PlotGrid";
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
import { placeService } from "@/services/PlaceService";
import { useParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useDemoMode } from "@/contexts/DemoModeContext";

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

const PlotTimeline: React.FC = () => {
  const [plotLines, setPlotLines] = useState<PlotLine[]>([]);
  const { storyId } = useParams<{ storyId: string }>();
  const { user } = useAuthContext();
  const { requireAuth } = useDemoMode();

  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isPlotLineModalOpen, setisPlotLineModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingPlotLine, setEditingPlotLine] = useState<PlotLine | null>(null);
  const [editingEvent, setEditingEvent] = useState<{
    plotLineId: string;
    event: PlotEvent;
  } | null>(null);

  const [activePlotLineId, setActivePlotLineId] = useState<string | null>(null);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  // Debounced per-plotline persistence for inline cell edits
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    loadPlots();
    if (storyId) {
      characterService
        .getCharacters(storyId)
        .then(setCharacters)
        .catch(() => {});
      placeService
        .getPlaces(storyId)
        .then(setPlaces)
        .catch(() => {});
    }
  }, [storyId]);

  // Keep an active plotline selected as the list changes
  useEffect(() => {
    if (plotLines.length === 0) {
      setActivePlotLineId(null);
      return;
    }
    if (!activePlotLineId || !plotLines.some((p) => p.id === activePlotLineId)) {
      setActivePlotLineId(plotLines[0].id);
    }
  }, [plotLines, activePlotLineId]);

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

  const persistPlotLine = (plotLine: PlotLine) => {
    if (!storyId) return;
    if (saveTimers.current[plotLine.id]) {
      clearTimeout(saveTimers.current[plotLine.id]);
    }
    saveTimers.current[plotLine.id] = setTimeout(() => {
      plotService
        .updatePlot(storyId, plotLine)
        .catch((e) => console.error("Error saving plot line:", e));
    }, 600);
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
    setActivePlotLineId(plotId);
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

  // Inline cell edit — optimistic local update + debounced atomic save
  const updateEventInline = (plotLineId: string, updatedEvent: PlotEvent) => {
    const next = plotLines.map((pl) =>
      pl.id === plotLineId
        ? {
            ...pl,
            events: pl.events.map((ev) =>
              ev.id === updatedEvent.id
                ? { ...updatedEvent, updatedAt: new Date().toISOString() }
                : ev,
            ),
          }
        : pl,
    );
    setPlotLines(next);
    const updated = next.find((pl) => pl.id === plotLineId);
    if (updated) persistPlotLine(updated);
  };

  const deleteEvent = (plotLineId: string, eventId: string) => {
    if (!storyId) return;
    const plotLine = plotLines.find((pl) => pl.id === plotLineId);
    if (!plotLine) return;

    const updated: PlotLine = {
      ...plotLine,
      events: plotLine.events
        .filter((ev) => ev.id !== eventId)
        .map((ev, idx) => ({ ...ev, orderIndex: idx })),
    };
    setPlotLines(plotLines.map((pl) => (pl.id === plotLineId ? updated : pl)));
    plotService
      .updatePlot(storyId, updated)
      .catch((e) => console.error("Error deleting plot point:", e));
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
      setActivePlotLineId(plotId);
      loadPlots();
    } catch (error) {
      console.error("Error adding plot line from template:", error);
      throw error;
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

  const activePlotLine =
    plotLines.find((pl) => pl.id === activePlotLineId) ?? null;

  return (
    <div className="h-full flex flex-col bg-ns-bg">
      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-4 py-3 border-b border-ns-border bg-ns-surface overflow-x-auto">
        {/* Page title */}
        <span className="font-heading italic text-lg text-ns-ink mr-2 hidden sm:block">
          Plot Grid
        </span>

        <div className="w-px h-5 bg-ns-border hidden sm:block" />

        <button
          onClick={() => {
            if (requireAuth()) addPlotLine();
          }}
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
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4 max-w-6xl mx-auto">
          {plotLines.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-ns-fade-in">
              <div className="w-16 h-16 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                <Book className="w-7 h-7 text-ns-accent opacity-60" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="font-heading italic text-xl text-ns-ink-secondary">
                  No plot lines yet
                </p>
                <p className="font-ui text-sm text-ns-ink-muted">
                  Add a plot line or choose a template to structure your story
                </p>
              </div>
              <button
                onClick={() => {
                  if (requireAuth()) addPlotLine();
                }}
                className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 bg-ns-accent text-white font-ui text-sm font-medium rounded-ns hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150 shadow-ns-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add Plot Line
              </button>
            </div>
          ) : (
            <>
              {/* Plot line switcher */}
              <div className="flex items-center gap-1 overflow-x-auto border-b border-ns-border">
                {plotLines.map((pl) => {
                  const active = pl.id === activePlotLineId;
                  return (
                    <button
                      key={pl.id}
                      onClick={() => setActivePlotLineId(pl.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 font-ui text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                        active
                          ? "border-ns-accent text-ns-accent font-medium"
                          : "border-transparent text-ns-ink-secondary hover:text-ns-ink"
                      }`}
                    >
                      <span className="font-heading italic">{pl.name}</span>
                      <span className="font-ui text-[10px] tabular-nums opacity-60">
                        {pl.events.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activePlotLine && (
                <div className="space-y-3">
                  {/* Active plot line header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-heading italic text-lg text-ns-ink truncate">
                        {activePlotLine.name}
                      </h3>
                      {activePlotLine.description && (
                        <p className="font-ui text-xs text-ns-ink-secondary truncate">
                          {activePlotLine.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => openEditPlotlineModal(activePlotLine)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-ns border border-ns-border text-ns-ink-secondary font-ui text-xs hover:bg-ns-surface-hover hover:text-ns-ink transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => removePlotline(activePlotLine.id)}
                        className="p-1.5 rounded-ns border border-ns-border text-ns-ink-muted hover:text-ns-destructive hover:bg-ns-surface-hover transition-colors"
                        aria-label="Delete plot line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Grid */}
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <PlotGrid
                      plotLine={activePlotLine}
                      onUpdateEvent={(ev) =>
                        updateEventInline(activePlotLine.id, ev)
                      }
                      onDeleteEvent={(id) =>
                        deleteEvent(activePlotLine.id, id)
                      }
                      onAddEvent={() => {
                        if (requireAuth()) addEvent(activePlotLine.id);
                      }}
                      onOpenEditor={(ev) =>
                        openEditEventModal(activePlotLine.id, ev)
                      }
                    />
                  </DragDropContext>
                </div>
              )}
            </>
          )}
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
