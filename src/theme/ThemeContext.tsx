import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from 'expo-sqlite/kv-store';
import { Palette, palettes, ThemeId } from './colors';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'ivvy.theme';
const MODE_KEY = 'ivvy.mode';

interface ThemeContextValue {
  colors: Palette;
  themeId: ThemeId;
  /** false hasta que el tema persistido haya sido cargado. */
  ready: boolean;
  /** false mientras el usuario no haya elegido familia (onboarding). */
  chosen: boolean;
  mode: ThemeMode;
  isDark: boolean;
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>('elegant');
  const [chosen, setChosen] = useState(false);
  const [mode, setModeState] = useState<ThemeMode>(system === 'dark' ? 'dark' : 'light');
  const [ready, setReady] = useState(false);

  // Carga el tema persistido al arrancar (kv-store: SQLite en nativo, localStorage en web).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedTheme, savedMode] = await Promise.all([
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(MODE_KEY),
        ]);
        if (!active) return;
        if (savedTheme === 'elegant' || savedTheme === 'pastel') {
          setThemeIdState(savedTheme);
          setChosen(true);
          if (savedMode === 'light' || savedMode === 'dark') setModeState(savedMode);
        }
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const palette = palettes[themeId][mode];

    const setThemeId = (id: ThemeId) => {
      setThemeIdState(id);
      setChosen(true);
      AsyncStorage.setItem(THEME_KEY, id).catch(() => {});
    };

    const setMode = (next: ThemeMode) => {
      setModeState(next);
      AsyncStorage.setItem(MODE_KEY, next).catch(() => {});
    };

    return {
      colors: palette,
      themeId,
      ready,
      chosen,
      mode,
      isDark: mode === 'dark',
      setThemeId,
      setMode,
      toggleMode: () => setMode(mode === 'light' ? 'dark' : 'light'),
    };
  }, [themeId, mode, ready, chosen]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}