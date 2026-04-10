/**
 * Supabase is only used for account registration (sign-up fallback).
 * Login and session use the Memoria API + local auth storage.
 */
export const registerConfig = {
  supabaseUrl:
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    'https://nqxwmpzwwovfcvyfsl.supabase.co',
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xeHZ3bXB6dnd2b2Z2dmN5ZnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzM3MDMsImV4cCI6MjA5MDIwOTcwM30.FI29Y5ZaYFjWon1PxTOqWnTa2govvqQSoYZcYXOUvxs',
};
