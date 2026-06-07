export function getSupabaseConfig() {
  const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ : undefined;

  // Runtime env (Hostinger /env.js) ima prioritet nad Vite build-time vrijednostima
  const supabaseUrl =
    runtimeEnv?.VITE_SUPABASE_URL ||
    runtimeEnv?.SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    '';

  const supabaseAnonKey =
    runtimeEnv?.VITE_SUPABASE_ANON_KEY ||
    runtimeEnv?.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';

  return { supabaseUrl, supabaseAnonKey };
}

export function isSupabaseConfigured() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return Boolean(supabaseUrl && supabaseAnonKey);
}
