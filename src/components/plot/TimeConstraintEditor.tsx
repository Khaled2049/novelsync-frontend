import { useEffect, useState } from "react";
import { TimeConstraint, PlotEvent } from "@/types/IPlot";
import { plotService } from "@/services/PlotService";
import { Calendar, Clock } from "lucide-react";

interface TimeConstraintEditorProps {
  constraint?: TimeConstraint;
  onChange: (constraint?: TimeConstraint) => void;
  storyId?: string;
  currentEventId: string;
}

const RELATIVE_POSITIONS: { value: 'before' | 'after' | 'same_time'; label: string }[] = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'same_time', label: 'At the same time as' },
];

export const TimeConstraintEditor: React.FC<TimeConstraintEditorProps> = ({
  constraint,
  onChange,
  storyId,
  currentEventId,
}) => {
  const [allEvents, setAllEvents] = useState<{ plotLineId: string; plotLineName: string; event: PlotEvent }[]>([]);
  const [constraintType, setConstraintType] = useState<'none' | 'absolute' | 'relative'>(
    constraint?.type || 'none'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      if (!storyId) {
        setLoading(false);
        return;
      }
      try {
        const events = await plotService.getAllEvents(storyId);
        setAllEvents(events.filter(e => e.event.id !== currentEventId));
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [storyId, currentEventId]);

  const handleTypeChange = (type: 'none' | 'absolute' | 'relative') => {
    setConstraintType(type);
    if (type === 'none') {
      onChange(undefined);
    } else if (type === 'absolute') {
      onChange({
        type: 'absolute',
        absoluteDate: '',
      });
    } else {
      onChange({
        type: 'relative',
        relativePosition: 'after',
        timeGap: '',
      });
    }
  };

  const updateConstraint = (updates: Partial<TimeConstraint>) => {
    if (!constraint) return;
    onChange({ ...constraint, ...updates });
  };

  const getEventLabel = (eventId: string): string => {
    const found = allEvents.find(e => e.event.id === eventId);
    return found ? `${found.event.name} (${found.plotLineName})` : 'Unknown Event';
  };

  if (loading) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Constraint Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Timeline Constraint
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['none', 'absolute', 'relative'] as const).map((type) => (
            <label
              key={type}
              className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                constraintType === type
                  ? 'border-dark-green dark:border-light-green bg-dark-green/10 dark:bg-light-green/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="constraintType"
                value={type}
                checked={constraintType === type}
                onChange={() => handleTypeChange(type)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {type === 'none' ? 'None' : type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Absolute Date Picker */}
      {constraintType === 'absolute' && constraint && (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Absolute Date/Time</span>
          </div>
          <input
            type="text"
            value={constraint.absoluteDate || ''}
            onChange={(e) => updateConstraint({ absoluteDate: e.target.value })}
            placeholder="e.g., 1985, 1985-06, 1985-06-15, or 'Summer of 1985'"
            className="w-full p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green transition-colors duration-200"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter a date (ISO format like 1985-06-15) or a descriptive time (e.g., "Late 1800s", "Summer of 1985")
          </p>
        </div>
      )}

      {/* Relative Position */}
      {constraintType === 'relative' && constraint && (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Relative to Another Event</span>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Position</label>
            <select
              value={constraint.relativePosition || 'after'}
              onChange={(e) => updateConstraint({ relativePosition: e.target.value as 'before' | 'after' | 'same_time' })}
              className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
            >
              {RELATIVE_POSITIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </select>
          </div>

          {/* Reference Event */}
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Reference Event</label>
            <select
              value={constraint.relativeToEventId || ''}
              onChange={(e) => updateConstraint({ relativeToEventId: e.target.value })}
              className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
            >
              <option value="">Select an event...</option>
              {allEvents.map((e) => (
                <option key={e.event.id} value={e.event.id}>
                  {e.event.name} ({e.plotLineName})
                </option>
              ))}
            </select>
          </div>

          {/* Time Gap */}
          {constraint.relativePosition !== 'same_time' && (
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time Gap (optional)</label>
              <input
                type="text"
                value={constraint.timeGap || ''}
                onChange={(e) => updateConstraint({ timeGap: e.target.value })}
                placeholder="e.g., '2 days later', 'moments before', '3 years after'"
                className="w-full p-2 text-sm border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-gray-800 text-black dark:text-white"
              />
            </div>
          )}

          {constraint.relativeToEventId && (
            <div className="text-sm text-gray-600 dark:text-gray-400 italic">
              This event happens{' '}
              {constraint.timeGap ? constraint.timeGap : constraint.relativePosition === 'same_time' ? 'at the same time as' : constraint.relativePosition}{' '}
              "{getEventLabel(constraint.relativeToEventId)}"
            </div>
          )}
        </div>
      )}

      {constraintType === 'none' && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No timeline constraint. This event's position is determined only by its order in the plot line.
        </p>
      )}
    </div>
  );
};
