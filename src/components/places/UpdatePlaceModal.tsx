import { Place } from "@/types/IPlace";
import { useState } from "react";
import { placeService } from "@/services/PlaceService";

interface UpdatePlaceModalProps {
  storyId: string;
  place: Place;
  onClose: () => void;
  onUpdateplace: (place: Place) => void;
}

const UpdateplaceModal: React.FC<UpdatePlaceModalProps> = ({
  storyId,
  place,
  onClose,
  onUpdateplace,
}) => {
  const [updatedplace, setUpdatedplace] = useState<Place>(place);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUpdatedplace((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await placeService.updatePlace(storyId, updatedplace);
      onUpdateplace(updatedplace);
    } catch (error) {
      console.error("Error updating place:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className=" p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Update place</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={updatedplace.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="text"
            name="description"
            value={updatedplace.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full mb-2 p-2 border rounded"
          />
          <textarea
            name="notes"
            value={updatedplace.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="w-full mb-2 p-2 border rounded"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-black px-4 py-2 rounded mr-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Update place
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateplaceModal;
