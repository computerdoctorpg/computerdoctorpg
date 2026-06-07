export function getSupabaseConfig() {
  const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ : undefined;

  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    runtimeEnv?.VITE_SUPABASE_URL ||
    runtimeEnv?.SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    runtimeEnv?.VITE_SUPABASE_ANON_KEY ||
    runtimeEnv?.SUPABASE_ANON_KEY ||
    '';

  return { supabaseUrl, supabaseAnonKey };
}

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(supabaseUrl && supabaseAnonKey);
}
