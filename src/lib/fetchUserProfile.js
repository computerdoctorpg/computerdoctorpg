/**
 * Učitava users profil. select('*') — ne pada ako display_name kolona još ne postoji.
 */
export async function fetchUserProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    role: data.role,
    display_name: data.display_name ?? null,
  };
}
