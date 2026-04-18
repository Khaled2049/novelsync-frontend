import { useState, useRef, useEffect } from "react";
import {
  FaEdit,
  FaTrash,
  FaEyeSlash,
  FaBookOpen,
  FaEye,
  FaHeart,
  FaStar,
  FaImage,
  FaUpload,
  FaMagic,
  FaTimes,
} from "react-icons/fa";
import { StoryMetadata } from "@/types/IStory";
import { DollarSign } from "lucide-react";
import { generateCover } from "@/services/imageGenerationService";

interface StoryCardProps {
  story: StoryMetadata & {
    earnings?: {
      eth: string;
      usdc: string;
    };
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onUnpublish: (id: string) => void;
  onImageUpdate?: (
    id: string,
    imageFile: File | null,
    previewUrl: string | null,
  ) => void;
  isLoading?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onEdit,
  onDelete,
  onUnpublish,
  onImageUpdate,
  isLoading = false,
}) => {
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Use a different icon and color based on the published status
  const isPublished = story.isPublished;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowImageMenu(false);
        setShowPromptInput(false);
      }
    };

    if (showImageMenu || showPromptInput) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showImageMenu, showPromptInput]);

  // Close lightbox on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLightbox(false);
      }
    };

    if (showLightbox) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showLightbox]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpdate) {
      const previewUrl = URL.createObjectURL(file);
      onImageUpdate(story.id, file, previewUrl);
      setShowImageMenu(false);
      setShowLightbox(false);
    }
  };

  const handleRemoveImage = () => {
    if (onImageUpdate) {
      onImageUpdate(story.id, null, null);
      setShowImageMenu(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateCover(aiPrompt);
      if (onImageUpdate) {
        onImageUpdate(story.id, result.file, result.imageUrl);
      }
      setShowPromptInput(false);
      setShowImageMenu(false);
      setAiPrompt("");
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate image",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-black/20 dark:border-white/20 rounded-xl shadow-md dark:bg-black animate-pulse">
        <div className="flex">
          <div className="w-32 h-40 bg-gray-300 dark:bg-gray-700 rounded-l-xl flex-shrink-0"></div>
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="h-7 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-20 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-black/20 dark:border-white/20 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 dark:bg-black text-black dark:text-white">
      <div className="flex">
        {/* Cover Image Section */}
        <div ref={menuRef} className="relative w-32 flex-shrink-0 group">
          {story.coverImageUrl ? (
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="w-full h-full object-cover rounded-l-xl min-h-[160px] cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowLightbox(true)}
            />
          ) : (
            <div
              className={`w-full h-full min-h-[160px] bg-gray-200 dark:bg-gray-800 rounded-l-xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 ${onImageUpdate ? "cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" : ""}`}
              onClick={
                onImageUpdate
                  ? () => setShowImageMenu(!showImageMenu)
                  : undefined
              }
            >
              <FaImage className="w-8 h-8 mb-2" />
              <span className="text-xs text-center px-2">Add cover image</span>
            </div>
          )}

          {/* Image Menu Dropdown */}
          {showImageMenu && (
            <div className="absolute top-0 left-full ml-2 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[180px]">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaUpload className="w-4 h-4" />
                Upload from computer
              </button>
              <button
                onClick={() => {
                  setShowPromptInput(true);
                  setGenerationError(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaMagic className="w-4 h-4" />
                Generate with AI
              </button>
              {story.coverImageUrl && (
                <button
                  onClick={handleRemoveImage}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Remove image
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          )}

          {/* AI Prompt Modal */}
          {showPromptInput && (
            <div className="absolute top-0 left-full ml-2 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Generate Cover with AI</h4>
                <button
                  onClick={() => {
                    setShowPromptInput(false);
                    setAiPrompt("");
                    setGenerationError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe the cover image you want..."
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-black dark:text-white resize-none"
                rows={3}
                disabled={isGenerating}
              />
              {generationError && (
                <p className="text-red-500 text-xs mt-1">{generationError}</p>
              )}
              <button
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="mt-2 w-full py-2 text-sm font-medium text-white bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaMagic className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            {/* Status Indicator */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPublished
                  ? "bg-light-green/20 dark:bg-dark-green/20 text-dark-green dark:text-light-green"
                  : "bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70"
              }`}
            >
              {isPublished ? (
                <FaBookOpen className="mr-1.5" />
              ) : (
                <FaEdit className="mr-1.5" />
              )}
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>

          {/* Story Title */}
          <h3 className="text-2xl font-serif font-bold text-black dark:text-white mb-3 truncate">
            {story.title}
          </h3>

          {/* Analytics Section */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-black/70 dark:text-white/70">
            <div className="flex items-center gap-1.5">
              <FaEye className="w-4 h-4" />
              <span>{story.views || 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaHeart className="w-4 h-4" />
              <span>{story.likes || 0}</span>
            </div>
            {story.averageRating && (
              <div className="flex items-center gap-1.5">
                <FaStar className="w-4 h-4 text-yellow-500" />
                <span>{story.averageRating.toFixed(1)}</span>
                {story.ratingsCount && (
                  <span className="text-xs">({story.ratingsCount})</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FaBookOpen className="w-4 h-4" />
              <span>{story.chapterCount || 0} chapters</span>
            </div>
          </div>

          {/* Earnings Section */}
          {story.earnings &&
            (parseFloat(story.earnings.eth) > 0 ||
              parseFloat(story.earnings.usdc) > 0) && (
              <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-4 text-sm">
                  {parseFloat(story.earnings.eth) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {parseFloat(story.earnings.eth).toFixed(4)} ETH
                      </span>
                    </div>
                  )}
                  {parseFloat(story.earnings.usdc) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {parseFloat(story.earnings.usdc).toFixed(2)} USDC
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEdit(story.id)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-dark-green dark:bg-light-green hover:bg-light-green dark:hover:bg-dark-green rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
            >
              <FaEdit className="mr-2" />
              Edit
            </button>
            {isPublished ? (
              <button
                onClick={() => onUnpublish(story.id)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-black dark:text-white border border-black dark:border-white hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
              >
                <FaEyeSlash className="mr-2" />
                Unpublish
              </button>
            ) : (
              <button
                onClick={() => onDelete(story.id)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && story.coverImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>

            {/* Enlarged image */}
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* Edit options */}
            {onImageUpdate && (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaUpload className="w-4 h-4" />
                  Upload new
                </button>
                <button
                  onClick={() => {
                    setShowLightbox(false);
                    setShowImageMenu(true);
                    setShowPromptInput(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaMagic className="w-4 h-4" />
                  Generate with AI
                </button>
                <button
                  onClick={() => {
                    handleRemoveImage();
                    setShowLightbox(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
