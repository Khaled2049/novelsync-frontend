import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
// import { storiesRepo } from "@/services/StoriesRepo";
import { Character } from "@/types/ICharacter";

// Firestore rejects undefined values — strip them before writing
function omitUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

class CharacterService {
  private storiesCollection = collection(firestore, "stories");

  async getCharacters(storyId: string): Promise<Character[]> {
    try {
      const plotsCollection = collection(
        this.storiesCollection,
        storyId,
        "characters",
      );
      const charactersSnapshot = await getDocs(plotsCollection);
      return charactersSnapshot.docs.map((doc) => doc.data() as Character);
    } catch (error) {
      console.error("Error getting plots:", error);
      throw error;
    }
  }

  async addCharacter(
    storyId: string,
    character: Omit<Character, "id">,
  ): Promise<Character> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const charactersCollection = collection(storyRef, "characters");
      const newCharacterRef = doc(charactersCollection);

      const story = await getDoc(storyRef);
      if (!story.exists()) {
        throw new Error("Story not found");
      }

      const newCharacter: Character = {
        ...character,
        id: newCharacterRef.id,
        userId: story.data().userId,
      };

      await setDoc(newCharacterRef, omitUndefined(newCharacter));

      return newCharacter;
    } catch (error) {
      console.error("Error adding character:", error);
      throw error;
    }
  }

  async updateCharacter(storyId: string, character: Character): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const characterRef = doc(
        collection(storyRef, "characters"),
        character.id,
      );
      const characterSnapshot = await getDoc(characterRef);
      if (!characterSnapshot.exists()) {
        throw new Error("Character not found");
      }

      const characterData = characterSnapshot.data() as Character;
      await updateDoc(
        characterRef,
        omitUndefined({ ...characterData, ...character }),
      );
    } catch (error) {
      console.error("Error updating character:", error);
      throw error;
    }
  }

  async deleteCharacter(storyId: string, characterId: string): Promise<void> {
    try {
      const storyRef = doc(this.storiesCollection, storyId);
      const characterRef = doc(collection(storyRef, "characters"), characterId);
      await deleteDoc(characterRef);
    } catch (error) {
      console.error("Error deleting character:", error);
      throw error;
    }
  }
}

export const characterService = new CharacterService();
