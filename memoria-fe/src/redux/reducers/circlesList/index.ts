import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CircleListItem } from '../../../types/circle';

export interface CirclesListState {
  circles: CircleListItem[] | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CirclesListState = {
  circles: null,
  isLoading: false,
  error: null,
};

export const circlesListSlice = createSlice({
  name: 'circlesList',
  initialState,
  reducers: {
    fetchCirclesListRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCirclesListSuccess: (state, action: PayloadAction<CircleListItem[]>) => {
      state.isLoading = false;
      state.circles = action.payload;
      state.error = null;
    },
    fetchCirclesListFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchCirclesListRequest,
  fetchCirclesListSuccess,
  fetchCirclesListFailure,
} = circlesListSlice.actions;

export default circlesListSlice.reducer;
