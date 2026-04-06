import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SearchResultItem {
  id: string;
  caption: string | null;
  thumbnailMedium: string | null;
  capturedAt: string;
  score: number;
}

export interface SearchResponseState {
  results: SearchResultItem[];
  pagination: { page: number; limit: number; total: number };
}

export interface SearchQueryState {
  data: SearchResponseState | null;
  isLoading: boolean;
  error: string | null;
  query: string;
}

const initialState: SearchQueryState = {
  data: null,
  isLoading: false,
  error: null,
  query: '',
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    fetchSearchRequest: (
      state,
      action: PayloadAction<{ query: string; page?: number; limit?: number }>,
    ) => {
      state.query = action.payload.query;
      state.isLoading = true;
      state.error = null;
    },
    fetchSearchSuccess: (state, action: PayloadAction<SearchResponseState>) => {
      state.isLoading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchSearchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearSearchResults: () => initialState,
  },
});

export const {
  fetchSearchRequest,
  fetchSearchSuccess,
  fetchSearchFailure,
  clearSearchResults,
} = searchSlice.actions;

export default searchSlice.reducer;
