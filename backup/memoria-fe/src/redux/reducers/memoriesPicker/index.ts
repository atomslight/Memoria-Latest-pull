import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MemoriesResponse } from '../../../utils/api';

export interface MemoriesPickerState {
  pages: MemoriesResponse[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
}

const initialState: MemoriesPickerState = {
  pages: [],
  isLoading: false,
  isFetchingMore: false,
  error: null,
};

export const memoriesPickerSlice = createSlice({
  name: 'memoriesPicker',
  initialState,
  reducers: {
    fetchMemoriesPickerPageRequest: (
      state,
      action: PayloadAction<{ page: number; reset?: boolean }>,
    ) => {
      if (action.payload.reset) {
        state.pages = [];
      }
      if (action.payload.page === 1) {
        state.isLoading = true;
        state.isFetchingMore = false;
      } else {
        state.isFetchingMore = true;
      }
      state.error = null;
    },
    fetchMemoriesPickerPageSuccess: (
      state,
      action: PayloadAction<{ page: number; data: MemoriesResponse }>,
    ) => {
      const { page, data } = action.payload;
      state.isLoading = false;
      state.isFetchingMore = false;
      state.error = null;
      if (page === 1) {
        state.pages = [data];
      } else {
        state.pages.push(data);
      }
    },
    fetchMemoriesPickerPageFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isFetchingMore = false;
      state.error = action.payload;
    },
    resetMemoriesPicker: () => initialState,
  },
});

export const {
  fetchMemoriesPickerPageRequest,
  fetchMemoriesPickerPageSuccess,
  fetchMemoriesPickerPageFailure,
  resetMemoriesPicker,
} = memoriesPickerSlice.actions;

export default memoriesPickerSlice.reducer;
