// Each user should be able to only create 10 novels for now.

import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { firestore } from "../config/firebase";
// Only 100 novels in DB for now.
interface AttributeScores {
  IDENTITY_ATTACK: number;
  INSULT: number;
  PROFANITY: number;
  SEVERE_TOXICITY: number;
  THREAT: number;
  TOXICITY: number;
}

export const analyzeText = async (text: string): Promise<AttributeScores> => {
  try {
    const commentsCollection = collection(firestore, "comments");
    const docRef = await addDoc(commentsCollection, {
      text: text,
    });

    let attributeScores: AttributeScores | null = null;
    let attempts = 0;
    const maxAttempts = 2;
    const delayMs = 3000;

    while (!attributeScores && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const docSnapshot = await getDoc(doc(firestore, "comments", docRef.id));
      const data = docSnapshot.data();

      if (data && data.attribute_scores) {
        attributeScores = data.attribute_scores as AttributeScores;
      }

      attempts++;
    }

    if (!attributeScores) {
      throw new Error(
        "Timeout: attribute_scores not available after maximum attempts"
      );
    }

    return attributeScores;
  } catch (error) {
    console.error("Error analyzing text: ", error);
    throw error;
  }
};

export const isToxic = (scores: AttributeScores): boolean => {
  const toxicThreshold = 0.9;
  const toxicAttributes = [
    "IDENTITY_ATTACK",
    "INSULT",
    "PROFANITY",
    "SEVERE_TOXICITY",
    "THREAT",
    "TOXICITY",
  ] as const;

  for (const attribute of toxicAttributes) {
    if (scores[attribute] > toxicThreshold) {
      return true;
    }
  }

  return false;
};
