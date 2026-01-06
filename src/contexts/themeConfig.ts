export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
}

export interface Theme {
  light: ThemeColors;
  dark: ThemeColors;
}

export const theme: Theme = {
  light: {
    background: "bg-cream-100",
    text: "text-gray-800",
    primary: "text-indigo-700",
    secondary: "text-teal-600",
    accent: "",
    border: "border-gray-300",
  },
  dark: {
    background: "bg-gray-900",
    text: "text-gray-100",
    primary: "text-indigo-400",
    secondary: "text-teal-400",
    accent: "",
    border: "border-gray-700",
  },
};
