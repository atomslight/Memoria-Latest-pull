import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserSearchResult } from '../../../types/circle';

export interface UserSearchState {
  query: string;
  users: UserSearchResult[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserSearchState = {
  query: '',
  users: [],
  isLoading: false,
  error: null,
};

export const userSearchSlice = createSlice({
  name: 'userSearch',
  initialState,
  reducers: {
    fetchUserSearchRequest: (state, action: PayloadAction<{ query: string }>) => {
      state.query = action.payload.query;
      state.isLoading = true;
      state.error = null;
    },
    fetchUserSearchSuccess: (state, action: PayloadAction<UserSearchResult[]>) => {
      state.isLoading = false;
      state.users = action.payload;
      state.error = null;
    },
    fetchUserSearchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearUserSearch: () => initialState,
  },
});

export const {
  fetchUserSearchRequest,
  fetchUserSearchSuccess,
  fetchUserSearchFailure,
  clearUserSearch,
} = userSearchSlice.actions;

export default userSearchSlice.reducer;
