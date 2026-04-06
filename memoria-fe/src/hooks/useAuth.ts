import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  triggerLogin,
  triggerSignup,
  triggerLogout,
} from '../redux/actions/authTriggers';

interface SignupData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

export function useSignup() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.authApi.signupPending);
  const error = useAppSelector((s) => s.authApi.lastError);

  const mutate = useCallback(
    (data: SignupData) => {
      dispatch(triggerSignup(data));
    },
    [dispatch],
  );

  return {
    mutate,
    mutateAsync: async (data: SignupData) => {
      dispatch(triggerSignup(data));
    },
    isPending,
    error: error ? new Error(error) : null,
  };
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.authApi.loginPending);
  const error = useAppSelector((s) => s.authApi.lastError);

  const mutate = useCallback(
    (data: LoginData) => {
      dispatch(triggerLogin(data));
    },
    [dispatch],
  );

  return {
    mutate,
    mutateAsync: async (data: LoginData) => {
      dispatch(triggerLogin(data));
    },
    isPending,
    error: error ? new Error(error) : null,
  };
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.authApi.logoutPending);

  const mutate = useCallback(() => {
    dispatch(triggerLogout());
  }, [dispatch]);

  return {
    mutate,
    mutateAsync: async () => {
      dispatch(triggerLogout());
    },
    isPending,
  };
}
