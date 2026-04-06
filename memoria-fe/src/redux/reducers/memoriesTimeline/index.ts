import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MemoriesResponse } from '../../../utils/api';

export interface MemoriesTimelineState {
  pages: MemoriesResponse[];
  isLoading: boolean;
  isFetchingMore: boolean;
  error: string | null;
}

const initialState: MemoriesTimelineState = {
  pages: [],
  isLoading: false,
  isFetchingMore: false,
  error: null,
};

export const memoriesTimelineSlice = createSlice({
  name: 'memoriesTimeline',
  initialState,
  reducers: {
    fetchMemoriesTimelinePageRequest: (
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
    fetchMemoriesTimelinePageSuccess: (
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
    fetchMemoriesTimelinePageFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isFetchingMore = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchMemoriesTimelinePageRequest,
  fetchMemoriesTimelinePageSuccess,
  fetchMemoriesTimelinePageFailure,
} = memoriesTimelineSlice.actions;

export default memoriesTimelineSlice.reducer;
