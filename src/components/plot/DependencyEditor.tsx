import { useEffect, useState } from "react";
import { PlotEvent, EventDependency } from "@/types/IPlot";
import { plotService } from "@/services/PlotService";
import { X, Link, ArrowRight, Plus } from "lucide-react";

interface DependencyEditorProps {
  event: PlotEvent;
  plotLineId: string; // Used for context, kept for future SVG dependency lines
  storyId?: string;
  onUpdate: (
    dependencies: EventDependency[],
    dependents: EventDependency[],
  ) => void;
}

const RELATIONSHIP_TYPES: {
  value: EventDependency["relationshipType"];
  label: string;
  description: string;
}[] = [
  {
    value: "causes",
    label: "Causes",
    description: "This event directly causes the other",
  },
  {
    value: "requires",
    label: "Requires",
    description: "This event requires the other to happen first",
  },
  {
    value: "enables",
    label: "Enables",
    description: "This event makes the other possible",
  },
  {
    value: "blocks",
    label: "Blocks",
    description: "This event prevents the other from happening",
  },
  {
    value: "contradicts",
    label: "Contradicts",
    description: "These events cannot both be true",
  },
];

export const DependencyEditor: React.FC<DependencyEditorProps> = ({
  event,
  plotLineId: _plotLineId,
  storyId,
  onUpdate,
}) => {
  // _plotLineId reserved for future SVG dependency line rendering
  const [allEvents, setAllEvents] = useState<
    { plotLineId: string; plotLineName: string; event: PlotEvent }[]
  >([]);
  const [isAddingDependency, setIsAddingDependency] = useState(false);
  const [selectedPlotLine, setSelectedPlotLine] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRelationType, setSelectedRelationType] =
    useState<EventDependency["relationshipType"]>("causes");
  const [dependencyDescription, setDependencyDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (!storyId) {
        setLoading(false);
        return;
      }
      try {
        const events = await plotService.getAllEvents(storyId);
        // Filter out the current event
        setAllEvents(events.filter((e) => e.event.id !== event.id));
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [storyId, event.id]);

  const plotLines = [
    ...new Map(
      allEvents.map((e) => [
        e.plotLineId,
        { id: e.plotLineId, name: e.plotLineName },
      ]),
    ).values(),
  ];
  const eventsInSelectedPlotLine = allEvents.filter(
    (e) => e.plotLineId === selectedPlotLine,
  );

  const addDependency = () => {
    if (!selectedEventId || !selectedPlotLine) return;

    const newDependency: EventDependency = {
      eventId: selectedEventId,
      plotLineId: selectedPlotLine,
      relationshipType: selectedRelationType,
      description: dependencyDescription || undefined,
    };

    // Check if dependency already exists
    const exists = event.dependencies.some(
      (d) =>
        d.eventId === newDependency.eventId &&
        d.plotLineId === newDependency.plotLineId,
    );

    if (!exists) {
      onUpdate([...event.dependencies, newDependency], event.dependents);
    }

    // Reset form
    setIsAddingDependency(false);
    setSelectedPlotLine("");
    setSelectedEventId("");
    setSelectedRelationType("causes");
    setDependencyDescription("");
  };

  const removeDependency = (dep: EventDependency) => {
    onUpdate(
      event.dependencies.filter(
        (d) => !(d.eventId === dep.eventId && d.plotLineId === dep.plotLineId),
      ),
      event.dependents,
    );
  };

  const getEventName = (dep: EventDependency): string => {
    const found = allEvents.find(
      (e) => e.event.id === dep.eventId && e.plotLineId === dep.plotLineId,
    );
    return found ? found.event.name : "Unknown Event";
  };

  const getPlotLineName = (dep: EventDependency): string => {
    const found = allEvents.find((e) => e.plotLineId === dep.plotLineId);
    return found ? found.plotLineName : "Unknown Plot";
  };

  if (loading) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
        Loading events...
      </div>
    );
  }

  if (!storyId) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
        <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Story ID not available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Dependencies */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          This event depends on:
        </h4>
        {event.dependencies.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            No dependencies set
          </p>
        ) : (
          <div className="space-y-2">
            {event.dependencies.map((dep, index) => (
              <div
                key={`${dep.plotLineId}-${dep.eventId}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                    {dep.relationshipType}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getEventName(dep)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({getPlotLineName(dep)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDependency(dep)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events that depend on this one */}
      {event.dependents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Events that depend on this:
          </h4>
          <div className="space-y-2">
            {event.dependents.map((dep, index) => (
              <div
                key={`dep-${dep.plotLineId}-${dep.eventId}-${index}`}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                  {dep.relationshipType}
                </span>
                <ArrowRight className="w-4 h-4" />
                <span>{getEventName(dep)}</span>
                <span className="text-xs">({getPlotLineName(dep)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dependency Form */}
      {isAddingDependency ? (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Add Dependency
          </h4>

          {/* Plot Line Selection */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Plot Line
            </label>
            <select
              value={selectedPlotLine}
              onChange={(e) => {
                setSelectedPlotLine(e.target.value);
                setSelectedEventId("");
              }}
              className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select a plot line...</option>
              {plotLines.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Event Selection */}
          {selectedPlotLine && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
              >
                <option value="">Select an event...</option>
                {eventsInSelectedPlotLine.map((e) => (
                  <option key={e.event.id} value={e.event.id}>
                    {e.event.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Relationship Type */}
          {selectedEventId && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Relationship
                </label>
                <select
                  value={selectedRelationType}
                  onChange={(e) =>
                    setSelectedRelationType(
                      e.target.value as EventDependency["relationshipType"],
                    )
                  }
                  className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
                >
                  {RELATIONSHIP_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>
                      {rt.label} - {rt.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={dependencyDescription}
                  onChange={(e) => setDependencyDescription(e.target.value)}
                  placeholder="Describe the relationship..."
                  className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingDependency(false)}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addDependency}
              disabled={!selectedEventId}
              className="px-3 py-1.5 text-sm bg-dark-green dark:bg-light-green text-white rounded hover:bg-light-green dark:hover:bg-dark-green disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingDependency(true)}
          className="flex items-center gap-2 text-sm text-dark-green dark:text-light-green hover:underline"
        >
          <Plus className="w-4 h-4" />
          Add Dependency
        </button>
      )}
    </div>
  );
};
