import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MemoryDetailState {
  entities: Record<string, unknown>;
  loadingIds: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

const initialState: MemoryDetailState = {
  entities: {},
  loadingIds: {},
  errors: {},
};

export const memoryDetailSlice = createSlice({
  name: 'memoryDetail',
  initialState,
  reducers: {
    fetchMemoryDetailRequest: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      state.loadingIds[id] = true;
      state.errors[id] = undefined;
    },
    fetchMemoryDetailSuccess: (
      state,
      action: PayloadAction<{ id: string; data: unknown }>,
    ) => {
      const { id, data } = action.payload;
      state.loadingIds[id] = false;
      state.entities[id] = data;
      state.errors[id] = undefined;
    },
    fetchMemoryDetailFailure: (
      state,
      action: PayloadAction<{ id: string; message: string }>,
    ) => {
      const { id, message } = action.payload;
      state.loadingIds[id] = false;
      state.errors[id] = message;
    },
    clearMemoryDetail: (state, action: PayloadAction<string>) => {
      delete state.entities[action.payload];
      delete state.loadingIds[action.payload];
      delete state.errors[action.payload];
    },
  },
});

export const {
  fetchMemoryDetailRequest,
  fetchMemoryDetailSuccess,
  fetchMemoryDetailFailure,
  clearMemoryDetail,
} = memoryDetailSlice.actions;

export default memoryDetailSlice.reducer;
