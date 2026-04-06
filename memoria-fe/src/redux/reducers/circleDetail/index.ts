import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CircleDetail } from '../../../types/circle';

export interface CircleDetailState {
  entities: Record<string, CircleDetail | undefined>;
  loadingIds: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

const initialState: CircleDetailState = {
  entities: {},
  loadingIds: {},
  errors: {},
};

export const circleDetailSlice = createSlice({
  name: 'circleDetail',
  initialState,
  reducers: {
    fetchCircleDetailRequest: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      state.loadingIds[id] = true;
      state.errors[id] = undefined;
    },
    fetchCircleDetailSuccess: (
      state,
      action: PayloadAction<{ id: string; data: CircleDetail }>,
    ) => {
      const { id, data } = action.payload;
      state.loadingIds[id] = false;
      state.entities[id] = data;
      state.errors[id] = undefined;
    },
    fetchCircleDetailFailure: (
      state,
      action: PayloadAction<{ id: string; message: string }>,
    ) => {
      const { id, message } = action.payload;
      state.loadingIds[id] = false;
      state.errors[id] = message;
    },
  },
});

export const {
  fetchCircleDetailRequest,
  fetchCircleDetailSuccess,
  fetchCircleDetailFailure,
} = circleDetailSlice.actions;

export default circleDetailSlice.reducer;
