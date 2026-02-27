import { storage } from "@/config/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const COVERS_PATH = "book-covers";
const CHARACTER_ART_PATH = "character-art";
const PLACE_IMAGE_PATH = "place-images";

class StorageService {
  /**
   * Upload a cover image to Firebase Storage.
   * Path: book-covers/{userId}/{storyId}-{timestamp}.{ext}
   * Returns the permanent public download URL.
   */
  async uploadCoverImage(
    file: File,
    userId: string,
    storyId: string
  ): Promise<string> {
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${COVERS_PATH}/${userId}/${storyId}-${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: "public, max-age=31536000",
    });
    return getDownloadURL(snapshot.ref);
  }

  /**
   * Upload character art to Firebase Storage.
   * Path: character-art/{userId}/{characterId}-{timestamp}.{ext}
   * Returns the permanent public download URL.
   */
  async uploadCharacterArt(
    file: File,
    userId: string,
    characterId: string
  ): Promise<string> {
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${CHARACTER_ART_PATH}/${userId}/${characterId}-${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: "public, max-age=31536000",
    });
    return getDownloadURL(snapshot.ref);
  }

  /**
   * Upload a place image to Firebase Storage.
   * Path: place-images/{userId}/{placeId}-{timestamp}.{ext}
   * Returns the permanent public download URL.
   */
  async uploadPlaceImage(
    file: File,
    userId: string,
    placeId: string
  ): Promise<string> {
    const ext = file.type === "image/png" ? "png" : "jpg";
    const path = `${PLACE_IMAGE_PATH}/${userId}/${placeId}-${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: "public, max-age=31536000",
    });
    return getDownloadURL(snapshot.ref);
  }

  /**
   * Delete a cover image from Firebase Storage by its download URL.
   * Silently ignores "not found" errors (idempotent).
   */
  async deleteCoverImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.includes("firebasestorage")) return;
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error: any) {
      if (error?.code !== "storage/object-not-found") {
        console.warn("Could not delete old cover image:", error);
      }
    }
  }

  /**
   * Convert a data URL (e.g. base64 from AI generation) to a File object
   * ready for uploading to Firebase Storage.
   */
  dataUrlToFile(dataUrl: string, filename = `cover-${Date.now()}.png`): File {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    return new File([byteArray], filename, { type: mime });
  }
}

export const storageService = new StorageService();
