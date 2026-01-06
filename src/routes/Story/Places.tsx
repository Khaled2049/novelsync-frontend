import React, { useEffect, useState } from "react";

import AddPlaceModal from "@/components/places/AddPlaceModal";

import { useParams } from "react-router-dom";
import { Place } from "@/types/IPlace";
import { placeService } from "@/services/PlaceService";
import UpdatePlaceModal from "@/components/places/UpdatePlaceModal";

const places: React.FC = () => {
  const { storyId } = useParams<{ storyId: string }>();
  const [places, setplaces] = useState<Place[]>([]);
  const [selectedplace, setSelectedplace] = useState<Place | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [placeToUpdate, setplaceToUpdate] = useState<Place | null>(null);

  useEffect(() => {
    loadplaces();
  }, [storyId]);

  // const removePlace = async (id: string) => {
  //   if (!storyId) return;
  //   await placeService.deletePlace(storyId, id);
  //   setplaces(places.filter((place) => place.id !== id));
  // };

  const loadplaces = async () => {
    if (!storyId) return;
    const places = await placeService.getPlaces(storyId);
    setplaces(places);
  };

  const handleplaceClick = (place: Place) => {
    setSelectedplace(place);
  };

  const handleAddplace = (newplace: Place) => {
    setplaces([...places, newplace]);
    setIsAddModalOpen(false);
  };

  const handleUpdateplace = (updatedplace: Place) => {
    setplaces((prevplaces) =>
      prevplaces.map((place) =>
        place.id === updatedplace.id ? updatedplace : place
      )
    );
    setIsUpdateModalOpen(false);
    setplaceToUpdate(null);
    if (selectedplace?.id === updatedplace.id) {
      setSelectedplace(updatedplace);
    }
  };

  const handleDeleteplace = async (placeId: string) => {
    if (!storyId) return;
    try {
      await placeService.deletePlace(storyId, placeId);
      setplaces((prevplaces) =>
        prevplaces.filter((place) => place.id !== placeId)
      );
      if (selectedplace?.id === placeId) {
        setSelectedplace(null);
      }
    } catch (error) {
      console.error("Error deleting place:", error);
    }
  };

  if (!storyId) {
    return (
      <div>Story ID not found in URL. Please check the URL and try again.</div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-black text-black dark:text-white transition-colors duration-200">
      <div className="w-1/2 p-4 border-r border-black/20 dark:border-white/20">
        <h2 className="text-xl font-bold mb-4">places</h2>
        <button
          className="bg-dark-green dark:bg-light-green text-white px-4 py-2 rounded mb-4 hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200"
          onClick={() => setIsAddModalOpen(true)}
        >
          Add place
        </button>
        <ul>
          {places.map((place) => (
            <li
              key={place.id}
              className="flex items-center justify-between hover:bg-black/10 dark:hover:bg-neutral-50/10 p-2 rounded-md transition-colors duration-200"
            >
              <span
                className="cursor-pointer"
                onClick={() => handleplaceClick(place)}
              >
                {place.name}
              </span>
              <div>
                <button
                  className="bg-light-green dark:bg-dark-green text-white px-2 py-1 rounded mr-2 hover:bg-dark-green dark:hover:bg-light-green transition-colors duration-200"
                  onClick={() => {
                    setplaceToUpdate(place);
                    setIsUpdateModalOpen(true);
                  }}
                >
                  Update
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors duration-200"
                  onClick={() => handleDeleteplace(place.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-1/2 p-4">
        <h2 className="text-xl font-bold mb-4">place Details</h2>
        {selectedplace ? (
          <div className="bg-neutral-50 dark:bg-black p-4 rounded-lg border border-black/20 dark:border-white/20">
            <h3 className="text-lg font-semibold">{selectedplace.name}</h3>
            <p className="text-black/70 dark:text-white/70">
              Description: {selectedplace.description}
            </p>
            {selectedplace.notes && (
              <p className="text-black/70 dark:text-white/70">
                Notes: {selectedplace.notes}
              </p>
            )}
          </div>
        ) : (
          <p className="text-black/50 dark:text-white/50">
            Select a place to view details
          </p>
        )}
      </div>
      {isAddModalOpen && storyId && (
        <AddPlaceModal
          storyId={storyId}
          onClose={() => setIsAddModalOpen(false)}
          onAddPlace={handleAddplace}
        />
      )}
      {isUpdateModalOpen && storyId && placeToUpdate && (
        <UpdatePlaceModal
          storyId={storyId}
          place={placeToUpdate}
          onClose={() => setIsUpdateModalOpen(false)}
          onUpdateplace={handleUpdateplace}
        />
      )}
    </div>
  );
};

export default places;
