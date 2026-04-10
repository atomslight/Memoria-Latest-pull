import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';

export type Language = 'english' | 'hinglish';
export type ViewMode = 'grid' | 'threaded' | 'gitcommit';
export type ThemeMode = 'system' | 'light' | 'dark';

interface SmartPlaces {
  home: string | null;
  work: string | null;
}

interface PreferencesState {
  language: Language;
  viewMode: ViewMode;
  themeMode: ThemeMode;
  smartPlaces: SmartPlaces;

  // Actions
  setLanguage: (language: Language) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
  setSmartPlace: (place: 'home' | 'work', address: string | null) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'english',
      viewMode: 'grid',
      themeMode: 'system',
      smartPlaces: { home: null, work: null },

      setLanguage: (language) => set({ language }),
      setViewMode: (viewMode) => set({ viewMode }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setSmartPlace: (place, address) =>
        set((state) => ({
          smartPlaces: { ...state.smartPlaces, [place]: address },
        })),
    }),
    {
      name: 'memoria_preferences',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
