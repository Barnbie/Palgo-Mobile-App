import { explainMissingAuthUser, requireClient } from '../supabase';
import { imageExtension, palDetailsToPayload } from '../mappers';

const ID_BUCKET = 'pal-identity-documents';
const PHOTO_BUCKET = 'pal-profile-photos';
const SIGNED_URL_SECONDS = 60 * 30;

const tableFor = (role) => (role === 'pal' ? 'pal_profiles' : 'user_profiles');

export async function fetchProfile(role, userId) {
  const client = requireClient();
  const { data, error } = await client
    .from(tableFor(role))
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw explainMissingAuthUser(error);
  return data;
}

/** Updates fields both profiles share (name, photo, ...) on every profile the login owns. */
export async function updateSharedProfileFields(userId, roles, patch) {
  const client = requireClient();
  await Promise.all(
    roles.map(async (role) => {
      const { error } = await client.from(tableFor(role)).update(patch).eq('id', userId);
      if (error) throw error;
    }),
  );
}

export async function updatePalServices(userId, selected, otherService) {
  const client = requireClient();
  const { error } = await client
    .from('pal_profiles')
    .update({ services: selected, other_service: otherService || null })
    .eq('id', userId);
  if (error) throw error;
}

/** Creates/updates the Pal profile through the server-side function. */
export async function savePalProfile(details) {
  const client = requireClient();
  const { data, error } = await client.rpc('save_pal_profile', {
    details: palDetailsToPayload(details),
  });
  if (error) throw error;
  return data;
}

export async function addUserProfile() {
  const client = requireClient();
  const { error } = await client.rpc('add_user_profile');
  if (error) throw error;
}

async function currentUser() {
  const client = requireClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw explainMissingAuthUser(error);
  return user;
}

async function readImageBytes(asset, what) {
  const response = await fetch(asset.uri);
  if (!response.ok)
    throw new Error(`The selected ${what} could not be read. Please choose it again.`);
  return response.arrayBuffer();
}

async function uploadImage(bucket, objectPath, asset, bucketMissingMessage, what) {
  const client = requireClient();
  const bytes = await readImageBytes(asset, what);
  const { error } = await client.storage.from(bucket).upload(objectPath, bytes, {
    contentType: asset.mimeType || `image/${imageExtension(asset)}`,
    upsert: true,
  });
  if (!error) return;
  const authError = explainMissingAuthUser(error);
  if (authError !== error) {
    await client.auth.signOut({ scope: 'local' });
    throw authError;
  }
  throw new Error(
    error.message.includes('Bucket not found') ? bucketMissingMessage : error.message,
  );
}

async function signedUrl(bucket, path) {
  if (!path) return null;
  const client = requireClient();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw error;
  return data?.signedUrl || null;
}

export const getProfilePhotoUrl = (path) => signedUrl(PHOTO_BUCKET, path);
export const getPalIdentityDocumentUrl = (path) => signedUrl(ID_BUCKET, path);

/** Uploads a profile photo and records its path on every profile the login owns. */
export async function uploadProfilePhoto(asset, { roles, previousPath }) {
  if (!asset?.uri) throw new Error('Choose a profile photo first.');
  const user = await currentUser();
  if (!user) throw new Error('Please sign in again before changing your profile photo.');
  const objectPath = `${user.id}/profile.${imageExtension(asset)}`;
  await uploadImage(
    PHOTO_BUCKET,
    objectPath,
    asset,
    'Profile photo storage is not set up yet. Ask the project administrator to apply the latest storage setup.',
    'profile photo',
  );
  await updateSharedProfileFields(user.id, roles, { profile_photo_path: objectPath });
  if (previousPath && previousPath !== objectPath) {
    await requireClient().storage.from(PHOTO_BUCKET).remove([previousPath]);
  }
  return { path: objectPath, url: await signedUrl(PHOTO_BUCKET, objectPath) };
}

/** Uploads the Pal's ID photo to private storage and flags it for review. */
export async function uploadPalIdentityDocument(asset, { previousPath } = {}) {
  if (!asset?.uri) throw new Error('Select an ID photo before saving.');
  const user = await currentUser();
  if (!user) throw new Error('Please sign in again before updating your ID.');
  const client = requireClient();
  const objectPath = `${user.id}/identity.${imageExtension(asset)}`;
  await uploadImage(
    ID_BUCKET,
    objectPath,
    asset,
    'ID document storage is not set up yet. Ask the project administrator to create the private ID storage bucket.',
    'ID photo',
  );
  const { error } = await client.rpc('register_pal_identity_document', {
    document_path: objectPath,
  });
  if (error) throw error;
  if (previousPath && previousPath !== objectPath) {
    await client.storage.from(ID_BUCKET).remove([previousPath]);
  }
  return objectPath;
}
