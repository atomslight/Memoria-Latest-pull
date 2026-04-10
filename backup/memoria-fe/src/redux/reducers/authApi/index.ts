import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthApiState {
  loginPending: boolean;
  signupPending: boolean;
  logoutPending: boolean;
  lastError: string | null;
}

const initialState: AuthApiState = {
  loginPending: false,
  signupPending: false,
  logoutPending: false,
  lastError: null,
};

export const authApiSlice = createSlice({
  name: 'authApi',
  initialState,
  reducers: {
    loginRequest: (state) => {
      state.loginPending = true;
      state.lastError = null;
    },
    loginSuccess: (state) => {
      state.loginPending = false;
      state.lastError = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loginPending = false;
      state.lastError = action.payload;
    },
    signupRequest: (state) => {
      state.signupPending = true;
      state.lastError = null;
    },
    signupSuccess: (state) => {
      state.signupPending = false;
      state.lastError = null;
    },
    signupFailure: (state, action: PayloadAction<string>) => {
      state.signupPending = false;
      state.lastError = action.payload;
    },
    logoutRequest: (state) => {
      state.logoutPending = true;
      state.lastError = null;
    },
    logoutSettled: (state) => {
      state.logoutPending = false;
    },
  },
});

export const {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  logoutRequest,
  logoutSettled,
} = authApiSlice.actions;

export default authApiSlice.reducer;
