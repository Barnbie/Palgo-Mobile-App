import { requireClient } from '../supabase';

export async function fetchNotifications(role) {
  const client = requireClient();
  const { data, error } = await client
    .from('notifications')
    .select('id, title, body, data, read_at, created_at')
    .eq('role', role)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function markNotificationsRead(role) {
  const client = requireClient();
  const { error } = await client
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('role', role)
    .is('read_at', null);
  if (error) throw error;
}

export async function savePushToken(userId, token, platform) {
  const client = requireClient();
  const { error } = await client
    .from('push_tokens')
    .upsert(
      { token, user_id: userId, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );
  if (error) throw error;
}
