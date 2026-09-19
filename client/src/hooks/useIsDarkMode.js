import { useState, useEffect } from "react";

/**
 * Tracks whether the `dark` class is present on <html>, so non-Tailwind
 * consumers (e.g. recharts SVG props) can react to theme changes triggered
 * from Settings without a page reload.
 */
export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const target = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(target.classList.contains("dark"));
    });
    observer.observe(target, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default useIsDarkMode;
