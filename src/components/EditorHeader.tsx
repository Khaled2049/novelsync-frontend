import { useCallback, useState } from "react";
import * as Icons from "./Icons";
import { Editor } from "@tiptap/react";
import { LinkModal } from "./LinkModal";
import axiosInstance from "../api";
// import { RiAiGenerate } from "react-icons/ri";
import { List, ZoomIn, ZoomOut } from "lucide-react";

interface EditorHeaderProps {
  editor: Editor;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  storyId?: string;
}

const ZOOM_PRESETS = [50, 75, 90, 100, 125, 150, 200];

const EditorHeader: React.FC<EditorHeaderProps> = ({ editor, zoomLevel = 100, onZoomChange, storyId }) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [genImage, setGenImage] = useState("");
  const [_isLoading, setIsLoading] = useState(false);

  const handleZoomIn = useCallback(() => {
    if (!onZoomChange) return;
    const currentIndex = ZOOM_PRESETS.findIndex(z => z >= zoomLevel);
    const nextIndex = currentIndex < ZOOM_PRESETS.length - 1 ? currentIndex + 1 : currentIndex;
    onZoomChange(ZOOM_PRESETS[nextIndex]);
  }, [zoomLevel, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    if (!onZoomChange) return;
    const currentIndex = ZOOM_PRESETS.findIndex(z => z >= zoomLevel);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    onZoomChange(ZOOM_PRESETS[prevIndex]);
  }, [zoomLevel, onZoomChange]);

  const handleZoomSelect = useCallback((value: string) => {
    if (!onZoomChange) return;
    onZoomChange(parseInt(value, 10));
  }, [onZoomChange]);

  const generateImage = async (prompt: string) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post("/generate", { prompt });
      const imageData = response.data.image;
      editor
        .chain()
        .focus()
        .setImage({ src: `data:image/png;base64,${imageData}` })
        .run();
      // Handle the response data as needed
    } catch (error) {
      console.error("Error generating text:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBold = useCallback(() => {
    editor.chain().focus().toggleBold().run();
  }, [editor]);

  const toggleUnderline = useCallback(() => {
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);

  const toggleItalic = useCallback(() => {
    editor.chain().focus().toggleItalic().run();
  }, [editor]);

  // const openModal = useCallback(() => {
  //   setIsOpen(true);
  // }, [editor]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setGenImage("");
  }, []);

  const saveLink = useCallback(async () => {
    // Generate image if a prompt is provided
    if (genImage) {
      await generateImage(genImage);
    }

    editor.commands.blur();
    closeModal();
  }, [editor, genImage, closeModal]);

  return (
    <div className="flex flex-wrap gap-1 px-4 py-2 text-center justify-center transition-colors duration-200">
      {/* Undo Button */}
      <button
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Icons.RotateLeft />
      </button>
      {/* Redo Button */}
      <button
        className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Icons.RotateRight />
      </button>

      {/* Bold Button */}
      <button
        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 ${
          editor.isActive("bold") ? "bg-gray-300 dark:bg-gray-700" : ""
        }`}
        onClick={toggleBold}
      >
        <Icons.Bold />
      </button>
      {/* Underline Button */}
      <button
        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 ${
          editor.isActive("underline")
            ? "bg-gray-300 dark:bg-gray-700" // Active state (now a softer dark gray)
            : ""
        }`}
        onClick={toggleUnderline}
      >
        <Icons.Underline />
      </button>
      {/* Italic Button */}
      <button
        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 ${
          editor.isActive("italic")
            ? "bg-gray-300 dark:bg-gray-700" // Active state (now a softer dark gray)
            : ""
        }`}
        onClick={toggleItalic}
      >
        <Icons.Italic />
      </button>

      {/* H1 Button */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 ${
          editor.isActive("heading", { level: 1 })
            ? "bg-gray-300 dark:bg-gray-700" // Active state (now a softer dark gray)
            : ""
        }`}
      >
        H1
      </button>
      {/* H2 Button */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 ${
          editor.isActive("heading", { level: 2 })
            ? "bg-gray-300 dark:bg-gray-700" // Active state (now a softer dark gray)
            : ""
        }`}
      >
        H2
      </button>
      {/* Bullet List Button */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 ${
          editor.isActive("bulletList")
            ? "bg-gray-300 dark:bg-gray-700" // Active state (now a softer dark gray)
            : ""
        }`}
      >
        <List />
      </button>

      {/* Word Count */}
      <div className="flex items-center justify-center h-12 p-2 rounded-md text-gray-500 dark:text-gray-400">
        {editor.storage.characterCount.words()} words
      </div>

      {/* Separator */}
      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
          onClick={handleZoomOut}
          disabled={zoomLevel <= ZOOM_PRESETS[0]}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <select
          value={zoomLevel}
          onChange={(e) => handleZoomSelect(e.target.value)}
          className="h-9 px-2 rounded-md bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green"
        >
          {ZOOM_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset}%
            </option>
          ))}
        </select>

        <button
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
          onClick={handleZoomIn}
          disabled={zoomLevel >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>
      
      {/* LinkModal (Keep as is) */}
      <LinkModal
        url={genImage}
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Enter Prompt Modal"
        closeModal={closeModal}
        onChangeUrl={(e) => setGenImage(e.target.value)}
        onSaveLink={saveLink}
      />
    </div>
  );
};

export default EditorHeader;
