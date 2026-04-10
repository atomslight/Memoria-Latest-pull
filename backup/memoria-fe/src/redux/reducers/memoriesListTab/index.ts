import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MemoriesResponse } from '../../../utils/api';

export interface MemoriesListTabState {
  data: MemoriesResponse | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MemoriesListTabState = {
  data: null,
  isLoading: false,
  error: null,
};

export const memoriesListTabSlice = createSlice({
  name: 'memoriesListTab',
  initialState,
  reducers: {
    fetchMemoriesListTabRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMemoriesListTabSuccess: (state, action: PayloadAction<MemoriesResponse>) => {
      state.isLoading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchMemoriesListTabFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchMemoriesListTabRequest,
  fetchMemoriesListTabSuccess,
  fetchMemoriesListTabFailure,
} = memoriesListTabSlice.actions;

export default memoriesListTabSlice.reducer;
