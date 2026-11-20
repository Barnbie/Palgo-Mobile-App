import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers:corsHeaders });
  if (request.method !== 'POST') return Response.json({ error:'Method not allowed.' }, { status:405, headers:corsHeaders });

  const authorization=request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return Response.json({ error:'Sign in again before deleting your account.' }, { status:401, headers:corsHeaders });

  const url=Deno.env.get('SUPABASE_URL');
  const anonKey=Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return Response.json({ error:'Account deletion is not configured on the server yet.' }, { status:503, headers:corsHeaders });

  const userClient=createClient(url,anonKey,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const adminClient=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:userError}=await userClient.auth.getUser();
  if (userError || !user) return Response.json({ error:'Your sign-in could not be verified. Please sign in again.' }, { status:401, headers:corsHeaders });

  // Remove the account-owned private ID files before deleting the Auth user.
  const {data:buckets}=await adminClient.storage.listBuckets();
  if (buckets?.some(bucket=>bucket.name==='pal-identity-documents')) {
    const {data:documents,error:listError}=await adminClient.storage.from('pal-identity-documents').list(user.id);
    if (listError) return Response.json({ error:'Could not remove your private ID document. Please try again later.' }, { status:500, headers:corsHeaders });
    if (documents?.length) {
      const {error:removeError}=await adminClient.storage.from('pal-identity-documents').remove(documents.map(file=>`${user.id}/${file.name}`));
      if (removeError) return Response.json({ error:'Could not remove your private ID document. Please try again later.' }, { status:500, headers:corsHeaders });
    }
  }

  const {error:deleteError}=await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) return Response.json({ error:'Your account could not be deleted. Please try again later.' }, { status:500, headers:corsHeaders });
  return Response.json({ success:true }, { status:200, headers:corsHeaders });
});
