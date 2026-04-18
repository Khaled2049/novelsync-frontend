import { useState, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { generateCover } from "@/services/imageGenerationService";
import { storageService } from "@/services/StorageService";

export const MAX_CHAPTER_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function countEditorImages(editor: Editor): number {
  let count = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === "image") count++;
  });
  return count;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type))
    return "Unsupported format. Use JPEG, PNG, or WebP.";
  if (file.size > MAX_IMAGE_BYTES)
    return "Image too large. Maximum size is 2 MB.";
  return null;
}

interface UploadContext {
  userId?: string;
  storyId: string;
  chapterId?: string;
}

interface UseImageGenerationParams {
  editorRef: React.RefObject<Editor | null>;
  uploadContextRef: React.RefObject<UploadContext>;
  canUseAI: () => boolean;
  incrementAiUsage: () => Promise<void>;
  onError: (msg: string) => void;
}

export function useImageGeneration({
  editorRef,
  uploadContextRef,
  canUseAI,
  incrementAiUsage,
  onError,
}: UseImageGenerationParams) {
  const [imagePromptOpen, setImagePromptOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const openImagePrompt = useCallback(() => {
    setImagePrompt("");
    setImagePromptOpen(true);
  }, []);

  const handleGenerateImage = useCallback(async () => {
    const editorInstance = editorRef.current;
    if (!editorInstance || !imagePrompt.trim()) return;

    if (countEditorImages(editorInstance) >= MAX_CHAPTER_IMAGES) {
      onError(`Maximum ${MAX_CHAPTER_IMAGES} images per chapter.`);
      return;
    }
    if (!canUseAI()) {
      onError("Daily AI usage limit reached. Please try again tomorrow.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { file } = await generateCover(imagePrompt.trim());
      const {
        userId: uid,
        storyId: sid,
        chapterId: cid,
      } = uploadContextRef.current;
      const url = await storageService.uploadChapterImage(
        file,
        uid ?? "",
        sid,
        cid ?? "",
      );
      await incrementAiUsage();
      editorInstance.chain().focus().setImage({ src: url }).run();
      setImagePromptOpen(false);
      setImagePrompt("");
    } catch (err) {
      console.error("Image generation failed:", err);
      onError("Image generation failed. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  }, [
    imagePrompt,
    canUseAI,
    incrementAiUsage,
    editorRef,
    uploadContextRef,
    onError,
  ]);

  return {
    imagePromptOpen,
    setImagePromptOpen,
    imagePrompt,
    setImagePrompt,
    isGeneratingImage,
    openImagePrompt,
    handleGenerateImage,
  };
}
