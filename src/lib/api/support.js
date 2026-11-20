import { requireClient } from '../supabase';

/** Save a support / problem report for the signed-in member. */
export async function submitSupportRequest({ name, email, message, role }) {
  const client = requireClient();
  const { error } = await client.from('support_requests').insert({
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    acting_role: role === 'pal' || role === 'user' ? role : null,
  });
  if (error) throw error;
}
