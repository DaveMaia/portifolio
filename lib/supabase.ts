import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createSupabaseBrowserClient = () => {
  if (!url || !anonKey) {
    throw new Error('Supabase client env vars are missing');
  }
  return createBrowserClient(url, anonKey);
};

export const createSupabaseServerClient = () => {
  if (!url || !anonKey) {
    throw new Error('Supabase server env vars are missing');
  }
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.delete({ name, ...options });
      }
    }
  });
};

export const createSupabaseServiceRoleClient = (): SupabaseClient => {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Service role client env vars are missing');
  }
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
