import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsStatsState {
  totalMemories: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsStatsState = {
  totalMemories: null,
  isLoading: false,
  error: null,
};

export const settingsStatsSlice = createSlice({
  name: 'settingsStats',
  initialState,
  reducers: {
    fetchSettingsStatsRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchSettingsStatsSuccess: (state, action: PayloadAction<number>) => {
      state.isLoading = false;
      state.totalMemories = action.payload;
      state.error = null;
    },
    fetchSettingsStatsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchSettingsStatsRequest,
  fetchSettingsStatsSuccess,
  fetchSettingsStatsFailure,
} = settingsStatsSlice.actions;

export default settingsStatsSlice.reducer;
