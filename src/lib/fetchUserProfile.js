/**
 * Učitava users profil — kompatibilno sa starom bazom bez display_name kolone.
 */
export async function fetchUserProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', userId)
    .maybeSingle();

  if (!error) return data;

  if (/display_name|42703/.test(error.message || '')) {
    const { data: fallback, error: fallbackError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (fallbackError) throw fallbackError;
    return fallback ? { ...fallback, display_name: null } : null;
  }

  throw error;
}
