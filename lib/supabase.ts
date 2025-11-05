import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: any;

if (url && anon) {
  // Real Supabase client when env vars are present
  supabase = createClient(url, anon);
} else {
  // Mock supabase for UI preview (no real DB access). Minimal methods used by the app.
  // NOTE: This mock is only for development preview. Remove or revert before production.
  // eslint-disable-next-line no-console
  console.warn('[supabase] NO SUPABASE ENV FOUND — running in mock mode for UI preview');

  const mockUser = { id: 'mock-user-id', email: 'dev@local' };

  const mockFrom = () => ({
    update: async () => ({ data: null, error: null }),
    insert: async () => ({ data: null, error: null }),
    select: async () => ({ data: [], error: null }),
    delete: async () => ({ data: null, error: null }),
    eq: () => ({ update: async () => ({ data: null, error: null }) }),
  });

  supabase = {
    auth: {
      getUser: async () => ({ data: { user: mockUser }, error: null }),
      signInWithPassword: async () => ({ data: { user: mockUser }, error: null }),
      signUp: async () => ({ data: { user: mockUser }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: mockFrom,
    rpc: async () => ({ data: null, error: null }),
  };
}

export { supabase };
