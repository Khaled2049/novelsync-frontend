import { Character } from "@/types/ICharacter";
import { useState } from "react";
import { characterService } from "@/services/CharacterService";

interface UpdateCharacterModalProps {
  storyId: string;
  character: Character;
  onClose: () => void;
  onUpdateCharacter: (character: Character) => void;
}

const UpdateCharacterModal: React.FC<UpdateCharacterModalProps> = ({
  storyId,
  character,
  onClose,
  onUpdateCharacter,
}) => {
  const [updatedCharacter, setUpdatedCharacter] =
    useState<Character>(character);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUpdatedCharacter((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await characterService.updateCharacter(storyId, updatedCharacter);
      onUpdateCharacter(updatedCharacter);
    } catch (error) {
      console.error("Error updating character:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className=" p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Update Character</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={updatedCharacter.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="number"
            name="age"
            value={updatedCharacter.age}
            onChange={handleChange}
            placeholder="Age"
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <textarea
            name="backstory"
            value={updatedCharacter.backstory}
            onChange={handleChange}
            placeholder="Backstory"
            className="w-full mb-2 p-2 border rounded"
            required
          />
          <input
            type="text"
            name="affiliations"
            value={updatedCharacter.affiliations}
            onChange={handleChange}
            placeholder="Affiliations"
            className="w-full mb-2 p-2 border rounded"
          />
          <textarea
            name="notes"
            value={updatedCharacter.notes}
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
              Update Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateCharacterModal;
