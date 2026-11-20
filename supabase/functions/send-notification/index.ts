import { createClient } from 'npm:@supabase/supabase-js@2';

// Called by the database (pg_net) after a notification row is stored.
// Sends an Expo push and/or a Brevo email, depending on the person's settings.
// Secrets (Supabase dashboard > Edge Functions > Secrets):
//   BREVO_API_KEY      Brevo API key (required for email)
//   MAIL_FROM_EMAIL    a sender address verified in Brevo (required for email)
//   MAIL_FROM_NAME     optional, defaults to PalGo

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return new Response('Not configured', { status: 503 });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: secretRow } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'notify_webhook_secret')
    .maybeSingle();
  const expected = typeof secretRow?.value === 'string' ? secretRow.value : null;
  if (!expected || request.headers.get('x-webhook-secret') !== expected)
    return new Response('Forbidden', { status: 403 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return new Response('Missing id', { status: 400 });
  const { data: note } = await admin.from('notifications').select('*').eq('id', id).maybeSingle();
  if (!note) return new Response('Not found', { status: 404 });

  const table = note.role === 'pal' ? 'pal_profiles' : 'user_profiles';
  const { data: prefs } = await admin
    .from(table)
    .select('push_enabled, email_notifications, full_name')
    .eq('id', note.user_id)
    .maybeSingle();
  const result: Record<string, unknown> = {};

  // ---- Push -------------------------------------------------------------
  if (prefs?.push_enabled !== false) {
    const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', note.user_id);
    if (tokens?.length) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(
          tokens.map(({ token }) => ({
            to: token,
            title: note.title,
            body: note.body,
            data: note.data,
            sound: 'default',
            channelId: 'default',
          })),
        ),
      }).catch(() => null);
      const body = await response?.json().catch(() => null);
      const tickets = Array.isArray(body?.data) ? body.data : [];
      const dead = tokens
        .filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered')
        .map(({ token }) => token);
      if (dead.length) await admin.from('push_tokens').delete().in('token', dead);
      result.push = response ? response.status : 'failed';
    } else result.push = 'no-token';
  }

  // ---- Email ------------------------------------------------------------
  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const fromEmail = Deno.env.get('MAIL_FROM_EMAIL');
  if (prefs?.email_notifications !== false && brevoKey && fromEmail) {
    const { data: userData } = await admin.auth.admin.getUserById(note.user_id);
    const to = userData?.user?.email;
    if (to) {
      const name = escapeHtml(prefs?.full_name || 'there');
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          sender: { email: fromEmail, name: Deno.env.get('MAIL_FROM_NAME') || 'PalGo' },
          to: [{ email: to }],
          subject: note.title,
          htmlContent:
            `<div style="font-family:Arial,sans-serif;max-width:480px">` +
            `<p>Hi ${name},</p><p><strong>${escapeHtml(note.title)}</strong></p>` +
            `<p>${escapeHtml(note.body)}</p>` +
            `<p style="color:#6B7488;font-size:12px">You can turn email notifications off in PalGo: Profile &gt; Email Notifications.</p></div>`,
        }),
      }).catch(() => null);
      result.email = response ? response.status : 'failed';
    }
  } else if (prefs?.email_notifications !== false) result.email = 'not-configured';

  return Response.json(result);
});
