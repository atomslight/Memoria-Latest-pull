import { createAction } from '@reduxjs/toolkit';

export const triggerLogin = createAction<{ email: string; password: string }>(
  'auth/triggerLogin',
);
export const triggerSignup = createAction<{
  email: string;
  password: string;
  name: string;
}>('auth/triggerSignup');
export const triggerLogout = createAction<void>('auth/triggerLogout');
