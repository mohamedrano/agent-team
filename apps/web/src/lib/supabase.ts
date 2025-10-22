import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

let _supabase: ReturnType<typeof createClientComponentClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClientComponentClient();
  }
  return _supabase;
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  const supabase = getSupabase();
  return await supabase.auth.signUp({ email, password });
}

export async function signOut() {
  const supabase = getSupabase();
  return await supabase.auth.signOut();
}

export async function signInWithOAuth(provider: "google" | "github") {
  const supabase = getSupabase();
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function getSession() {
  const supabase = getSupabase();
  return await supabase.auth.getSession();
}

export const supabase = { get instance() { return getSupabase(); } };

