import React from "react";
import { HelmetProvider } from "react-helmet-async";

/**
 * HelmetProvider wrapper for the application
 * This is required for react-helmet-async to work properly
 */
export const SEOProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <HelmetProvider>{children}</HelmetProvider>;
};
