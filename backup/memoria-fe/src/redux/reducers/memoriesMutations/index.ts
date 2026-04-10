import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MemoriesMutationsState {
  uploadPending: boolean;
  updatePending: boolean;
  deletePending: boolean;
  lastError: string | null;
}

const initialState: MemoriesMutationsState = {
  uploadPending: false,
  updatePending: false,
  deletePending: false,
  lastError: null,
};

export const memoriesMutationsSlice = createSlice({
  name: 'memoriesMutations',
  initialState,
  reducers: {
    setUploadPending: (state, action: PayloadAction<boolean>) => {
      state.uploadPending = action.payload;
    },
    setUpdatePending: (state, action: PayloadAction<boolean>) => {
      state.updatePending = action.payload;
    },
    setDeletePending: (state, action: PayloadAction<boolean>) => {
      state.deletePending = action.payload;
    },
    setMemoriesMutationError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload;
    },
    clearMemoriesMutationError: (state) => {
      state.lastError = null;
    },
  },
});

export const {
  setUploadPending,
  setUpdatePending,
  setDeletePending,
  setMemoriesMutationError,
  clearMemoriesMutationError,
} = memoriesMutationsSlice.actions;

export default memoriesMutationsSlice.reducer;
