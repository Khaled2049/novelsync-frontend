import React from "react";

interface StorySynopsisProps {
  description?: string;
}

export const StorySynopsis: React.FC<StorySynopsisProps> = ({
  description,
}) => {
  return (
    <section className="mb-12">
      <h3 className="text-xs font-bold font-heading uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">
        Synopsis
      </h3>
      <div className="prose prose-lg dark:prose-invert max-w-none text-black/80 dark:text-white/80 leading-relaxed font-body">
        <p>{description || "No description available."}</p>
      </div>
    </section>
  );
};
