import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ActivityState {
  data: unknown;
  isLoading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  data: null,
  isLoading: false,
  error: null,
};

export const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    fetchActivityRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchActivitySuccess: (state, action: PayloadAction<unknown>) => {
      state.isLoading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchActivityFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchActivityRequest,
  fetchActivitySuccess,
  fetchActivityFailure,
} = activitySlice.actions;

export default activitySlice.reducer;
