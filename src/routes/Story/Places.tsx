import React, { useEffect, useState } from "react";
import { Place } from "@/types/IPlace";
import AddPlaceModal from "@/components/places/AddPlaceModal";
import { placeService } from "@/services/PlaceService";
import { useParams } from "react-router-dom";
import UpdatePlaceModal from "@/components/places/UpdatePlaceModal";
import { MapPin, MapPinPlus, Map, Pencil, Trash2 } from "lucide-react";

const Places: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [placeToUpdate, setPlaceToUpdate] = useState<Place | null>(null);

  useEffect(() => {
    loadPlaces();
  }, [storyId]);

  const loadPlaces = async () => {
    if (!storyId) return;
    const data = await placeService.getPlaces(storyId);
    setPlaces(data);
  };

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleAddPlace = (newPlace: Place) => {
    setPlaces((prev) => [...prev, newPlace]);
    setIsAddModalOpen(false);
  };

  const handleUpdatePlace = (updatedPlace: Place) => {
    setPlaces((prev) =>
      prev.map((p) => (p.id === updatedPlace.id ? updatedPlace : p))
    );
    setIsUpdateModalOpen(false);
    setPlaceToUpdate(null);
    if (selectedPlace?.id === updatedPlace.id) {
      setSelectedPlace(updatedPlace);
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!storyId) return;
    try {
      await placeService.deletePlace(storyId, placeId);
      setPlaces((prev) => prev.filter((p) => p.id !== placeId));
      if (selectedPlace?.id === placeId) setSelectedPlace(null);
    } catch (error) {
      console.error("Error deleting place:", error);
    }
  };

  if (!storyId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="font-ui text-sm text-ns-ink-muted">
          Story ID not found. Please check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-ns-bg">

      {/* ── Toolbar ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-ns-border bg-ns-surface">
        <div className="flex items-center gap-2.5">
          <span className="font-heading italic text-lg text-ns-ink">Places</span>
          {places.length > 0 && (
            <span className="font-ui text-[10px] font-semibold text-ns-accent bg-ns-accent-subtle px-2 py-0.5 rounded-full">
              {places.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ns-accent text-white font-ui text-xs font-medium rounded-ns hover:bg-ns-accent-hover active:scale-[0.97] transition-all duration-150"
        >
          <MapPinPlus className="w-3.5 h-3.5" />
          Add Place
        </button>
      </div>

      {/* ── Two-Panel Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Roster */}
        <div className="w-64 flex-shrink-0 border-r border-ns-border flex flex-col bg-ns-surface">
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {places.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                <div className="w-12 h-12 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                  <Map className="w-5 h-5 text-ns-accent opacity-60" />
                </div>
                <p className="font-ui text-xs text-ns-ink-muted text-center leading-relaxed">
                  No places yet.<br />Add your first location.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {places.map((place) => {
                  const isSelected = selectedPlace?.id === place.id;
                  return (
                    <div
                      key={place.id}
                      onClick={() => handlePlaceClick(place)}
                      className={`flex items-center gap-3 rounded-ns px-3 py-2.5 cursor-pointer transition-all duration-150 group ${
                        isSelected ? "bg-ns-accent-subtle" : "hover:bg-ns-surface-hover"
                      }`}
                    >
                      {/* Icon badge */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? "bg-ns-accent text-white"
                            : "bg-ns-border text-ns-ink-secondary"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-ui text-xs font-medium truncate transition-colors ${
                            isSelected ? "text-ns-ink" : "text-ns-ink-secondary"
                          }`}
                        >
                          {place.name}
                        </p>
                        {place.description && (
                          <p className="font-ui text-[10px] text-ns-ink-muted truncate">
                            {place.description}
                          </p>
                        )}
                      </div>

                      {/* Hover actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaceToUpdate(place);
                            setIsUpdateModalOpen(true);
                          }}
                          className="p-1.5 rounded text-ns-ink-muted hover:text-ns-ink hover:bg-ns-elevated transition-all duration-150"
                          aria-label="Edit place"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlace(place.id);
                          }}
                          className="p-1.5 rounded text-ns-ink-muted hover:text-ns-destructive hover:bg-ns-elevated transition-all duration-150"
                          aria-label="Delete place"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="flex-1 overflow-y-auto bg-ns-bg">
          {!selectedPlace ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center gap-3 px-8 animate-ns-fade-in">
              <div className="w-14 h-14 rounded-full bg-ns-accent-subtle flex items-center justify-center">
                <MapPin className="w-6 h-6 text-ns-accent opacity-60" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-heading italic text-xl text-ns-ink-secondary">
                  Select a place
                </p>
                <p className="font-ui text-xs text-ns-ink-muted">
                  Choose a location from the list to view its details
                </p>
              </div>
            </div>
          ) : (
            /* Place Detail */
            <div className="max-w-xl mx-auto p-6 space-y-6 animate-ns-fade-in">

              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-ns-accent flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="font-heading italic text-2xl text-ns-ink leading-tight">
                    {selectedPlace.name}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setPlaceToUpdate(selectedPlace);
                    setIsUpdateModalOpen(true);
                  }}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns border border-ns-border font-ui text-xs text-ns-ink-secondary hover:bg-ns-surface hover:text-ns-ink active:scale-[0.97] transition-all duration-150"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>

              <div className="h-px bg-ns-border" />

              {/* Fields */}
              <div className="space-y-5">
                {selectedPlace.description && (
                  <div className="space-y-1.5">
                    <p className="font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest">
                      Description
                    </p>
                    <p className="font-body text-sm text-ns-ink leading-relaxed">
                      {selectedPlace.description}
                    </p>
                  </div>
                )}

                {selectedPlace.notes && (
                  <div className="space-y-1.5">
                    <p className="font-ui text-[10px] font-semibold text-ns-ink-muted uppercase tracking-widest">
                      Notes
                    </p>
                    <p className="font-body text-sm text-ns-ink-secondary leading-relaxed">
                      {selectedPlace.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t border-ns-border">
                <button
                  onClick={() => handleDeletePlace(selectedPlace.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ns font-ui text-xs text-ns-destructive border border-ns-destructive/20 hover:bg-ns-destructive/5 hover:border-ns-destructive/40 active:scale-[0.97] transition-all duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Place
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* ── Modals ── */}
      {isAddModalOpen && (
        <AddPlaceModal
          storyId={storyId}
          onClose={() => setIsAddModalOpen(false)}
          onAddPlace={handleAddPlace}
        />
      )}
      {isUpdateModalOpen && placeToUpdate && (
        <UpdatePlaceModal
          storyId={storyId}
          place={placeToUpdate}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateplace={handleUpdatePlace}
        />
      )}
    </div>
  );
};

export default Places;
