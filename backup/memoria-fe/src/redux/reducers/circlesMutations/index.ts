import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type CirclesMutationKey =
  | 'createCircle'
  | 'addPhotoToCircle'
  | 'addMember'
  | 'removeMember'
  | 'deleteCircle';

export interface BulkShareResult {
  successCount: number;
  errors: string[];
}

export type CirclesMutationCallbackKey =
  | 'createCircle'
  | 'addMember'
  | 'removeMember'
  | 'deleteCircle';

export interface CirclesMutationSettled {
  key: CirclesMutationCallbackKey;
  ok: boolean;
  errorMessage?: string;
}

export interface CirclesMutationsState {
  pending: Record<CirclesMutationKey, boolean>;
  bulkShare: BulkShareResult | null;
  lastSettled: CirclesMutationSettled | null;
}

const initialState: CirclesMutationsState = {
  pending: {
    createCircle: false,
    addPhotoToCircle: false,
    addMember: false,
    removeMember: false,
    deleteCircle: false,
  },
  bulkShare: null,
  lastSettled: null,
};

export const circlesMutationsSlice = createSlice({
  name: 'circlesMutations',
  initialState,
  reducers: {
    setCirclesMutationPending: (
      state,
      action: PayloadAction<{ key: CirclesMutationKey; value: boolean }>,
    ) => {
      state.pending[action.payload.key] = action.payload.value;
    },
    sharePhotosToCircleFinished: (state, action: PayloadAction<BulkShareResult>) => {
      state.bulkShare = action.payload;
    },
    clearBulkShareResult: (state) => {
      state.bulkShare = null;
    },
    circlesMutationSettled: (
      state,
      action: PayloadAction<CirclesMutationSettled>,
    ) => {
      state.lastSettled = action.payload;
    },
    clearCirclesMutationSettled: (state) => {
      state.lastSettled = null;
    },
  },
});

export const {
  setCirclesMutationPending,
  sharePhotosToCircleFinished,
  clearBulkShareResult,
  circlesMutationSettled,
  clearCirclesMutationSettled,
} = circlesMutationsSlice.actions;

export default circlesMutationsSlice.reducer;
