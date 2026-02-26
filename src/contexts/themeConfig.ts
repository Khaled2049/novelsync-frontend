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
    background: "bg-ns-bg",
    text: "text-ns-ink",
    primary: "text-ns-accent",
    secondary: "text-ns-ink-secondary",
    accent: "text-ns-gold",
    border: "border-ns-border",
  },
  dark: {
    background: "bg-ns-bg",
    text: "text-ns-ink",
    primary: "text-ns-accent",
    secondary: "text-ns-ink-secondary",
    accent: "text-ns-gold",
    border: "border-ns-border",
  },
};
