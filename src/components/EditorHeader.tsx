import { useCallback, useState } from "react";
import * as Icons from "./Icons";
import { Editor } from "@tiptap/react";
import { LinkModal } from "./LinkModal";
import axiosInstance from "../api";
// import { RiAiGenerate } from "react-icons/ri";
import { List } from "lucide-react";
interface EditorHeaderProps {
  editor: Editor;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ editor }) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const [genImage, setGenImage] = useState("");
  const [_isLoading, setIsLoading] = useState(false);

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
    <div className="flex flex-wrap gap-2 p-2 w-full text-center justify-center dark:bg-transparent transition-colors duration-200 border-b border-gray-200 dark:border-gray-800">
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
