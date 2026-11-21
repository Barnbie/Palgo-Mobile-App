import { requireClient } from '../supabase';

/** Messages on one errand, oldest first. */
export async function fetchMessages(errandId) {
  const client = requireClient();
  const { data, error } = await client
    .from('messages')
    .select('id, sender_role, body, created_at')
    .eq('errand_id', errandId)
    .order('created_at', { ascending: true })
    .limit(300);
  if (error) throw error;
  return data || [];
}

export async function sendMessage(errandId, role, body) {
  const client = requireClient();
  const { data: session } = await client.auth.getSession();
  const senderId = session?.session?.user?.id;
  if (!senderId) throw new Error('Sign in to send messages.');
  const { data, error } = await client
    .from('messages')
    .insert({ errand_id: errandId, sender_id: senderId, sender_role: role, body: body.trim() })
    .select('id, sender_role, body, created_at')
    .single();
  if (error) throw error;
  return data;
}

/** Calls `onInsert(message)` for each new message on the errand. Returns an unsubscribe function. */
export function subscribeToMessages(errandId, onInsert) {
  const client = requireClient();
  const channel = client
    .channel(`errand-chat-${errandId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `errand_id=eq.${errandId}` },
      (payload) => onInsert(payload.new),
    )
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

/** The other person's phone number, for the call button (members of the errand only). */
export async function getContactPhone(errandId, role) {
  const client = requireClient();
  const { data, error } = await client.rpc('get_errand_contact_phone', {
    errand_to_call: errandId,
    as_role: role,
  });
  if (error) throw error;
  return data || '';
}

/** Cancels an accepted or running errand with a reason. Resolves to { penalty, stage }. */
export async function cancelErrandWithReason(errandId, role, reason, note) {
  const client = requireClient();
  const { data, error } = await client.rpc('cancel_errand', {
    errand_to_cancel: errandId,
    as_role: role,
    cancel_reason: reason,
    cancel_note: note || null,
  });
  if (error) throw error;
  return data || {};
}

/** Marks the chat as read for this role (also clears its message notification). */
export async function markChatRead(errandId, role) {
  const client = requireClient();
  const { error } = await client.rpc('mark_chat_read', { errand_to_read: errandId, as_role: role });
  if (error) throw error;
}

export async function getUnreadMessageCount(errandId, role) {
  const client = requireClient();
  const { data, error } = await client.rpc('get_unread_message_count', {
    errand_to_check: errandId,
    as_role: role,
  });
  if (error) throw error;
  return Number(data) || 0;
}
