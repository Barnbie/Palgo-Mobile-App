import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

function requireClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the project .env file, then restart Expo.',
    );
  }

  return supabase;
}

function explainMissingAuthUser(error) {
  const message=error?.message||'';
  if (/user from sub claim in jwt does not exist|user not found/i.test(message)) {
    return new Error('This saved login belongs to an account that no longer exists. Please sign up again or log in with an active account.');
  }
  return error;
}

export async function signUpAccount({ name, email, password, role, phone, birth, gender, palProfileComplete=false, palProfile={} }) {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        full_name: name.trim(),
        role,
        account_roles:[role],
        ...(role === 'pal' && palProfileComplete ? {
          pal_profile_complete:true,
          pal_verification_status:'pending',
          // The image is uploaded to private Storage after email verification.
          pal_id_submitted:false,
          ...(palProfile.verification?.id ? { pal_id_type:palProfile.verification.id } : {}),
          ...(palProfile.verification?.idNumber ? { pal_id_number:palProfile.verification.idNumber } : {}),
          ...(palProfile.verification?.address ? { pal_address:palProfile.verification.address } : {}),
          ...(palProfile.verification?.city ? { pal_city:palProfile.verification.city } : {}),
          ...(palProfile.verification?.state ? { pal_state:palProfile.verification.state } : {}),
          ...(palProfile.occupation ? { pal_occupation:palProfile.occupation.occupation || '', pal_services:palProfile.occupation.selected || [], pal_other_service:palProfile.occupation.otherService || '', pal_experience:palProfile.occupation.experience || '', pal_about:palProfile.occupation.about || '' } : {}),
        } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(birth ? { date_of_birth: birth } : {}),
        ...(gender ? { gender } : {}),
      },
    },
  });

  if (error) throw error;
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length===0) {
    throw new Error('This email already has a PalGo login. Sign in to that account, then choose “Become a Pal” or “Become a User” in Profile to add the other profile.');
  }
  return data;
}

export async function signInAccount({ email, password }) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function verifySignupOtp({ email, token }) {
  const client = requireClient();
  const { data, error } = await client.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'signup',
  });

  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email) {
  const client = requireClient();
  const { error } = await client.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });

  if (error) throw error;
}

export async function deleteCurrentAccount() {
  const client = requireClient();
  const { data, error } = await client.functions.invoke('delete-account', { method:'POST', body:{} });
  if (error) throw new Error(error.message || 'Account deletion could not be completed.');
  if (data?.error) throw new Error(data.error);
  try { await client.auth.signOut({ scope:'local' }); } catch {}
}

export async function uploadPalIdentityDocument(asset, idType, idNumber) {
  const client = requireClient();
  if (!asset?.uri) throw new Error('Select an ID photo before saving.');
  const { data:{user}, error:userError } = await client.auth.getUser();
  if (userError) throw explainMissingAuthUser(userError);
  if (!user) throw new Error('Please sign in again before updating your ID.');
  const extension=(asset.fileName?.split('.').pop()||asset.mimeType?.split('/').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const objectPath=`${user.id}/identity.${extension}`;
  const previousPath=user.user_metadata?.pal_id_document_path;
  const response=await fetch(asset.uri);
  if (!response.ok) throw new Error('The selected ID photo could not be read. Please choose it again.');
  const bytes=await response.arrayBuffer();
  const { error:uploadError }=await client.storage.from('pal-identity-documents').upload(objectPath,bytes,{contentType:asset.mimeType||`image/${extension}`,upsert:true});
  if(uploadError) {
    const authError=explainMissingAuthUser(uploadError);
    if(authError!==uploadError) { await client.auth.signOut({scope:'local'}); throw authError; }
    throw new Error(uploadError.message.includes('Bucket not found')?'ID document storage is not set up yet. Ask the project administrator to create the private ID storage bucket.':uploadError.message);
  }
  const {error:metadataError}=await client.auth.updateUser({data:{pal_id_type:idType,...(idNumber?{pal_id_number:idNumber}:{}),pal_id_submitted:true,pal_id_document_path:objectPath,pal_verification_status:'pending'}});
  if(metadataError) throw metadataError;
  if(previousPath&&previousPath!==objectPath) await client.storage.from('pal-identity-documents').remove([previousPath]);
  return objectPath;
}

export async function getPalIdentityDocumentUrl() {
  const client=requireClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error) throw explainMissingAuthUser(error);
  const path=user?.user_metadata?.pal_id_document_path;
  if(!user||!path) return null;
  const {data:signed,error:storageError}=await client.storage.from('pal-identity-documents').createSignedUrl(path,60*30);
  if(storageError) throw storageError;
  return signed?.signedUrl||null;
}

export async function uploadProfilePhoto(asset) {
  const client=requireClient();
  if(!asset?.uri)throw new Error('Choose a profile photo first.');
  const {data:{user},error:userError}=await client.auth.getUser();
  if(userError)throw explainMissingAuthUser(userError);
  if(!user)throw new Error('Please sign in again before changing your profile photo.');
  const extension=(asset.fileName?.split('.').pop()||asset.mimeType?.split('/').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const objectPath=`${user.id}/profile.${extension}`;
  const response=await fetch(asset.uri);
  if(!response.ok)throw new Error('The selected profile photo could not be read. Please choose it again.');
  const bytes=await response.arrayBuffer();
  const {error:uploadError}=await client.storage.from('pal-profile-photos').upload(objectPath,bytes,{contentType:asset.mimeType||`image/${extension}`,upsert:true});
  if(uploadError) {
    const authError=explainMissingAuthUser(uploadError);
    if(authError!==uploadError) { await client.auth.signOut({scope:'local'}); throw authError; }
    throw new Error(uploadError.message.includes('Bucket not found')?'Profile photo storage is not set up yet. Ask the project administrator to apply the latest storage setup.':uploadError.message);
  }
  const previousPath=user.user_metadata?.profile_photo_path;
  const {error:metadataError}=await client.auth.updateUser({data:{profile_photo_path:objectPath}});
  if(metadataError)throw metadataError;
  if(previousPath&&previousPath!==objectPath)await client.storage.from('pal-profile-photos').remove([previousPath]);
  const {data:signed,error:signedError}=await client.storage.from('pal-profile-photos').createSignedUrl(objectPath,60*30);
  if(signedError)throw signedError;
  return signed?.signedUrl||null;
}

export async function getProfilePhotoUrl() {
  const client=requireClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error)throw explainMissingAuthUser(error);
  const path=user?.user_metadata?.profile_photo_path;
  if(!user||!path)return null;
  const {data:signed,error:storageError}=await client.storage.from('pal-profile-photos').createSignedUrl(path,60*30);
  if(storageError)throw storageError;
  return signed?.signedUrl||null;
}

export async function getProfileRating(profileId,role='user') {
  const client=requireClient();
  if(!profileId)return {average:0,count:0};
  const {data,error}=await client.rpc('get_profile_rating',{target_profile_id:profileId,target_role:role});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  return {average:Number(row?.average_rating)||0,count:Number(row?.review_count)||0};
}

export async function createErrandRecord(values) {
  const client=requireClient();
  const {data:{user},error:userError}=await client.auth.getUser();
  if(userError)throw explainMissingAuthUser(userError);
  if(!user||user.user_metadata?.role!=='user')throw new Error('Sign in with a User account to request an errand.');
  const payload={requester_id:user.id,title:values.title.trim(),description:values.description.trim(),service_category:values.category,location:values.location.trim(),city:values.city||null,state:values.state||null,scheduled_for:values.scheduledFor||null,requested_time:values.schedule&&values.schedule!=='Now'?values.schedule:null,estimated_time:values.estimatedTime||null,amount:Number(values.fee),special_notes:values.notes?.trim()||null};
  const {data,error}=await client.from('errands').insert(payload).select('*').single();
  if(error)throw error;
  return {...data,id:data.id,fee:Number(data.amount),category:data.service_category,status:data.status.toUpperCase(),requesterUserId:data.requester_id,palUserId:data.pal_id};
}

export async function getAccountErrands(role) {
  const client=requireClient();
  const {data:{user},error:userError}=await client.auth.getUser();
  if(userError)throw explainMissingAuthUser(userError);
  if(!user)throw new Error('Sign in to view errands.');
  const {data,error}=await client.rpc('get_account_errands',{requested_role:role});
  if(error)throw error;
  return Promise.all((data||[]).map(async item=>{
    const result={...item,fee:Number(item.amount),category:item.service_category,status:item.status.toUpperCase(),requesterUserId:item.requesterUserId||item.requester_id,palUserId:item.palUserId||item.pal_id};
    const profile=result.pal||result.person;
    if(Array.isArray(profile?.skills))profile.skills=profile.skills.join(' · ');
    if(profile?.profilePhotoPath){
      const bucket=await client.storage.from('pal-profile-photos').createSignedUrl(profile.profilePhotoPath,60*30).catch(()=>({data:null}));
      profile.image=bucket?.data?.signedUrl||null;
    }
    return result;
  }));
}

export async function acceptErrandRecord(errandId) {
  const client=requireClient();
  const {data,error}=await client.rpc('accept_errand',{errand_to_accept:errandId});
  if(error)throw error;
  return {...data,fee:Number(data.amount),category:data.service_category,status:data.status.toUpperCase(),requesterUserId:data.requester_id,palUserId:data.pal_id};
}

export async function updateErrandRecordStatus(errandId,status) {
  const client=requireClient();
  const {data,error}=await client.rpc('update_errand_status',{errand_to_update:errandId,next_status:status});
  if(error)throw error;
  return {...data,fee:Number(data.amount),category:data.service_category,status:data.status.toUpperCase(),requesterUserId:data.requester_id,palUserId:data.pal_id};
}

export async function submitErrandReview(errandId,rating,review='',role='user') {
  const client=requireClient();
  const {data,error}=await client.rpc('submit_profile_review',{errand_to_review:errandId,stars:rating,words:review,as_role:role});
  if(error)throw error;
  return data;
}

export async function getAccountRoles() {
  const client=requireClient();
  const {data,error}=await client.rpc('get_account_roles');
  if(error)throw error;
  return Array.isArray(data)?data:[];
}
