import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Upload, Loader2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { storiesRepo } from "@/services/StoriesRepo";
import { storageService } from "@/services/StorageService";
import { generateCover } from "@/services/imageGenerationService";

interface StoryMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const StoryMetadataModal: React.FC<StoryMetadataModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [language, setLanguage] = useState("");
  const [copyright, setCopyright] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateAICover = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    try {
      // Use title and description to create a prompt if no custom prompt provided
      const prompt =
        aiPrompt ||
        `Book cover for "${title}". ${description}. Professional, eye-catching design.`;

      // Generate cover using the image generation service
      const result = await generateCover(prompt);

      // Set the generated image file and preview
      setCoverImage(result.file);
      setImagePreview(result.imageUrl);
      setShowAiPrompt(false);
      setAiPrompt("");
      setGenerationError(null);
      
      // Show success toast
      toast.success("Cover image generated successfully!");
    } catch (error) {
      console.error("Error generating AI cover:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate AI cover. Please try again.";
      
      // Set error state for inline display
      setGenerationError(errorMessage);
      
      // Show error toast
      toast.error("Failed to generate cover image", {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let coverImageUrl = "";
      if (coverImage) {
        // Upload to Firebase Storage with a temp path (story ID not yet known)
        coverImageUrl = await storageService.uploadCoverImage(
          coverImage,
          userId,
          `new-${Date.now()}`
        );
      }

      const newStoryId = await storiesRepo.createStory(
        title,
        description,
        userId,
        {
          category,
          tags: tags.split(",").map((tag) => tag.trim()),
          targetAudience,
          language,
          copyright,
          coverImageUrl,
        }
      );
      onClose();
      navigate(`/create/${newStoryId}`);
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 text-black dark:text-white border-0 shadow-2xl rounded-xl transition-all duration-200 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-neutral-800">
          <DialogTitle className="text-2xl font-bold text-black dark:text-white">
            Create New Story
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fill in the details to start your new story
          </p>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter story title"
                    className="h-11 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your story"
                    rows={4}
                    className="bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="category"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Category
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                      <SelectItem
                        value="fiction"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Fiction
                      </SelectItem>
                      <SelectItem
                        value="non-fiction"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Non-Fiction
                      </SelectItem>
                      <SelectItem
                        value="poetry"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Poetry
                      </SelectItem>
                      <SelectItem
                        value="fantasy"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Fantasy
                      </SelectItem>
                      <SelectItem
                        value="science-fiction"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Science Fiction
                      </SelectItem>
                      <SelectItem
                        value="romance"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Romance
                      </SelectItem>
                      <SelectItem
                        value="mystery-thriller"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Mystery/Thriller
                      </SelectItem>
                      <SelectItem
                        value="horror"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Horror
                      </SelectItem>
                      <SelectItem
                        value="historical-fiction"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Historical Fiction
                      </SelectItem>
                      <SelectItem
                        value="young-adult"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Young Adult
                      </SelectItem>
                      <SelectItem
                        value="drama"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Drama
                      </SelectItem>
                      <SelectItem
                        value="adventure"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Adventure
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="tags"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Comma-separated tags"
                    className="h-11 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Separate tags with commas
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="targetAudience"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Target Audience
                  </Label>
                  <Input
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Young Adult, Adults"
                    className="h-11 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="language"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Language
                  </Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g., English, Spanish"
                    className="h-11 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Copyright
                  </Label>
                  <Select value={copyright} onValueChange={setCopyright}>
                    <SelectTrigger className="h-11 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white border-gray-300 dark:border-neutral-700 focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green">
                      <SelectValue placeholder="Select copyright" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                      <SelectItem
                        value="CC0"
                        className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700 focus:bg-gray-100 dark:focus:bg-neutral-700"
                      >
                        Creative Commons Zero
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Cover Image Section - Full Width */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
              <Label
                htmlFor="coverImage"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 block"
              >
                Cover Image
              </Label>
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1 h-11 border-2 hover:border-dark-green dark:hover:border-light-green"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAiPrompt(!showAiPrompt);
                    setGenerationError(null); // Clear error when toggling
                  }}
                  className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 text-white hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all shadow-md hover:shadow-lg border-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </div>

              {showAiPrompt && (
                <div className="space-y-3 mt-4 p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 backdrop-blur-sm">
                  <Label
                    htmlFor="aiPrompt"
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Describe your cover (optional - will use title & description
                    if empty)
                  </Label>
                  <Textarea
                    id="aiPrompt"
                    value={aiPrompt}
                    onChange={(e) => {
                      setAiPrompt(e.target.value);
                      setGenerationError(null); // Clear error when user types
                    }}
                    placeholder="E.g., A mystical forest with glowing trees and a mysterious figure..."
                    className="bg-white dark:bg-neutral-800 text-black dark:text-white border-purple-300 dark:border-purple-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all"
                    rows={3}
                  />
                  
                  {/* Error message display */}
                  {generationError && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Generation Failed</p>
                        <p className="text-xs mt-1">{generationError}</p>
                      </div>
                      <button
                        onClick={() => setGenerationError(null)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={generateAICover}
                    disabled={isGenerating || !title}
                    className="w-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-500 dark:to-purple-600 text-white hover:from-purple-700 hover:to-purple-800 dark:hover:from-purple-600 dark:hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Cover
                      </>
                    )}
                  </Button>
                </div>
              )}

              {imagePreview && (
                <div className="mt-4 p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800/50">
                  <Label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    Preview
                  </Label>
                  <div className="relative rounded-lg overflow-hidden border border-gray-300 dark:border-neutral-600 shadow-md">
                    <img
                      src={imagePreview}
                      alt="Cover preview"
                      className="w-full h-auto max-h-64 object-contain bg-white dark:bg-neutral-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50">
          <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="h-11 px-8 bg-gradient-to-r from-dark-green to-light-green dark:from-light-green dark:to-dark-green text-white hover:shadow-lg transition-all shadow-md font-semibold"
            >
              Create Story
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoryMetadataModal;
