import { create } from 'zustand';
import axios from 'axios';
import { registerWithSupabase } from '../auth/register';
import { asyncStorage } from '../utils/storage';
import { getApiBaseUrl } from '../config/appConfig';
import { isNetworkFailure } from '../utils/networkDebug';

interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  profilePicUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export function mapBackendAuthResponse(data: unknown): {
  user: User;
  accessToken: string;
  refreshToken?: string;
} {
  const d = data as Record<string, unknown>;
  const accessToken =
    (d?.accessToken as string | undefined) ??
    (d?.access_token as string | undefined) ??
    (d?.token as string | undefined) ??
    ((d?.session as Record<string, unknown> | undefined)?.access_token as
      | string
      | undefined);
  const refreshToken =
    (d?.refreshToken as string | undefined) ??
    (d?.refresh_token as string | undefined) ??
    ((d?.session as Record<string, unknown> | undefined)?.refresh_token as
      | string
      | undefined);
  const rawUser =
    (d?.user as Record<string, unknown> | undefined) ??
    ((d?.session as Record<string, unknown> | undefined)?.user as
      | Record<string, unknown>
      | undefined);
  if (!accessToken || !rawUser || typeof rawUser.email !== 'string') {
    throw new Error('Unexpected response from server');
  }
  const id = (rawUser.id ?? rawUser.user_id) as string | undefined;
  if (!id) {
    throw new Error('Unexpected response from server');
  }
  const email = rawUser.email as string;
  const name =
    (rawUser.name as string | undefined) ??
    (rawUser.user_metadata as Record<string, unknown> | undefined)?.name
      ?.toString() ??
    email.split('@')[0];
  return {
    user: { id: String(id), email, name },
    accessToken,
    refreshToken,
  };
}

/** When Memoria signup route is missing, try Supabase register (see `src/auth/register.ts`). */
function shouldFallbackRegisterWithSupabase(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;
    const body = err.response?.data;
    if (s === 404) return true;
    if (typeof body === 'string' && body.includes('Cannot POST')) return true;
    if (s === 401 || s === 403) return false;
    if (s != null && s >= 400 && s < 500 && s !== 404) return false;
    if (s != null && s >= 500) return true;
    if (!err.response) return true;
    return false;
  }
  return true;
}

function backendAuthErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | string | undefined;
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }
    if (s === 401) return 'Invalid email or password';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

async function persistSession(
  set: (partial: Partial<AuthState>) => void,
  user: User,
  accessToken: string,
  refreshToken?: string
) {
  await asyncStorage.setItem('auth.user', JSON.stringify(user));
  await asyncStorage.setItem('auth.token', accessToken);
  if (refreshToken) {
    await asyncStorage.setItem('auth.refreshToken', refreshToken);
  }
  set({
    user,
    token: accessToken,
    refreshToken: refreshToken ?? null,
    isAuthenticated: true,
    isLoading: false,
  });
}

const backendClient = axios.create({
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  signUp: async (email, password, name) => {
    console.log('[AUTH] signUp called', { email, name });

    try {
      const { data } = await backendClient.post(
        `${getApiBaseUrl()}/api/v1/auth/register`,
        { email, password, name }
      );
      const mapped = mapBackendAuthResponse(data);
      await persistSession(set, mapped.user, mapped.accessToken, mapped.refreshToken);
    } catch (err: unknown) {
      if (!shouldFallbackRegisterWithSupabase(err)) {
        throw new Error(backendAuthErrorMessage(err));
      }
      try {
        const result = await registerWithSupabase(email, password, name);
        if (result.mode === 'email_confirmation_required') {
          throw new Error(
            'Please check your email and confirm your account, then sign in.'
          );
        }
        const user: User = {
          id: result.userId,
          email: result.email,
          name: result.name,
        };
        await persistSession(set, user, result.accessToken);
      } catch (regErr: unknown) {
        const msg =
          regErr instanceof Error ? regErr.message : 'Sign up failed';
        if (isNetworkFailure(msg)) {
          throw new Error(
            'Cannot complete sign up. Deploy POST /api/v1/auth/register on your API, or fix EXPO_PUBLIC_SUPABASE_URL in .env (Supabase → Settings → API).'
          );
        }
        throw new Error(msg);
      }
    }
  },

  signIn: async (email, password) => {
    console.log('[AUTH] signIn called', { email });

    try {
      const { data } = await backendClient.post(
        `${getApiBaseUrl()}/api/v1/auth/login`,
        { email, password }
      );
      const mapped = mapBackendAuthResponse(data);
      await persistSession(set, mapped.user, mapped.accessToken, mapped.refreshToken);
    } catch (err: unknown) {
      throw new Error(backendAuthErrorMessage(err));
    }
  },

  signOut: async () => {
    console.log('[AUTH] signOut called');
    const token = get().token;
    try {
      if (token) {
        await backendClient.post(
          `${getApiBaseUrl()}/api/v1/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      /* ignore */
    }
    await asyncStorage.removeItem('auth.user');
    await asyncStorage.removeItem('auth.token');
    await asyncStorage.removeItem('auth.refreshToken');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: async (user, token) => {
    await asyncStorage.setItem('auth.user', JSON.stringify(user));
    await asyncStorage.setItem('auth.token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  clearAuth: async () => {
    await asyncStorage.removeItem('auth.user');
    await asyncStorage.removeItem('auth.token');
    await asyncStorage.removeItem('auth.refreshToken');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadAuth: async () => {
    console.log('[AUTH] loadAuth: checking storage for saved session...');
    try {
      const userJson = await asyncStorage.getItem('auth.user');
      const token = await asyncStorage.getItem('auth.token');
      const refreshToken = await asyncStorage.getItem('auth.refreshToken');

      if (userJson && token) {
        const user = JSON.parse(userJson) as User;
        console.log('[AUTH] loadAuth: found saved session', {
          userId: user.id,
          email: user.email,
        });
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.log('[AUTH] loadAuth: no saved session found');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[AUTH] loadAuth error:', error);
      set({ isLoading: false });
    }
  },
}));
