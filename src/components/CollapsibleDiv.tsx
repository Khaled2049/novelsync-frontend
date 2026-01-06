import { useState } from "react";

interface CollapsibleDivProps {
  title: string;
  children: React.ReactNode;
}

const CollapsibleDiv = ({ title, children }: CollapsibleDivProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-black/20 dark:border-white/20 rounded-lg bg-neutral-50 dark:bg-black shadow mb-4 transition-colors duration-200">
      <button
        className="w-full p-4 text-left text-2xl text-black dark:text-white font-medium hover:bg-black/5 dark:hover:bg-neutral-50/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark-green dark:focus:ring-light-green focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
      </button>
      <div
        className={`transition-all duration-300 overflow-hidden w-full ${
          isOpen ? "max-h-screen" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default CollapsibleDiv;
