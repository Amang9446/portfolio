"use client";

// Minimal theme provider.
//
// We replaced next-themes because its ThemeProvider renders an inline
// <script> from a client component, which React 19.2 flags with
// "Encountered a script tag while rendering React component" on every client
// render. Owning the theme logic keeps the same behavior (system-aware,
// persisted, pre-hydration boot) with no client-rendered script — the boot
// script is a server component (theme-script.tsx), and this provider only
// manages state, the `dark` class, and listeners.
//
// The public surface matches what the app used from next-themes: a
// ThemeProvider wrapper and a useTheme() hook exposing `theme`,
// `resolvedTheme`, and `setTheme`.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme";
const MEDIA_QUERY = "(prefers-color-scheme: dark)";

// --- external stores (read via useSyncExternalStore) ------------------------

function subscribePreference(onStoreChange: () => void) {
  const media = window.matchMedia(MEDIA_QUERY);
  const onMedia = () => {
    if (readStoredTheme() === "system") onStoreChange();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  media.addEventListener("change", onMedia);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onStorage);
  };
}

function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function readResolvedTheme(): ResolvedTheme {
  const stored = readStoredTheme();
  return stored === "system" ? systemTheme() : stored;
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

// Server snapshots must be stable values so SSR markup matches the first
// client render (the boot script already painted the real theme).
const serverThemeSnapshot = () => "system" as Theme;
const serverResolvedSnapshot = () => "light" as ResolvedTheme;

// ---------------------------------------------------------------------------

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribePreference,
    readStoredTheme,
    serverThemeSnapshot,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribePreference,
    readResolvedTheme,
    serverResolvedSnapshot,
  );

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing may block storage; the in-memory theme still applies.
    }
    const resolved = next === "system" ? systemTheme() : next;
    applyResolvedTheme(resolved);
    // Notify the external-store subscribers so `theme`/`resolvedTheme` update.
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }, []);

  // The boot script painted the correct class before hydration, so nothing
  // needs to happen on mount — only react to explicit changes. When the OS
  // theme flips while set to "system", the store notifies and we re-apply.
  useEffect(() => {
    if (theme !== "system") return;
    applyResolvedTheme(readResolvedTheme());
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return value;
}
