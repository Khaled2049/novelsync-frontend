import React from "react";
import { BookPlus, Upload } from "lucide-react";

interface SaveControlsProps {
  isPublished: boolean;
  // saveStatus: string;
  onPublish: () => void;
  onNewChapter: () => void;
}

export const SaveControls: React.FC<SaveControlsProps> = ({
  isPublished,
  // saveStatus,
  onPublish,
  onNewChapter,
}) => {
  return (
    <div className="bg-neutral-50 dark:bg-black p-4 rounded-lg transition-colors duration-200">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPublish}
          className={`p-3 flex items-center justify-center rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isPublished
              ? "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 focus:ring-offset-white dark:focus:ring-offset-black"
              : "bg-dark-green dark:bg-light-green text-white hover:bg-light-green dark:hover:bg-dark-green focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-white dark:focus:ring-offset-black"
          }`}
        >
          <Upload className="w-5 h-5 mr-2" />
          <span>{isPublished ? "Unpublish" : "Publish"}</span>
        </button>

        <button
          onClick={onNewChapter}
          className="p-3 bg-dark-green dark:bg-light-green text-white rounded-lg shadow-sm hover:bg-light-green dark:hover:bg-dark-green transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
        >
          <BookPlus className="w-5 h-5 mr-2" />
          <span>New Chapter</span>
        </button>
      </div>
    </div>
  );
};
