import { useCallback, useEffect, useState } from "react";

function readHash(tabs: readonly string[], defaultTab: string): string {
  const current = window.location.hash.replace(/^#/, "");
  return (tabs as string[]).includes(current) ? current : defaultTab;
}

/**
 * Tab state synced to the URL hash so a shared link can open on a specific
 * tab. Uses `replaceState` (not `pushState`) so switching tabs doesn't spam
 * the browser's back-button history.
 */
export function useHashTab(
  tabs: readonly string[],
  defaultTab: string,
): [string, (tab: string) => void] {
  const [tab, setTabState] = useState(() => readHash(tabs, defaultTab));

  useEffect(() => {
    const onHashChange = () => setTabState(readHash(tabs, defaultTab));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = useCallback((next: string) => {
    setTabState(next);
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.replaceState(null, "", url);
  }, []);

  return [tab, setTab];
}
