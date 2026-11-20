import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Appearance, Linking, Text, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { colors as C } from './src/theme';
import { uiPlaceholders } from './src/assets';

import { s, commissionRate, money, statuses, Shell, Home, Errands, PalDetail, PalActive, PalPaid, PalCompleteWaiting, Chat, Profile, Notifications, Success, Input, Card, Avatar, Badge, ErrandCard, Map, HomeMap, Hero, Choice, Progress, Info, RowText, Timeline, BottomTabs, createBack, createNext, HomeActionImage, UserHome, PalGoBottomTabs, UserHomeUpdated, DetailRow, TrackingFinal, ChatFinal, ProfileFinal, ImagePlaceholder, ActiveActionImage, PalTrackingHome, PaymentPending, CompletionConfirm, PaymentFlowFinal } from './src/AppComponents';
import { WalletTransactions, TransactionDetails, DateFilter, WithdrawFlow, Wallet, PalWalletFinal, PalWalletLatest } from './src/features/wallet/screens';
import { ProfileHeader, ProfileRow, ProfileFlowFinal, PersonalInformation, ProfileEdit, ProfileTheme, ProfileSupport, ProfileSupportLatest, ReportProblem, ProfilePassword, ProfilePin, ProfileDelete, ProfileDeleteReason, ProfileDeleteSuccess, ProfileDeleteLatest, ProfileDeleteReasonLatest, ProfileDeleteSuccessLatest, PalProfileFlow, PalProfileLatest, PalIdVerification, PalMultiSelect, ProfessionalSettings, ProfileNotifications, ProfileTerms } from './src/features/profile/screens';
import { AuthBackground, Splash, AuthInput, Login, Verification, Skills, CreateFlow, CreateCategoryFinal, CreateErrandFormFinal, FlowField, RegistrationFlow, UserEmailConfirmation, UserEmailVerified, PalVerification, PalOccupation, OnboardingFlowFinal, RolePickerFinal, OnboardingFlow, Onboarding, Entry, RolePicker, SignUp } from './src/features/auth/screens';
import { PalsList, PalCard, PalProfile, Selected, Tracking, Confirm, Payment, Receipt, Rating, PalPending, CompletedErrandDetail, PendingErrandDetail, TrackingHomeActive, PalTrackingHomeLatest, PalDetailFinal, CounterOffer, ErrandsUpdated } from './src/features/errands/screens';
import { PalHomeFinal, UserHomeLatest } from './src/features/home/screens';
import { acceptErrandRecord, createErrandRecord, deleteCurrentAccount, getAccountErrands, getAccountRoles, getPalIdentityDocumentUrl, getProfilePhotoUrl, getProfileRating, resendSignupConfirmation, signInAccount, signUpAccount, submitErrandReview, supabase, uploadPalIdentityDocument, uploadProfilePhoto, updateErrandRecordStatus, verifySignupOtp } from './src/lib/supabase';

export default function App() {
  const [role, setRole] = useState(null);
  const [accountRoles,setAccountRoles]=useState([]);
  const [hasSeenOnboarding,setHasSeenOnboarding]=useState(()=>{try{return localStorage.getItem('palgo.onboarding.complete')==='true';}catch{return false;}});
  const [palProfile, setPalProfile] = useState({});
  const [palVerification, setPalVerification] = useState({ status:'not_submitted', reason:'' });
  const [dismissedVerificationStatus, setDismissedVerificationStatus] = useState('');
  const [profileDetails, setProfileDetails] = useState({ name:'', phone:'', email:'' });
  const [authUserId, setAuthUserId] = useState(null);
  const [profileRating,setProfileRating]=useState({average:0,count:0});
  const systemScheme=useColorScheme()||'light';
  const [themeMode,setThemeMode]=useState(()=>{try{return localStorage.getItem('palgo.theme.mode')||'system';}catch{return 'system';}});
  const effectiveScheme=themeMode==='system'?systemScheme:themeMode;
  const [authIntent, setAuthIntent] = useState('signup');
  const [screen, setScreen] = useState('splash');
  const screenRef = useRef(screen);
  const [errand, setErrand] = useState(null);
  const [accountErrands,setAccountErrands]=useState([]);
  const [form, setForm] = useState({ category:'Grocery', title:'', description:'', location:'', schedule:'Now', fee:'' });
  const [selectedPal, setSelectedPal] = useState(null);
  const [pendingSignup, setPendingSignup] = useState(null);
  const [pendingPalCredentials, setPendingPalCredentials] = useState(null);
  const [focusedErrand, setFocusedErrand] = useState(null);
  const [detailReturn, setDetailReturn] = useState('errands');
  const [counterReturn, setCounterReturn] = useState('pal-detail');
  const [palProfileReturn, setPalProfileReturn] = useState('interested');
  const [palPin, setPalPin] = useState('');
  const [pinReturn, setPinReturn] = useState('profile');
  const [withdrawDraft, setWithdrawDraft] = useState({ step:1, bank:'', account:'', amount:'', pin:'' });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [wallet, setWallet] = useState({ available:0, total:0, withdrawn:0 });
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');
  const notify = text => { setToast(text); setTimeout(() => setToast(''), 2200); };
  const current = errand || {};
  const go = target => setScreen(target);
  const activePal = selectedPal || errand?.pal || {name:'PalGo member',userId:errand?.palUserId};

  useEffect(() => { screenRef.current = screen; }, [screen]);

  useEffect(()=>{
    if(!authUserId||!supabase)return;
    let active=true;
    getAccountRoles().then(roles=>{if(active)setAccountRoles(roles);}).catch(()=>{});
    return()=>{active=false;};
  },[authUserId]);

  // Withdrawal PINs belong to the signed-in PAL and stay in the OS secure store.
  useEffect(() => {
    let active = true;
    setPalPin('');
    if (!authUserId || role !== 'pal') return () => { active = false; };
    SecureStore.getItemAsync(`palgo.withdrawal-pin.${authUserId}`)
      .then(value => { if (active) setPalPin(value || ''); })
      .catch(() => { if (active) setPalPin(''); });
    return () => { active = false; };
  }, [authUserId, role]);

  useEffect(() => {
    Appearance.setColorScheme(themeMode==='system'?'auto':themeMode);
    try { localStorage.setItem('palgo.theme.mode',themeMode); } catch {}
  }, [themeMode,effectiveScheme]);

  useEffect(() => {
    if (!['profile','profile-personal'].includes(screen) || !supabase) return undefined;
    let active=true;
    getProfilePhotoUrl().then(photoUrl=>{
      if(photoUrl&&active)setProfileDetails(value=>({...value,photoUrl}));
    }).catch(()=>{});
    return ()=>{active=false;};
  }, [screen]);

  useEffect(()=>{
    if(screen!=='profile'||!authUserId||!supabase){setProfileRating({average:0,count:0});return undefined;}
    let active=true;
    getProfileRating(authUserId,role).then(value=>{if(active)setProfileRating(value);}).catch(()=>{if(active)setProfileRating({average:0,count:0});});
    return ()=>{active=false;};
  },[screen,authUserId,role]);

  useEffect(() => {
    if (screen !== 'profile-id' || !supabase) return undefined;
    let active=true;
    getPalIdentityDocumentUrl().then(photoUri=>{
      if(photoUri&&active)setPalProfile(value=>({...value,verification:{...value.verification,photoUri}}));
    }).catch(()=>{});
    return ()=>{active=false;};
  }, [screen]);

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    const clearAccountState = () => {
      setRole(null);
      setAccountRoles([]);
      setAuthUserId(null);
      setAccountErrands([]);
      setPalProfile({});
      setPalVerification({ status:'not_submitted', reason:'' });
      setDismissedVerificationStatus('');
      setProfileDetails({ name:'', phone:'', email:'' });
      setPalPin('');
      setErrand(null);
      setPendingSignup(null);
      setPendingPalCredentials(null);
      setScreen('entry');
    };
    const applySession = session => {
      const sessionRole = session?.user?.user_metadata?.role;
      if (!mounted) return;
      if (!session || !['user', 'pal'].includes(sessionRole) || !session?.user?.email_confirmed_at) return;
      setRole(sessionRole);
      setAuthUserId(session.user.id);
      const metadata = session.user.user_metadata || {};
      setProfileDetails({ name:metadata.full_name || '', phone:metadata.phone || '', email:session.user.email || '', emailVerified:Boolean(session.user.email_confirmed_at), memberSince:session.user.created_at || '' });
      if (sessionRole === 'pal') {
        const nextStatus = metadata.pal_verification_status || (metadata.pal_profile_complete ? 'pending' : 'incomplete');
        setPalVerification({ status:nextStatus, reason:metadata.pal_verification_reason || '' });
        setPalProfile({
          verification:{ id:metadata.pal_id_type || '', idNumber:metadata.pal_id_number || '', address:metadata.pal_address || '', city:metadata.pal_city || '', state:metadata.pal_state || '', submitted:Boolean(metadata.pal_id_submitted) },
          occupation:{ occupation:metadata.pal_occupation || '', selected:Array.isArray(metadata.pal_services)?metadata.pal_services:[], otherService:metadata.pal_other_service || '', experience:metadata.pal_experience || '', about:metadata.pal_about || '' },
        });
      }
      if (screenRef.current === 'splash') setScreen('home');
    };
    const hasInvalidUserError = error => error?.status===401 || error?.status===403 || ['user_not_found','session_not_found','bad_jwt'].includes(error?.code);
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      const session=data?.session;
      if (!session) return;
      try {
        const { data:userData, error:userError } = await supabase.auth.getUser(session.access_token);
        if (!mounted) return;
        if (userError) {
          if (hasInvalidUserError(userError)) {
            await supabase.auth.signOut({ scope:'local' });
            if (mounted) clearAccountState();
          } else applySession(session);
          return;
        }
        applySession({ ...session, user:userData.user });
      } catch (validationError) {
        if (!mounted) return;
        if (hasInvalidUserError(validationError)) {
          await supabase.auth.signOut({ scope:'local' });
          if (mounted) clearAccountState();
        } else applySession(session);
      }
    }).catch(() => {});
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') { clearAccountState(); return; }
      // INITIAL_SESSION is checked with getUser above, so a deleted dashboard
      // account cannot briefly restore its stale cached session to the UI.
      if (event !== 'INITIAL_SESSION') applySession(session);
    });
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  useEffect(()=>{
    if(!authUserId||!role||!supabase||!['home','errands'].includes(screen))return undefined;
    let active=true;
    getAccountErrands(role).then(rows=>{
      if(!active)return;
      setAccountErrands(rows);
      const assigned=rows.find(item=>role==='pal'
        ? item.palUserId===authUserId&&!['COMPLETED','CANCELLED'].includes(item.status)
        : ['ACCEPTED','ACTIVE','PAL_COMPLETED'].includes(item.status));
      setErrand(assigned||null);
    }).catch(error=>{
      if(active)notify(error?.message||'Your errands could not be loaded. Apply the latest Supabase setup and try again.');
    });
    return()=>{active=false;};
  },[authUserId,role,screen]);

  function startErrand(category) { setForm({ category:category || 'Grocery', title:'', description:'', location:'', schedule:'Now', fee:'', notes:'', estimatedTime:'' }); go('create-category'); }
  async function submitErrand() {
    const created=await createErrandRecord({...form,scheduledFor:form.schedule==='Now'?new Date().toISOString():null});
    setErrand(created);
    setAccountErrands(rows=>[created,...rows]);
    go('submitted');
  }
  async function acceptAvailableErrand(item) {
    try{const accepted=await acceptErrandRecord(item.id);setErrand({...item,...accepted,person:item.person});setAccountErrands(rows=>rows.map(row=>row.id===item.id?{...row,...accepted,person:item.person}:row));go('home');}
    catch(error){Alert.alert('Could not accept errand',error?.message||'Please try again.');}
  }
  function selectPal(pal) { setSelectedPal(pal); setErrand(prev => ({ ...(prev || current), pal, fee:pal.offer, status:'PAL_SELECTED' })); go('selected'); }
  async function updateStatus() { if(!current.id)return;try{const next=current.status==='ACCEPTED'?'active':current.status==='ACTIVE'?'pal_completed':null;if(!next)return;const updated=await updateErrandRecordStatus(current.id,next);setErrand({...current,...updated});setAccountErrands(rows=>rows.map(item=>item.id===updated.id?{...item,...updated}:item));}catch(error){Alert.alert('Could not update errand',error?.message||'Please try again.');} }
  async function finishErrandAsPal() { if(!current.id)return;try{const updated=await updateErrandRecordStatus(current.id,'pal_completed');setErrand({...current,...updated});setAccountErrands(rows=>rows.map(item=>item.id===updated.id?{...item,...updated}:item));go('pal-complete');}catch(error){Alert.alert('Could not complete errand',error?.message||'Please try again.');} }
  function requestUserCompletion() { if(errand?.status==='PAL_COMPLETED')go('complete-confirm');else Alert.alert('Waiting for your Pal','Your Pal needs to mark the errand complete before you can confirm it.'); }
  async function confirmErrandCompletion() {
    const item=focusedErrand||current;
    if(!item.id){Alert.alert('Errand unavailable','This errand is not connected to a saved request.');return;}
    try{const updated=await updateErrandRecordStatus(item.id,'completed');const saved={...item,...updated};setErrand(saved);setAccountErrands(rows=>rows.map(row=>row.id===updated.id?{...row,...updated}:row));setFocusedErrand(saved);go('completed-detail');}
    catch(error){Alert.alert('Could not confirm completion',error?.message||'The Pal must mark the errand complete before you confirm it.');}
  }
  async function receivedPayment() { Alert.alert('Payment confirmation','PalGo will update your earnings when payment processing is connected.'); }
  async function saveErrandReview(errandId,targetId,stars,words) {
    if(!supabase||!authUserId||!errandId||!targetId){Alert.alert('Review not saved','This errand is not connected to both real account IDs yet.');return;}
    try{await submitErrandReview(errandId,stars,words,role);const updated=await getAccountErrands(role);setAccountErrands(updated);notify('Your review was submitted.');go('home');}
    catch(error){Alert.alert('Review not saved',error?.message||'Please try again after the errand is completed.');}
  }
  async function withdraw() { Alert.alert('Withdrawals not connected','There are no real Pal earnings or payout processing connected yet. No withdrawal has been made.'); }
  function sendMessage() { Alert.alert('Messaging is not connected','Messages will be connected in the messaging stage.'); }
  async function createAccount(credentials) {
    if (credentials.role === 'pal') {
      setPendingPalCredentials(credentials);
      setRole('pal');
      setPalProfile({});
      go('pal-verification');
      return;
    }
    const { session } = await signUpAccount(credentials);
    setProfileDetails({name:credentials.name,email:credentials.email,phone:credentials.phone||''});
    if (session) {
      setRole(credentials.role);
      setAuthUserId(session.user?.id || null);
      setPendingSignup(null);
      go(credentials.role === 'pal' ? 'pal-verification' : 'email-verified');
      return;
    }
    setPendingSignup({ email:credentials.email, role:credentials.role });
    go('email-verify');
  }
  async function confirmAccount(token) {
    if (!pendingSignup) throw new Error('Please sign up again to continue email confirmation.');
    const { user } = await verifySignupOtp({ email:pendingSignup.email, token });
    if (user?.user_metadata?.role !== pendingSignup.role) throw new Error('This confirmation code does not match the selected PalGo account type.');
    const verifiedRole = pendingSignup.role;
    setAuthUserId(user?.id || null);
    const userMetadata = user?.user_metadata || {};
    const palSetupComplete = verifiedRole === 'pal' && (pendingSignup.palProfileComplete || userMetadata.pal_profile_complete);
    setRole(verifiedRole);
    setProfileDetails({name:userMetadata.full_name||'',phone:userMetadata.phone||'',email:user?.email||pendingSignup.email,emailVerified:Boolean(user?.email_confirmed_at),memberSince:user?.created_at||''});
    setPendingSignup(null);
    setPendingPalCredentials(null);
    if (palSetupComplete) {
      setPalVerification({status:userMetadata.pal_verification_status||'pending',reason:userMetadata.pal_verification_reason||''});
      setPalProfile({verification:{id:userMetadata.pal_id_type||'',idNumber:userMetadata.pal_id_number||'',address:userMetadata.pal_address||'',city:userMetadata.pal_city||'',state:userMetadata.pal_state||'',submitted:Boolean(userMetadata.pal_id_submitted)},occupation:{occupation:userMetadata.pal_occupation||'',selected:Array.isArray(userMetadata.pal_services)?userMetadata.pal_services:[],otherService:userMetadata.pal_other_service||'',experience:userMetadata.pal_experience||'',about:userMetadata.pal_about||''}});
      setDismissedVerificationStatus('');
      if(palProfile.verification?.idPhoto){try{await uploadPalIdentityDocument(palProfile.verification.idPhoto,palProfile.verification.id,palProfile.verification.idNumber);const photoUri=await getPalIdentityDocumentUrl().catch(()=>null);setPalProfile(value=>({...value,verification:{...value.verification,submitted:true,...(photoUri?{photoUri}:{})}}));}catch(error){notify(error?.message||'Your ID photo still needs to be uploaded. You can update it from your profile.');}}
      if(palProfile.verification?.profilePhoto){try{const photoUrl=await uploadProfilePhoto(palProfile.verification.profilePhoto);setProfileDetails(value=>({...value,photoUrl}));}catch(error){notify(error?.message||'Your profile photo could not be saved. You can add it later from Personal Information.');}}
      go('home');
    } else go(verifiedRole === 'pal' ? 'pal-verification' : 'email-verified');
  }
  async function finishPalSignup(occupationDetails) {
    if (!pendingPalCredentials) {
      if (!supabase) throw new Error('Could not save your Pal profile. Check your connection and try again.');
      const details={...palProfile,occupation:occupationDetails};
      const roles=[...new Set([...accountRoles,'pal'])];
      const { error } = await supabase.auth.updateUser({ data:{ role:'pal',account_roles:roles,pal_profile_complete:true, pal_verification_status:'pending',pal_id_submitted:Boolean(details.verification?.idPhoto||details.verification?.submitted),pal_id_type:details.verification?.id||'',pal_id_number:details.verification?.idNumber||'',pal_address:details.verification?.address||'',pal_city:details.verification?.city||'',pal_state:details.verification?.state||'',pal_occupation:occupationDetails.occupation||'',pal_services:occupationDetails.selected||[],pal_other_service:occupationDetails.otherService||'',pal_experience:occupationDetails.experience||'',pal_about:occupationDetails.about||'' } });
      if (error) throw error;
      setPalProfile(details);
      setRole('pal');
      setAccountRoles(roles);
      if(details.verification?.profilePhoto?.uri)setProfileDetails(value=>({...value,photoUrl:details.verification.profilePhoto.uri}));
      if(details.verification?.idPhoto){try{await uploadPalIdentityDocument(details.verification.idPhoto,details.verification.id,details.verification.idNumber);}catch(uploadError){notify(uploadError?.message||'Your ID photo still needs to be uploaded. You can update it from your profile.');}}
      if(details.verification?.profilePhoto){try{const photoUrl=await uploadProfilePhoto(details.verification.profilePhoto);setProfileDetails(value=>({...value,photoUrl}));}catch(uploadError){notify(uploadError?.message||'Your profile photo could not be saved. You can add it later from Personal Information.');}}
      setPalVerification({status:'pending',reason:''});
      setDismissedVerificationStatus('');
      go('home');
      return;
    }
    const credentials = pendingPalCredentials;
    const savedPalProfile={...palProfile,occupation:occupationDetails};
    const { session } = await signUpAccount({ ...credentials, palProfileComplete:true, palProfile:savedPalProfile });
    setProfileDetails({name:credentials.name,email:credentials.email,phone:credentials.phone||''});
    if(savedPalProfile.verification?.profilePhoto?.uri)setProfileDetails(value=>({...value,photoUrl:savedPalProfile.verification.profilePhoto.uri}));
    setPalProfile(savedPalProfile);
    setPalVerification({status:'pending',reason:''});
    setDismissedVerificationStatus('');
    if (session) {
      setRole('pal');
      setAuthUserId(session.user?.id || null);
      setPendingPalCredentials(null);
      if(savedPalProfile.verification?.idPhoto){try{await uploadPalIdentityDocument(savedPalProfile.verification.idPhoto,savedPalProfile.verification.id,savedPalProfile.verification.idNumber);}catch(error){notify(error?.message||'Your ID photo still needs to be uploaded. You can update it from your profile.');}}
      if(savedPalProfile.verification?.profilePhoto){try{const photoUrl=await uploadProfilePhoto(savedPalProfile.verification.profilePhoto);setProfileDetails(value=>({...value,photoUrl}));}catch(error){notify(error?.message||'Your profile photo could not be saved. You can add it later from Personal Information.');}}
      go('home');
      return;
    }
    setPendingSignup({email:credentials.email,role:'pal',palProfileComplete:true});
    go('email-verify');
  }
  async function resendSignupEmail() {
    if (!pendingSignup?.email) throw new Error('Please sign up again to request a confirmation email.');
    await resendSignupConfirmation(pendingSignup.email);
  }
  async function loginAccount({ email, password, role: requestedRole }) {
    try {
      const { user } = await signInAccount({ email, password });
      if (!user?.email_confirmed_at) {
        await supabase?.auth.signOut();
        throw Object.assign(new Error('Email not confirmed'), { code:'email_not_confirmed' });
      }
      const roles = await getAccountRoles();
      if (!roles.includes(requestedRole)) {
        await supabase?.auth.signOut();
        throw new Error(`This email does not have a ${requestedRole === 'pal' ? 'Pal' : 'User'} profile yet. Sign in using the account type you already have, then choose “Become a ${requestedRole === 'pal' ? 'Pal' : 'User'}” in Profile.`);
      }
      const verifiedRole = requestedRole;
      if(user.user_metadata?.role!==verifiedRole){const {error:roleError}=await supabase.auth.updateUser({data:{role:verifiedRole}});if(roleError)throw roleError;}
      setAccountRoles(roles);
      setAuthUserId(user.id);
      setRole(verifiedRole);
      setProfileDetails({name:user.user_metadata?.full_name||'',phone:user.user_metadata?.phone||'',email:user.email||email,emailVerified:Boolean(user.email_confirmed_at),memberSince:user.created_at||''});
      if (verifiedRole === 'pal') {
        const metadata = user.user_metadata || {};
        const nextStatus = metadata.pal_verification_status || (metadata.pal_profile_complete ? 'pending' : 'incomplete');
        setPalVerification({ status:nextStatus, reason:metadata.pal_verification_reason || '' });
        setPalProfile({ verification:{id:metadata.pal_id_type||'',idNumber:metadata.pal_id_number||'',address:metadata.pal_address||'',city:metadata.pal_city||'',state:metadata.pal_state||'',submitted:Boolean(metadata.pal_id_submitted)}, occupation:{occupation:metadata.pal_occupation||'',selected:Array.isArray(metadata.pal_services)?metadata.pal_services:[],otherService:metadata.pal_other_service||'',experience:metadata.pal_experience||'',about:metadata.pal_about||''} });
        if (!metadata.pal_profile_complete) setDismissedVerificationStatus('');
      }
      setPendingSignup(null);
      go('home');
    } catch (error) {
      const unconfirmed = error?.code === 'email_not_confirmed' || /email not confirmed|email_not_confirmed/i.test(error?.message || '');
      if (!unconfirmed) throw error;

      setPendingSignup({ email:email.trim().toLowerCase(), role:requestedRole, returnTo:'login' });
      try { await resendSignupConfirmation(email); }
      catch (resendError) { notify(`Verify your email to continue. ${resendError?.message || 'Use Resend code on the next screen.'}`); }
      go('email-verify');
    }
  }
  async function logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) { notify(error.message); return; }
    }
    setRole(null);
    setAccountRoles([]);
    setAuthUserId(null);
    setPalPin('');
    setErrand(null);
    setPendingSignup(null);
    go('splash');
  }

  async function becomeOrSwitchRole(targetRole) {
    if(!authUserId||!supabase){Alert.alert('Sign in required','Sign in before adding or switching account profiles.');return;}
    if(accountRoles.includes(targetRole)){
      const {error}=await supabase.auth.updateUser({data:{role:targetRole}});
      if(error){Alert.alert('Could not switch profile',error.message);return;}
      setRole(targetRole);setErrand(null);setAccountErrands([]);go('home');return;
    }
    if(targetRole==='pal'){
      setPalProfile({});setPendingPalCredentials(null);go('pal-verification');return;
    }
    try{
      const roles=[...new Set([...accountRoles,'user'])];
      const {error}=await supabase.auth.updateUser({data:{role:'user',account_roles:roles}});
      if(error)throw error;
      setAccountRoles(roles);setRole('user');setErrand(null);setAccountErrands([]);go('home');
    }catch(error){Alert.alert('Could not add User profile',error?.message||'Please try again.');}
  }

  const body = useMemo(() => {
    const chooseAuthIntent=intent=>{setAuthIntent(intent);setHasSeenOnboarding(true);try{localStorage.setItem('palgo.onboarding.complete','true');}catch{}go('role');};
    if (screen === 'splash') return <Splash onStart={() => go(hasSeenOnboarding?'entry':'onboarding1')} />;
    if (screen.startsWith('onboarding')) return <OnboardingFlowFinal page={Number(screen.replace('onboarding','')) || 1} onNext={p => go(`onboarding${p + 1}`)} onBack={p => go(`onboarding${p - 1}`)} onChoose={chooseAuthIntent} />;
    if (screen === 'entry') return <OnboardingFlowFinal page={3} onNext={() => {}} onBack={() => go('onboarding2')} onChoose={chooseAuthIntent} />;
    if (screen === 'role') return <RolePickerFinal onDismiss={() => go(hasSeenOnboarding?'entry':'onboarding3')} onPick={r => { setRole(r); go(authIntent); }} />;
    if (screen === 'signup') return <RegistrationFlow role={role} initialValues={pendingPalCredentials||{}} onBack={() => go('role')} onContinue={credentials => createAccount({ ...credentials, role })} onLogin={() => go('login')} />;
    if (screen === 'login') return <Login role={role} onBack={() => go('entry')} onLogin={loginAccount} />;
    if (screen === 'email-verify') return <UserEmailConfirmation email={pendingSignup?.email||''} onBack={() => go(pendingSignup?.returnTo||'signup')} onVerify={confirmAccount} onResend={resendSignupEmail} />;
    if (screen === 'email-verified') return <UserEmailVerified onContinue={() => go('login')} />;
    if (screen === 'pal-verification') return <PalVerification initialValue={palProfile.verification} onBack={() => go(pendingPalCredentials?'signup':'home')} onNext={details => { setPalProfile(value=>({...value,verification:details})); go('pal-occupation'); }} />;
    if (screen === 'pal-occupation') return <PalOccupation initialValue={palProfile.occupation} onBack={() => go('pal-verification')} onNext={details => { setPalProfile(value=>({...value,occupation:details})); finishPalSignup(details).catch(error=>notify(error?.message||'Could not finish account setup.')); }} />;
    if (screen === 'verification') return <Verification onBack={() => go('signup')} onContinue={() => go('skills')} />;
    if (screen === 'skills') return <Skills onBack={() => go('verification')} onContinue={() => { notify('Verification submitted - demo approved'); go('home'); }} />;
    if (screen === 'create-category') return <CreateCategoryFinal form={form} setForm={setForm} onBack={() => go('home')} onContinue={() => go('create-form')} />;
    if (screen === 'create-form') return <CreateErrandFormFinal form={form} setForm={setForm} onBack={() => go('create-category')} onSubmit={()=>submitErrand().catch(error=>Alert.alert('Could not request errand',error?.message||'Please try again.'))} />;
    if (screen.startsWith('create-')) return <CreateFlow step={screen.replace('create-','')} form={form} setForm={setForm} onBack={() => createBack(screen, go)} onNext={() => createNext(screen, form, go, submitErrand, notify)} />;
    if (screen === 'submitted') return <Success icon="✓" title="Your errand is live!" copy="Your request is now visible to nearby Pals." primary="View my errands" onPrimary={() => go('errands')} secondary="Back to home" onSecondary={() => go('home')} />;
    if (screen === 'interested') return <PalsList onBack={() => go('home')} onView={p => { setSelectedPal(p); setPalProfileReturn('interested'); go('pal-profile'); }} onSelect={selectPal} />;
    if (screen === 'pal-profile') return <PalProfile pal={activePal} onBack={() => go(palProfileReturn)} onSelect={() => selectPal(activePal)} />;
    if (screen === 'selected') return <Selected pal={activePal} errand={current} onTrack={() => go('tracking')} onChat={() => Alert.alert('Messaging is not connected','Messages will be connected in the messaging stage.')} />;
    if (screen === 'tracking') return <TrackingHomeActive errand={focusedErrand||current} pal={activePal} onProfile={() => go('profile')} onChat={() => Alert.alert('Messaging is not connected','Messages will be connected in the messaging stage.')} onConfirm={() => go('complete-confirm')} />;
    if (screen === 'confirm') return <Confirm errand={current} onBack={() => go('tracking')} onPay={() => Alert.alert('Payments not connected','Errand completion and reviews are saved. Payment processing will be connected separately.')} onIssue={() => notify('Report an issue will be connected when the support email is ready.')} />;
    if (screen === 'complete-confirm') return <CompletionConfirm onBack={() => go('tracking')} onContinue={confirmErrandCompletion} />;
    if (screen === 'payment-pending') return <Success icon="!" title="Payments are not connected yet" copy="No payment was processed. You can still complete the errand and leave a review." primary="Back to errand" onPrimary={() => go('complete-confirm')} />;
    if (screen === 'payment') return <Success icon="!" title="Payments are not connected yet" copy="This app does not process or confirm payments yet." primary="Back to errand" onPrimary={() => go('complete-confirm')} />;
    if (screen === 'payment-success') return <Success icon="!" title="No payment recorded" copy="Payment processing is not connected yet." primary="Back to errands" onPrimary={() => go('errands')} />;
    if (screen === 'receipt') return <Receipt errand={current} pal={activePal} onBack={() => go('payment-success')} onRate={() => go('rating')} />;
    if (screen === 'rating') return <Rating name={current.pal?.name||activePal.name} image={current.pal?.image} onDone={(stars,words)=>saveErrandReview(current.id,current.palUserId||current.pal?.userId||activePal.userId,stars,words)} />;
    if (screen === 'rating-customer') return <Rating name={current.person?.name||'the customer'} image={current.person?.image} onDone={(stars,words)=>saveErrandReview(current.id,current.requesterUserId||current.requester_id||current.person?.userId,stars,words)} />;
    if (screen === 'pal-detail') return <PalDetailFinal errand={focusedErrand||current} onBack={() => { setFocusedErrand(null); go(detailReturn); }} onAccept={() => acceptAvailableErrand(focusedErrand||current)} onCounter={() => { Alert.alert('Counter offers','Counter offers will be connected after the basic errand flow.'); }} />;
    if (screen === 'counter-offer') return <CounterOffer errand={focusedErrand||current} onBack={() => { setFocusedErrand(null); go(counterReturn); }} onSend={() => Alert.alert('Counter offers not connected','This request is saved, but counter offers will be added with the errand negotiation flow.')} />;
    if (screen === 'pal-pending') return <PalPending errand={current} onSelect={() => go('home')} />;
    if (screen === 'pal-active') return <PalTrackingHomeLatest errand={current} onProfile={() => go('profile')} onChat={() => Alert.alert('Messaging is not connected','Messages will be connected in the messaging stage.')} onStart={updateStatus} onComplete={finishErrandAsPal} />;
    if (screen === 'pal-complete') return <PalCompleteWaiting errand={current} onBack={() => go('pal-active')} />;
    if (screen === 'pal-paid') return <Success icon="!" title="Payments are not connected yet" copy="No payment or Pal earnings have been recorded." primary="Back to errands" onPrimary={() => go('errands')} />;
    if (screen === 'wallet') return <PalWalletLatest wallet={wallet} profileDetails={profileDetails} onWithdraw={withdraw} onTransactions={() => go('wallet-transactions')} onOpenTransaction={transaction => { setSelectedTransaction(transaction); go('wallet-transaction-detail'); }} onNotify={() => go('notifications')} onBack={() => go('home')} />;
    if (screen === 'wallet-transactions') return <WalletTransactions onBack={() => go('wallet')} onFilter={() => go('wallet-filter')} onOpen={transaction => { setSelectedTransaction(transaction); go('wallet-transaction-detail'); }} />;
    if (screen === 'wallet-transaction-detail') return <TransactionDetails transaction={selectedTransaction} onBack={() => go('wallet-transactions')} />;
    if (screen === 'wallet-filter') return <DateFilter title="Filter transactions" onBack={() => go('wallet-transactions')} />;
    if (screen === 'withdraw') return <WithdrawFlow wallet={wallet} pinSet={!!palPin} pinValue={palPin} draft={withdrawDraft} setDraft={setWithdrawDraft} onSetupPin={() => { setPinReturn('withdraw'); go('profile-pin'); }} onBack={() => go('wallet')} onDone={withdraw} />;
    if (screen === 'withdraw-success') return <Success icon="!" title="Withdrawals are not connected" copy="No transfer has been made. Your wallet will show real balances when payment processing is connected." primary="Back to wallet" onPrimary={() => go('wallet')} />;
    if (screen === 'chat') return <ChatFinal messages={messages} message={message} setMessage={setMessage} send={sendMessage} onBack={() => go(role === 'pal' ? 'pal-active' : 'tracking')} onCall={() => Linking.openURL('tel:+2348012345678')} />;
    if (screen === 'completed-detail') { const item=focusedErrand||current; return <CompletedErrandDetail errand={item} pal={activePal} role={role} onBack={() => go('errands')} onChat={() => Alert.alert('Messaging is not connected','Messages will be connected in the messaging stage.')} onRate={() => {setErrand(item);go(role==='pal'?'rating-customer':'rating');}} />; }
    if (screen === 'pending-detail') return <PendingErrandDetail errand={focusedErrand||current} role={role} onBack={() => go('errands')} onAccept={() => acceptAvailableErrand(focusedErrand||current)} />;
    if (screen === 'errands') return <ErrandsUpdated role={role} errands={accountErrands} errand={errand} onBack={() => go('home')} onFilter={() => go('errand-filter')} onOpen={(kind,item) => {if(item){setFocusedErrand(item);if(['active','completed','complete'].includes(kind))setErrand(item);}if(kind==='active')go(role==='pal'?'pal-active':'tracking');else if(kind==='completed')go('completed-detail');else if(kind==='complete')go(role==='pal'?'pal-complete':'complete-confirm');else if(kind==='pending-detail')go('pending-detail');else if(kind==='accept')acceptAvailableErrand(item);else if(kind==='cancel')updateErrandRecordStatus(item.id,'cancelled').then(()=>getAccountErrands(role).then(setAccountErrands)).catch(error=>Alert.alert('Could not cancel errand',error.message));else go('pending-detail');}} />;
    if (screen === 'profile') return role==='pal' ? <PalProfileLatest profileDetails={profileDetails} rating={profileRating} availableRoles={accountRoles} onBecomeRole={becomeOrSwitchRole} onBack={() => go('home')} onNavigate={target => { if(target==='profile-pin') setPinReturn('profile'); go(target); }} onLogout={logout} /> : <ProfileFlowFinal role={role} profileDetails={profileDetails} rating={profileRating} availableRoles={accountRoles} onBecomeRole={becomeOrSwitchRole} onBack={() => go('home')} onNavigate={go} onLogout={logout} />;
    if (screen === 'profile-personal') return <PersonalInformation profileDetails={profileDetails} onBack={() => go('profile')} onEdit={field => go(`profile-edit-${field}`)} onPickPhoto={async asset=>{try{const photoUrl=await uploadProfilePhoto(asset);setProfileDetails(value=>({...value,photoUrl}));notify('Profile photo updated.');}catch(error){notify(error?.message||'Profile photo could not be updated.');}}} />;
    if (screen.startsWith('profile-edit-')) return <ProfileEdit field={screen.replace('profile-edit-','')} profileDetails={profileDetails} onSave={async value=>{const field=screen.replace('profile-edit-','');if(field==='phone')throw new Error('Phone verification is not available yet, so the phone number has not been changed.');if(supabase){const change=field==='name'?{data:{full_name:value}}:field==='email'?{email:value.trim().toLowerCase()}:null;if(change){const {error}=await supabase.auth.updateUser(change);if(error)throw error;}}if(field==='email'){notify('Check the new email address and confirm the change. Your email changes after confirmation.');return;}setProfileDetails(details=>({...details,[field]:value}));go('profile-personal');}} onBack={() => go('profile-personal')} />;
    if (screen === 'profile-theme') return <ProfileTheme mode={themeMode} onChange={setThemeMode} onBack={() => go('profile')} />;
    if (screen === 'profile-support') return <ProfileSupportLatest onBack={() => go('profile')} />;
    if (screen === 'profile-report') return <ReportProblem onBack={() => go('profile')} />;
    if (screen === 'profile-id') return <PalIdVerification idDetails={palProfile.verification} verification={palVerification} onBack={() => go('profile')} onSave={async details=>{await uploadPalIdentityDocument(details.photo||{uri:details.photoUri},details.id,details.idNumber);const photoUri=await getPalIdentityDocumentUrl().catch(()=>null);const nextProfile={...palProfile,verification:{...palProfile.verification,id:details.id,idNumber:details.idNumber,submitted:true,...(photoUri?{photoUri}:{})}};setPalProfile(nextProfile);setPalVerification({status:'pending',reason:''});go('profile');}} />;
    if (screen === 'profile-skills') return <PalMultiSelect title="Occupation / Skills" options={['Errand','Delivery','Car wash','Plumbing','Electrician','House chores','Mechanic','Chef','Nanny','Security','Hairstylist','Barber','Tailor','Others']} initialSelected={palProfile.occupation?.selected||[]} initialOther={palProfile.occupation?.otherService||''} onBack={() => go('profile')} onSave={async(selected,other)=>{const occupation={...(palProfile.occupation||{}),selected,otherService:selected.includes('Others')?other:''};setPalProfile(value=>({...value,occupation}));if(supabase){const {error}=await supabase.auth.updateUser({data:{pal_services:selected,pal_other_service:occupation.otherService}});if(error)throw error;}go('profile');}} />;
    if (screen === 'profile-language') return <PalMultiSelect title="Language" options={['English','Yoruba','Igbo','Hausa','Pidgin English']} onBack={() => go('profile')} />;
    if (screen === 'errand-filter') return <DateFilter title="Filter errands" onBack={() => go('errands')} />;
    if (screen === 'profile-password') return <ProfilePassword onBack={() => go('profile')} onSave={async({next})=>{if(!supabase)throw new Error('Password changes need an active account connection.');const {error}=await supabase.auth.updateUser({password:next});if(error)throw error;}} />;
    if (screen === 'profile-pin') return <ProfilePin isSet={!!palPin} currentPin={palPin} onBack={() => go(pinReturn)} onSave={async value => { if(!authUserId)throw new Error('Sign in again before setting a withdrawal PIN.');await SecureStore.setItemAsync(`palgo.withdrawal-pin.${authUserId}`,value);setPalPin(value);go(pinReturn); }} />;
    if (screen === 'profile-delete') return <ProfileDeleteLatest onBack={() => go('profile')} onContinue={() => go('profile-delete-reason')} />;
    if (screen === 'profile-delete-reason') return <ProfileDeleteReasonLatest onBack={() => go('profile-delete')} onDelete={async()=>{try{await deleteCurrentAccount();if(authUserId)await SecureStore.deleteItemAsync(`palgo.withdrawal-pin.${authUserId}`).catch(()=>{});setRole(null);setAuthUserId(null);setPalPin('');setProfileDetails({name:'',phone:'',email:''});setPalProfile({});setErrand(null);go('profile-delete-success');}catch(error){notify(error?.message||'Account deletion could not be completed.');}}} />;
    if (screen === 'profile-delete-success') return <ProfileDeleteSuccessLatest onDone={() => go('splash')} />;
    if (screen === 'profile-settings') return <ProfessionalSettings onBack={() => go('profile')} />;
    if (screen === 'profile-notifications') return <ProfileNotifications onBack={() => go('profile')} />;
    if (screen === 'profile-terms') return <ProfileTerms onBack={() => go('profile')} />;
    if (screen === 'profile-privacy') return <ProfileTerms title="Privacy Policy" onBack={() => go('profile')} />;
    if (screen === 'notifications') return <Notifications onBack={() => go('home')} />;
    return <UserHomeLatest role={role} errand={errand} errands={accountErrands} availableErrands={role==='pal'?accountErrands.filter(item=>item.status==='PENDING'):[]} wallet={wallet} verification={palVerification} verificationDismissed={dismissedVerificationStatus===palVerification.status} onDismissVerification={()=>setDismissedVerificationStatus(palVerification.status)} onResumeVerification={()=>go('pal-verification')} onCreate={startErrand} onErrands={() => go('errands')} onTrack={() => go(role === 'pal' ? 'pal-active' : 'tracking')} onNotify={() => go('notifications')} onWallet={() => go('profile-personal')} onStart={updateStatus} onComplete={role==='pal'?finishErrandAsPal:requestUserCompletion} onAccept={acceptAvailableErrand} onViewAvailable={item => { setFocusedErrand(item); setDetailReturn('home'); go('pal-detail'); }} />;
  }, [screen, role, authUserId, errand, accountErrands, accountRoles, profileRating, hasSeenOnboarding, themeMode, form, selectedPal, focusedErrand, detailReturn, counterReturn, palPin, withdrawDraft, pendingSignup, wallet, messages, message, palProfile, palVerification, dismissedVerificationStatus, profileDetails, pendingPalCredentials]);

  return <View style={s.safe}><StatusBar style={effectiveScheme==='dark'?'light':'dark'} />{body}{role && ['home','tracking','pal-active','errands','profile','wallet'].includes(screen) && <PalGoBottomTabs role={role} screen={screen==='tracking'||screen==='pal-active'?'home':screen} go={go} />}{toast ? <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View> : null}</View>;
}
