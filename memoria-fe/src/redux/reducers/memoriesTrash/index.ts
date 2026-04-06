import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TrashMemoriesPayload {
  memories: unknown[];
  pagination?: { page: number; limit: number; total: number };
}

export interface MemoriesTrashState {
  data: TrashMemoriesPayload | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MemoriesTrashState = {
  data: null,
  isLoading: false,
  error: null,
};

export const memoriesTrashSlice = createSlice({
  name: 'memoriesTrash',
  initialState,
  reducers: {
    fetchMemoriesTrashRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchMemoriesTrashSuccess: (state, action: PayloadAction<TrashMemoriesPayload>) => {
      state.isLoading = false;
      state.data = action.payload;
      state.error = null;
    },
    fetchMemoriesTrashFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchMemoriesTrashRequest,
  fetchMemoriesTrashSuccess,
  fetchMemoriesTrashFailure,
} = memoriesTrashSlice.actions;

export default memoriesTrashSlice.reducer;
