import { useEffect, useState } from "react";

const LG_MEDIA_QUERY = "(min-width: 1024px)";

export function useBreakpoint() {
  const getInitialState = () => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(LG_MEDIA_QUERY).matches;
  };

  const [isLgUp, setIsLgUp] = useState<boolean>(getInitialState);

  useEffect(() => {
    const mediaQuery = window.matchMedia(LG_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsLgUp(event.matches);
    };

    setIsLgUp(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return { isLgUp };
}
