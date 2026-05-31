import { storage } from "@/config/firebase";
import { reserveStorageUpload } from "@/api/storage";
import { prepareImageForUpload } from "@/utils/imageUpload";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const COVERS_PATH = "book-covers";
const CHARACTER_ART_PATH = "character-art";
const PLACE_IMAGE_PATH = "place-images";
const CHAPTER_IMAGE_PATH = "chapter-images";
const PROFILE_IMAGE_PATH = "profile-images";

class StorageService {
  private async reserveUploadSlot(): Promise<void> {
    await reserveStorageUpload();
  }

  /**
   * Upload a cover image to Firebase Storage.
   * Path: book-covers/{userId}/{storyId}-{timestamp}.{ext}
   * Returns the permanent public download URL.
   */
  async uploadCoverImage(
    file: File,
    userId: string,
    storyId: string,
  ): Promise<string> {
    const prepared = await prepareImageForUpload(file);
    const ext =
      prepared.type === "image/png"
        ? "png"
        : prepared.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${COVERS_PATH}/${userId}/${storyId}-${Date.now()}.${ext}`;
    await this.reserveUploadSlot();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, prepared, {
      contentType: prepared.type,
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
    characterId: string,
  ): Promise<string> {
    const prepared = await prepareImageForUpload(file);
    const ext = prepared.type === "image/png" ? "png" : "jpg";
    const path = `${CHARACTER_ART_PATH}/${userId}/${characterId}-${Date.now()}.${ext}`;
    await this.reserveUploadSlot();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, prepared, {
      contentType: prepared.type,
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
    placeId: string,
  ): Promise<string> {
    const prepared = await prepareImageForUpload(file);
    const ext = prepared.type === "image/png" ? "png" : "jpg";
    const path = `${PLACE_IMAGE_PATH}/${userId}/${placeId}-${Date.now()}.${ext}`;
    await this.reserveUploadSlot();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, prepared, {
      contentType: prepared.type,
      cacheControl: "public, max-age=31536000",
    });
    return getDownloadURL(snapshot.ref);
  }

  /**
   * Upload an inline image used inside a chapter to Firebase Storage.
   * Path: chapter-images/{userId}/{storyId}/{chapterId}-{timestamp}.{ext}
   * Returns the permanent public download URL.
   */
  async uploadChapterImage(
    file: File,
    userId: string,
    storyId: string,
    chapterId: string,
  ): Promise<string> {
    const prepared = await prepareImageForUpload(file);
    const ext = prepared.type === "image/png" ? "png" : "jpg";
    const path = `${CHAPTER_IMAGE_PATH}/${userId}/${storyId}/${chapterId}-${Date.now()}.${ext}`;
    await this.reserveUploadSlot();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, prepared, {
      contentType: prepared.type,
      cacheControl: "public, max-age=31536000",
    });
    return getDownloadURL(snapshot.ref);
  }

  /**
   * Upload a user's profile image to Firebase Storage.
   * Path: profile-images/{userId}/{timestamp}.{ext}
   * Returns the permanent public download URL.
   */
  async uploadProfileImage(file: File, userId: string): Promise<string> {
    const prepared = await prepareImageForUpload(file);
    const ext = prepared.type === "image/png" ? "png" : "jpg";
    const path = `${PROFILE_IMAGE_PATH}/${userId}/${Date.now()}.${ext}`;
    await this.reserveUploadSlot();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, prepared, {
      contentType: prepared.type,
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
