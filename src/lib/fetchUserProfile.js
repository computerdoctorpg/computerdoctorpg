function isMissingDisplayNameColumn(error) {
  if (!error) return false;
  if (error.code === '42703') return true;
  const text = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
  return /display_name|does not exist/i.test(text);
}

/**
 * Učitava users profil — kompatibilno sa bazom bez display_name kolone.
 */
export async function fetchUserProfile(supabase, userId) {
  const { data: roleData, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (roleError) throw roleError;
  if (!roleData) return null;

  const { data: nameData, error: nameError } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  if (nameError) {
    if (isMissingDisplayNameColumn(nameError)) {
      return { ...roleData, display_name: null };
    }
    console.warn('[users] display_name lookup failed:', nameError.message);
    return { ...roleData, display_name: null };
  }

  return {
    ...roleData,
    display_name: nameData?.display_name ?? null,
  };
}
