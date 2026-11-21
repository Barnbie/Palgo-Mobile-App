import { requireClient } from '../supabase';

export async function sharePalLocation(errandId, latitude, longitude, accuracy) {
  const client = requireClient();
  const { error } = await client.rpc('share_pal_location', {
    errand_to_share: errandId,
    lat: latitude,
    lng: longitude,
    acc: accuracy ?? null,
  });
  if (error) throw error;
}

/** The Pal's latest position as { latitude, longitude, updated_at }, or null. */
export async function getPalLocation(errandId) {
  const client = requireClient();
  const { data, error } = await client.rpc('get_pal_location', { errand_to_view: errandId });
  if (error) throw error;
  return data || null;
}
