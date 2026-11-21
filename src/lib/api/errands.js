import { explainMissingAuthUser, requireClient } from '../supabase';
import { prefetchImage } from '../preloadAssets';
import { normalizeAccountErrand, normalizeErrand } from '../mappers';

const PHOTO_BUCKET = 'pal-profile-photos';

export async function createErrandRecord(values) {
  const client = requireClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError) throw explainMissingAuthUser(userError);
  if (!user) throw new Error('Sign in with a User account to request an errand.');
  // Row-level security rejects this insert unless the login has a User profile.
  const payload = {
    requester_id: user.id,
    title: values.title.trim(),
    description: values.description.trim(),
    service_category: values.category,
    location: values.location.trim(),
    area: values.area?.trim() || null,
    city: values.city || null,
    state: values.state?.trim() || null,
    scheduled_for: values.scheduledFor || null,
    requested_time: values.schedule && values.schedule !== 'Now' ? values.schedule : null,
    estimated_time: values.estimatedTime || null,
    amount: Number(values.fee),
    special_notes: values.notes?.trim() || null,
  };
  const { data, error } = await client.from('errands').insert(payload).select('*').single();
  if (error) throw error;
  return normalizeErrand(data);
}

export async function getAccountErrands(role) {
  const client = requireClient();
  const { data, error } = await client.rpc('get_account_errands', { requested_role: role });
  if (error) throw explainMissingAuthUser(error);
  return Promise.all(
    (data || []).map(async (item) => {
      const result = normalizeAccountErrand(item);
      const profile = result.pal || result.person;
      if (profile?.profilePhotoPath) {
        const { data: signed } = await client.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(profile.profilePhotoPath, 60 * 30)
          .catch(() => ({ data: null }));
        profile.image = signed?.signedUrl || null;
        prefetchImage(profile.image);
      }
      return result;
    }),
  );
}

async function callErrandRpc(name, args) {
  const client = requireClient();
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return normalizeErrand(data);
}

export const acceptErrandRecord = (errandId) =>
  callErrandRpc('accept_errand', { errand_to_accept: errandId });

export const updateErrandRecordStatus = (errandId, status) =>
  callErrandRpc('update_errand_status', { errand_to_update: errandId, next_status: status });

export async function submitErrandReview(errandId, rating, review = '', role = 'user') {
  const client = requireClient();
  const { data, error } = await client.rpc('submit_profile_review', {
    errand_to_review: errandId,
    stars: rating,
    words: review,
    as_role: role,
  });
  if (error) throw error;
  return data;
}

export async function getProfileRating(profileId, role = 'user') {
  if (!profileId) return { average: 0, count: 0 };
  const client = requireClient();
  const { data, error } = await client.rpc('get_profile_rating', {
    target_profile_id: profileId,
    target_role: role,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { average: Number(row?.average_rating) || 0, count: Number(row?.review_count) || 0 };
}

/** Counter offers: the requester sees offers on their errands, a Pal sees the ones they sent. */
export async function getCounterOffers() {
  const client = requireClient();
  const { data, error } = await client.rpc('get_counter_offers');
  if (error) throw explainMissingAuthUser(error);
  return Promise.all(
    (data || []).map(async (offer) => {
      const pal = { ...offer.pal };
      if (Array.isArray(pal.skills)) pal.skills = pal.skills.join(' · ');
      if (pal.profilePhotoPath) {
        const { data: signed } = await client.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(pal.profilePhotoPath, 60 * 30)
          .catch(() => ({ data: null }));
        pal.image = signed?.signedUrl || null;
        prefetchImage(pal.image);
      }
      return { ...offer, amount: Number(offer.amount), pal };
    }),
  );
}

export async function sendCounterOffer(errandId, amount, message) {
  const client = requireClient();
  const { data, error } = await client.rpc('make_counter_offer', {
    errand_to_offer: errandId,
    offer_amount: Number(amount),
    offer_message: message || null,
  });
  if (error) throw error;
  return data;
}

export async function acceptCounterOfferRecord(offerId) {
  return callErrandRpc('accept_counter_offer', { offer_to_accept: offerId });
}

export async function declineCounterOfferRecord(offerId) {
  const client = requireClient();
  const { error } = await client.rpc('decline_counter_offer', { offer_to_decline: offerId });
  if (error) throw error;
}
