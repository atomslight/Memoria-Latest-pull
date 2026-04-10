import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { registerConfig } from '../config/registerConfig';

/**
 * Ephemeral client: registration only. No persisted Supabase session (login uses Memoria API).
 */
const registerSupabase = createClient(
  registerConfig.supabaseUrl,
  registerConfig.supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export type RegisterWithSupabaseResult =
  | {
      ok: true;
      mode: 'session';
      userId: string;
      email: string;
      name: string;
      accessToken: string;
    }
  | { ok: true; mode: 'email_confirmation_required' };

/**
 * Supabase-backed sign-up (fallback when POST /api/v1/auth/register is unavailable).
 */
export async function registerWithSupabase(
  email: string,
  password: string,
  name: string
): Promise<RegisterWithSupabaseResult> {
  const { data, error } = await registerSupabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    throw new Error(error.message ?? 'Sign up failed');
  }
  if (!data.user) {
    throw new Error('Sign up failed');
  }

  if (data.session) {
    return {
      ok: true,
      mode: 'session',
      userId: data.session.user.id,
      email: data.session.user.email!,
      name:
        (data.session.user.user_metadata?.name as string | undefined) || name,
      accessToken: data.session.access_token,
    };
  }

  return { ok: true, mode: 'email_confirmation_required' };
}
