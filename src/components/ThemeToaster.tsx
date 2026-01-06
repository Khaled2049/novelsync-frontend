import { Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeToaster = () => {
  const { theme } = useTheme();

  return <Toaster position="top-right" richColors closeButton theme={theme} />;
};
