"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@krizaka/icons";
import { useTheme } from "@krizaka/ui/theme";

const DARK = "(prefers-color-scheme: dark)";
const subscribe = (onChange: () => void) => {
  const query = globalThis.matchMedia(DARK);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/** Dark ⇄ light, persisted by the @krizaka/ui theme as `kz-theme`. */
export default function ThemeToggle({ toLight, toDark }: Readonly<{ toLight: string; toDark: string }>) {
  const { mode, setMode } = useTheme();
  const systemDark = useSyncExternalStore(subscribe, () => globalThis.matchMedia(DARK).matches, () => true);
  const theme = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  return (
    <button
      type="button"
      className="kz-icon-button"
      aria-label={theme === "dark" ? toLight : toDark}
      onClick={() => setMode(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <SunIcon size={18} aria-hidden /> : <MoonIcon size={18} aria-hidden />}
    </button>
  );
}
