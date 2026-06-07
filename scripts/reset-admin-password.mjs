/**
 * Reset Supabase admin password (local dev tool).
 *
 * 1. Supabase Dashboard -> Project Settings -> API -> service_role key
 * 2. Add to .env: SUPABASE_SERVICE_ROLE_KEY=your-key
 * 3. Run: npm run reset-password -- prodaja@computer-doctor.me NovaLozinka123
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env file.');
  process.exit(1);
}

const env = fs.readFileSync(envPath, 'utf8');
const readEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim();

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Add SUPABASE_SERVICE_ROLE_KEY to .env (Supabase -> Settings -> API -> service_role).');
  process.exit(1);
}

if (!email || !password) {
  console.error('Usage: npm run reset-password -- email@example.com NewPassword123');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) {
  console.error('Could not list users:', listError.message);
  process.exit(1);
}

let user = listData.users.find((u) => u.email?.toLowerCase() === email);

if (!user) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error('Could not create user:', createError.message);
    process.exit(1);
  }

  user = created.user;
  console.log(`Created user: ${email}`);
} else {
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });

  if (updateError) {
    console.error('Could not update password:', updateError.message);
    process.exit(1);
  }

  console.log(`Password updated for: ${email}`);
}

const { error: profileError } = await admin.from('users').upsert(
  {
    id: user.id,
    email,
    role: 'admin',
  },
  { onConflict: 'id' }
);

if (profileError) {
  console.warn('Auth user OK, but users table update failed:', profileError.message);
  console.warn('Login may still work; admin role might be missing.');
} else {
  console.log('Admin role set in users table.');
}

console.log('\nDone. You can now log in with:');
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
