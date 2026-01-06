import { Place } from "@/types/IPlace";
import { useState } from "react";
import { placeService } from "@/services/PlaceService";

interface AddPlaceModalProps {
  storyId: string;
  onClose: () => void;
  onAddPlace: (place: Place) => void;
}

const AddPlaceModal = ({
  storyId,
  onClose,
  onAddPlace,
}: AddPlaceModalProps) => {
  const [place, setPlace] = useState<Omit<Place, "id">>({
    name: "",
    description: "",
    notes: "",
    storyId,
    userId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPlaceId = await placeService.addPlace(storyId, place);
      onAddPlace({ ...place, id: newPlaceId });
    } catch (error) {
      console.error("Error adding character:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPlace((prevPlace) => ({
      ...prevPlace,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center dark:bg-black/50">
      <div className="bg-neutral-50 dark:bg-black p-6 rounded-lg transition-colors duration-200">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={place.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
            required
          />
          <input
            type="text"
            name="description"
            value={place.description}
            onChange={handleChange}
            placeholder="description"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
            required
          />
          <textarea
            name="notes"
            value={place.notes}
            onChange={handleChange}
            placeholder="notes"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
            required
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-black/10 dark:bg-neutral-50/10 text-black dark:text-white px-4 py-2 rounded mr-2 hover:bg-black/20 dark:hover:bg-neutral-50/20 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-dark-green dark:bg-light-green text-white px-4 py-2 rounded hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200"
            >
              Add Place
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlaceModal;
