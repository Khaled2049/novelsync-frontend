import { useState } from "react";
import { IClub } from "../../types/IClub";

interface UpdateBookClubProps {
  club: IClub;
  onUpdate: (updatedClub: IClub) => void;
  onCancel: () => void;
}

const UpdateBookClub = ({ club, onUpdate, onCancel }: UpdateBookClubProps) => {
  const [name, setname] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [category, setCategory] = useState(club.category);

  const handleUpdate = () => {
    const updatedClub = { ...club, name, description };
    onUpdate(updatedClub);
  };

  return (
    <div className=" p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Update Book Club</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setname(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Category</label>
        <textarea
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
        ></textarea>
      </div>
      <div className="flex justify-between">
        <button
          onClick={handleUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded-full"
        >
          Update Club
        </button>
        <button
          onClick={onCancel}
          className="bg-red-600 text-white px-4 py-2 rounded-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default UpdateBookClub;
