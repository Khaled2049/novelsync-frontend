import { Character } from "@/types/ICharacter";
import { useState } from "react";
import { characterService } from "@/services/CharacterService";

interface AddCharacterModalProps {
  storyId: string;
  onClose: () => void;
  onAddCharacter: (character: Character) => void;
}

const AddCharacterModal = ({
  storyId,
  onClose,
  onAddCharacter,
}: AddCharacterModalProps) => {
  const [character, setCharacter] = useState<Omit<Character, "id">>({
    name: "",
    age: 0,
    backstory: "",
    affiliations: "",
    notes: "",
    userId: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCharacter((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCharacterId = await characterService.addCharacter(
        storyId,
        character
      );
      onAddCharacter({ ...character, id: newCharacterId });
    } catch (error) {
      console.error("Error adding character:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center dark:bg-black/50">
      <div className="bg-neutral-50 dark:bg-black p-6 rounded-lg transition-colors duration-200">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={character.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
            required
          />
          <input
            type="number"
            name="age"
            value={character.age}
            onChange={handleChange}
            placeholder="Age"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
            required
          />
          <textarea
            name="backstory"
            value={character.backstory}
            onChange={handleChange}
            placeholder="Backstory"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
            required
          />
          <input
            type="text"
            name="affiliations"
            value={character.affiliations}
            onChange={handleChange}
            placeholder="Affiliations"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
          />
          <textarea
            name="notes"
            value={character.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="w-full mb-2 p-2 border border-black/20 dark:border-white/20 rounded bg-neutral-50 dark:bg-black text-black dark:text-white focus:ring-dark-green dark:focus:ring-light-green focus:border-dark-green dark:focus:border-light-green"
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
              Add Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCharacterModal;
