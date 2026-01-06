// EventEditModal.tsx
import { PlotEvent } from "@/types/IPlot";
import { useEffect } from "react";

interface EventEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingEvent: { plotLineId: string; event: PlotEvent } | null;
  setEditingEvent: (
    event: { plotLineId: string; event: PlotEvent } | null
  ) => void;
}

export const EventEditModal: React.FC<EventEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEvent,
  setEditingEvent,
}) => {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !editingEvent) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/50 flex justify-center items-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-neutral-50 dark:bg-black p-6 rounded-lg shadow-xl w-full max-w-lg transition-colors duration-200 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Edit Event
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="event"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Event
            </label>
            <input
              id="event"
              type="text"
              value={editingEvent.event.name}
              onChange={(e) =>
                setEditingEvent({
                  ...editingEvent,
                  event: { ...editingEvent.event, name: e.target.value },
                })
              }
              className="w-full p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green transition-colors duration-200"
              required
            />
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              value={editingEvent.event.content}
              onChange={(e) =>
                setEditingEvent({
                  ...editingEvent,
                  event: { ...editingEvent.event, content: e.target.value },
                })
              }
              rows={6}
              className="w-full p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green transition-colors duration-200 resize-y"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-black/10 dark:bg-neutral-50/10 text-black dark:text-white px-4 py-2 rounded hover:bg-black/20 dark:hover:bg-neutral-50/20 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-dark-green dark:bg-light-green text-white px-4 py-2 rounded hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
