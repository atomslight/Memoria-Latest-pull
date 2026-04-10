import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** Minimal memory row used in Share-to-circle search grid */
export interface MemorySearchHit {
  id: string;
  thumbnailSmall: string;
  thumbnailMedium: string;
  caption: string | null;
  capturedAt: string;
}

export interface MemoryEmbeddingSearchState {
  query: string;
  results: MemorySearchHit[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MemoryEmbeddingSearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
};

export const memoryEmbeddingSearchSlice = createSlice({
  name: 'memoryEmbeddingSearch',
  initialState,
  reducers: {
    fetchMemoryEmbeddingSearchRequest: (
      state,
      action: PayloadAction<{ query: string }>,
    ) => {
      state.query = action.payload.query;
      state.isLoading = true;
      state.error = null;
    },
    fetchMemoryEmbeddingSearchSuccess: (
      state,
      action: PayloadAction<MemorySearchHit[]>,
    ) => {
      state.isLoading = false;
      state.results = action.payload;
      state.error = null;
    },
    fetchMemoryEmbeddingSearchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearMemoryEmbeddingSearch: () => initialState,
  },
});

export const {
  fetchMemoryEmbeddingSearchRequest,
  fetchMemoryEmbeddingSearchSuccess,
  fetchMemoryEmbeddingSearchFailure,
  clearMemoryEmbeddingSearch,
} = memoryEmbeddingSearchSlice.actions;

export default memoryEmbeddingSearchSlice.reducer;
