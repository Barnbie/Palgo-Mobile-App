import { requireClient } from '../supabase';

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

/**
 * Creates the login. Only basic identity fields go into the sign-up metadata:
 * everything that affects trust (roles, Pal verification, ID details) lives in
 * the database tables and is written through server-side functions.
 */
export async function signUpAccount({ name, email, password, role, phone, birth, gender }) {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: {
        full_name: name.trim(),
        role,
        ...(phone ? { phone: phone.trim() } : {}),
        ...(birth ? { date_of_birth: birth } : {}),
        ...(gender ? { gender } : {}),
      },
    },
  });

  if (error) throw error;
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error(
      'This email already has a PalGo login. Sign in to that account, then choose “Become a Pal” or “Become a User” in Profile to add the other profile.',
    );
  }
  return data;
}

export async function signInAccount({ email, password }) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (error) throw error;
  return data;
}

export async function verifySignupOtp({ email, token }) {
  const client = requireClient();
  const { data, error } = await client.auth.verifyOtp({
    email: normalizeEmail(email),
    token: token.trim(),
    type: 'signup',
  });
  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email) {
  const client = requireClient();
  const { error } = await client.auth.resend({ type: 'signup', email: normalizeEmail(email) });
  if (error) throw error;
}

/** Checks the current password first, then sets the new one. */
export async function changePassword({ email, current, next }) {
  const client = requireClient();
  const { error: checkError } = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password: current,
  });
  if (checkError) throw new Error('Your current password is not correct.');
  const { error } = await client.auth.updateUser({ password: next });
  if (error) throw error;
}

export async function requestEmailChange(email) {
  const client = requireClient();
  const { error } = await client.auth.updateUser({ email: normalizeEmail(email) });
  if (error) throw error;
}

export async function deleteCurrentAccount() {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('delete-account', {
    method: 'POST',
    body: {},
  });
  if (error) throw new Error(error.message || 'Account deletion could not be completed.');
  if (data?.error) throw new Error(data.error);
  try {
    await client.auth.signOut({ scope: 'local' });
  } catch {
    // The account is already gone; a failed local sign-out changes nothing.
  }
}

/** Which profiles (User and/or Pal) the signed-in login owns. */
export async function getAccountRoles() {
  const client = requireClient();
  const { data, error } = await client.rpc('get_account_roles');
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
