import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CirclePhotosResponse } from '../../../types/circle';

export interface CirclePhotosState {
  byCircleId: Record<string, CirclePhotosResponse | undefined>;
  loadingIds: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

const initialState: CirclePhotosState = {
  byCircleId: {},
  loadingIds: {},
  errors: {},
};

export const circlePhotosSlice = createSlice({
  name: 'circlePhotos',
  initialState,
  reducers: {
    fetchCirclePhotosRequest: (
      state,
      action: PayloadAction<{ circleId: string; page?: number; limit?: number }>,
    ) => {
      const { circleId } = action.payload;
      state.loadingIds[circleId] = true;
      state.errors[circleId] = undefined;
    },
    fetchCirclePhotosSuccess: (
      state,
      action: PayloadAction<{ circleId: string; data: CirclePhotosResponse }>,
    ) => {
      const { circleId, data } = action.payload;
      state.loadingIds[circleId] = false;
      state.byCircleId[circleId] = data;
      state.errors[circleId] = undefined;
    },
    fetchCirclePhotosFailure: (
      state,
      action: PayloadAction<{ circleId: string; message: string }>,
    ) => {
      const { circleId, message } = action.payload;
      state.loadingIds[circleId] = false;
      state.errors[circleId] = message;
    },
  },
});

export const {
  fetchCirclePhotosRequest,
  fetchCirclePhotosSuccess,
  fetchCirclePhotosFailure,
} = circlePhotosSlice.actions;

export default circlePhotosSlice.reducer;
