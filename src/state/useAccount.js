import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import { preferences } from '../lib/secureStorage';
import {
  changePassword,
  deleteCurrentAccount,
  getAccountRoles,
  requestEmailChange,
  resendSignupConfirmation,
  signInAccount,
  signUpAccount,
  verifySignupOtp,
} from '../lib/api/auth';
import {
  addUserProfile,
  fetchProfile,
  getPalIdentityDocumentUrl,
  getProfilePhotoUrl,
  savePalProfile,
  updatePalServices,
  updateSharedProfileFields,
  uploadPalIdentityDocument,
  uploadProfilePhoto,
} from '../lib/api/profile';
import { getProfileRating } from '../lib/api/errands';
import { palProfileFromRow, palVerificationFromRow, profileDetailsFromRow } from '../lib/mappers';

export const REMEMBER_KEY = 'palgo.remember-me';
export const REMEMBERED_EMAIL_KEY = 'palgo.remembered-email';

const EMPTY_PROFILE = { name: '', phone: '', email: '' };
const NOT_SUBMITTED = { status: 'not_submitted', reason: '' };
const activeRoleKey = (userId) => `palgo.active-role.${userId}`;
const isDeadSessionError = (error) =>
  error?.status === 401 ||
  error?.status === 403 ||
  ['user_not_found', 'session_not_found', 'bad_jwt'].includes(error?.code);

/**
 * Everything about "who is signed in": the session, which profiles (User/Pal)
 * the login owns, the active role, and the profile data shown in the app.
 * The profile tables in Supabase are the single source of truth; nothing
 * trust-related is read from auth metadata.
 */
export function useAccount({ go, notify, screen, screenRef }) {
  const [role, setRole] = useState(null);
  const [accountRoles, setAccountRoles] = useState([]);
  const [authUserId, setAuthUserId] = useState(null);
  const [profileDetails, setProfileDetails] = useState(EMPTY_PROFILE);
  const [storagePaths, setStoragePaths] = useState({ photo: null, idDocument: null });
  const [palProfile, setPalProfile] = useState({});
  const [palVerification, setPalVerification] = useState(NOT_SUBMITTED);
  const [dismissedVerificationStatus, setDismissedVerificationStatus] = useState('');
  const [profileRating, setProfileRating] = useState({ average: 0, count: 0 });
  const [authIntent, setAuthIntent] = useState('signup');
  const [pendingSignup, setPendingSignup] = useState(null);
  const [pendingPalCredentials, setPendingPalCredentials] = useState(null);
  const pendingPalDetails = useRef(null);
  const authUserIdRef = useRef(null);

  const resetAccountState = useCallback(() => {
    authUserIdRef.current = null;
    pendingPalDetails.current = null;
    setRole(null);
    setAccountRoles([]);
    setAuthUserId(null);
    setProfileDetails(EMPTY_PROFILE);
    setStoragePaths({ photo: null, idDocument: null });
    setPalProfile({});
    setPalVerification(NOT_SUBMITTED);
    setDismissedVerificationStatus('');
    setPendingSignup(null);
    setPendingPalCredentials(null);
  }, []);

  /** Loads the profile for one of the login's roles into app state. */
  const loadAccount = useCallback(async (user, preferredRole) => {
    const roles = await getAccountRoles();
    if (!roles.length) {
      throw new Error('This login has no PalGo profile yet. Please sign up again.');
    }
    const storedRole = preferences.get(activeRoleKey(user.id));
    const activeRole =
      [preferredRole, storedRole].find((item) => item && roles.includes(item)) || roles[0];
    const row = await fetchProfile(activeRole, user.id);
    const photoUrl = await getProfilePhotoUrl(row?.profile_photo_path).catch(() => null);

    preferences.set(activeRoleKey(user.id), activeRole);
    authUserIdRef.current = user.id;
    setAuthUserId(user.id);
    setAccountRoles(roles);
    setRole(activeRole);
    setProfileDetails({ ...profileDetailsFromRow(row, user), photoUrl });
    setStoragePaths({
      photo: row?.profile_photo_path || null,
      idDocument: row?.id_document_path || null,
    });
    if (activeRole === 'pal') {
      setPalProfile(palProfileFromRow(row));
      setPalVerification(palVerificationFromRow(row));
    } else {
      setPalProfile({});
      setPalVerification(NOT_SUBMITTED);
    }
    setDismissedVerificationStatus('');
    return activeRole;
  }, []);

  const refreshAccount = useCallback(
    async (preferredRole) => {
      if (!supabase) return null;
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return loadAccount(user, preferredRole);
    },
    [loadAccount],
  );

  // Restore the saved session on launch and follow sign-in/sign-out events.
  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;

    const applySession = (session) => {
      if (!mounted || !session?.user?.email_confirmed_at) return;
      loadAccount(session.user)
        .then(() => {
          if (mounted && screenRef.current === 'splash') go('home');
        })
        .catch((error) => mounted && notify(error?.message || 'Could not load your account.'));
    };

    const signOutDeadSession = async () => {
      await supabase.auth.signOut({ scope: 'local' });
      if (mounted) {
        resetAccountState();
        go('entry');
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        const session = data?.session;
        if (!mounted || !session) return;
        // "Remember me" was unticked at login: don't restore the session on a fresh launch.
        if (preferences.get(REMEMBER_KEY) === '0') {
          await signOutDeadSession();
          return;
        }
        // Confirm the account still exists so a deleted account can't flash back.
        try {
          const { data: userData, error } = await supabase.auth.getUser(session.access_token);
          if (error) {
            if (isDeadSessionError(error)) await signOutDeadSession();
            else applySession(session);
            return;
          }
          applySession({ ...session, user: userData.user });
        } catch (error) {
          if (isDeadSessionError(error)) await signOutDeadSession();
          else applySession(session);
        }
      })
      .catch(() => {});

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        resetAccountState();
        go('entry');
        return;
      }
      // Never call Supabase from inside this callback directly (it can deadlock).
      if (event === 'SIGNED_IN' && session?.user && authUserIdRef.current !== session.user.id) {
        setTimeout(() => applySession(session), 0);
      }
      if (event === 'USER_UPDATED' && session?.user && authUserIdRef.current === session.user.id) {
        setTimeout(() => loadAccount(session.user).catch(() => {}), 0);
      }
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, [go, loadAccount, notify, resetAccountState, screenRef]);

  // Rating shown on the profile screen.
  useEffect(() => {
    if (screen !== 'profile' || !authUserId || !supabase) {
      setProfileRating({ average: 0, count: 0 });
      return undefined;
    }
    let active = true;
    getProfileRating(authUserId, role)
      .then((value) => active && setProfileRating(value))
      .catch(() => active && setProfileRating({ average: 0, count: 0 }));
    return () => {
      active = false;
    };
  }, [screen, authUserId, role]);

  // The ID photo is private, so it is only fetched while the ID screen is open.
  useEffect(() => {
    if (screen !== 'profile-id' || !supabase || !storagePaths.idDocument) return undefined;
    let active = true;
    getPalIdentityDocumentUrl(storagePaths.idDocument)
      .then((photoUri) => {
        if (photoUri && active) {
          setPalProfile((value) => ({
            ...value,
            verification: { ...value.verification, photoUri },
          }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [screen, storagePaths.idDocument]);

  // ---- Pal profile completion -------------------------------------------------

  /** Saves Pal details, uploads the ID and profile photos, then reloads the profile. */
  const completePalProfile = useCallback(
    async (details) => {
      await savePalProfile(details);
      const roles = await getAccountRoles();
      const { idPhoto, profilePhoto } = details.verification || {};
      if (idPhoto) {
        try {
          await uploadPalIdentityDocument(idPhoto, { previousPath: storagePaths.idDocument });
        } catch (error) {
          notify(
            error?.message ||
              'Your ID photo still needs to be uploaded. You can update it from your profile.',
          );
        }
      }
      if (profilePhoto) {
        try {
          await uploadProfilePhoto(profilePhoto, { roles, previousPath: storagePaths.photo });
        } catch (error) {
          notify(
            error?.message ||
              'Your profile photo could not be saved. You can add it later from Personal Information.',
          );
        }
      }
      await refreshAccount('pal');
    },
    [notify, refreshAccount, storagePaths.idDocument, storagePaths.photo],
  );

  // ---- Sign up / sign in ------------------------------------------------------

  async function createAccount(credentials) {
    if (credentials.role === 'pal') {
      // Pals finish their verification details first; the login is created after.
      setPendingPalCredentials(credentials);
      setRole('pal');
      setPalProfile({});
      go('pal-verification');
      return;
    }
    const { session } = await signUpAccount(credentials);
    if (session) {
      await refreshAccount(credentials.role);
      setPendingSignup(null);
      go('email-verified');
      return;
    }
    setPendingSignup({ email: credentials.email, role: credentials.role });
    go('email-verify');
  }

  async function finishPalSignup(occupationDetails) {
    const details = { ...palProfile, occupation: occupationDetails };

    if (!pendingPalCredentials) {
      // An existing login adding a Pal profile.
      if (!supabase) {
        throw new Error('Could not save your Pal profile. Check your connection and try again.');
      }
      await completePalProfile(details);
      go('home');
      return;
    }

    const credentials = pendingPalCredentials;
    const { session } = await signUpAccount(credentials);
    setPalProfile(details);
    if (session) {
      setPendingPalCredentials(null);
      await completePalProfile(details);
      go('home');
      return;
    }
    // Details are kept in memory until the email code is confirmed.
    pendingPalDetails.current = details;
    setPendingSignup({ email: credentials.email, role: 'pal' });
    go('email-verify');
  }

  async function confirmAccount(token) {
    if (!pendingSignup) throw new Error('Please sign up again to continue email confirmation.');
    const { user } = await verifySignupOtp({ email: pendingSignup.email, token });
    const roles = await getAccountRoles();
    if (!roles.includes(pendingSignup.role)) {
      throw new Error('This confirmation code does not match the selected PalGo account type.');
    }
    const verifiedRole = pendingSignup.role;
    preferences.set(activeRoleKey(user.id), verifiedRole);
    const palDetails = pendingPalDetails.current;

    if (verifiedRole === 'pal' && palDetails) {
      await completePalProfile(palDetails);
      pendingPalDetails.current = null;
      setPendingSignup(null);
      setPendingPalCredentials(null);
      go('home');
      return;
    }
    await loadAccount(user, verifiedRole);
    setPendingSignup(null);
    setPendingPalCredentials(null);
    go(verifiedRole === 'pal' ? 'pal-verification' : 'email-verified');
  }

  async function resendSignupEmail() {
    if (!pendingSignup?.email) {
      throw new Error('Please sign up again to request a confirmation email.');
    }
    await resendSignupConfirmation(pendingSignup.email);
  }

  async function loginAccount({ email, password, role: requestedRole, rememberMe = true }) {
    try {
      const { user } = await signInAccount({ email, password });
      if (!user?.email_confirmed_at) {
        await supabase?.auth.signOut();
        throw Object.assign(new Error('Email not confirmed'), { code: 'email_not_confirmed' });
      }
      const roles = await getAccountRoles();
      if (!roles.includes(requestedRole)) {
        await supabase?.auth.signOut();
        const label = requestedRole === 'pal' ? 'Pal' : 'User';
        throw new Error(
          `This email does not have a ${label} profile yet. Sign in using the account type you already have, then choose “Become a ${label}” in Profile.`,
        );
      }
      preferences.set(REMEMBER_KEY, rememberMe ? '1' : '0');
      preferences.set(REMEMBERED_EMAIL_KEY, rememberMe ? email.trim() : '');
      await loadAccount(user, requestedRole);
      setPendingSignup(null);
      go('home');
    } catch (error) {
      const unconfirmed =
        error?.code === 'email_not_confirmed' ||
        /email not confirmed|email_not_confirmed/i.test(error?.message || '');
      if (!unconfirmed) throw error;

      setPendingSignup({
        email: email.trim().toLowerCase(),
        role: requestedRole,
        returnTo: 'login',
      });
      try {
        await resendSignupConfirmation(email);
      } catch (resendError) {
        notify(
          `Verify your email to continue. ${resendError?.message || 'Use Resend code on the next screen.'}`,
        );
      }
      go('email-verify');
    }
  }

  async function logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        notify(error.message);
        return;
      }
    }
    resetAccountState();
    go('splash');
  }

  /** Returns true when the profile is ready to use, false when onboarding was started. */
  async function becomeOrSwitchRole(targetRole) {
    if (!authUserId || !supabase) {
      throw new Error('Sign in before adding or switching account profiles.');
    }
    if (accountRoles.includes(targetRole)) {
      await refreshAccount(targetRole);
      return true;
    }
    if (targetRole === 'pal') {
      setPalProfile({});
      setPendingPalCredentials(null);
      go('pal-verification');
      return false;
    }
    await addUserProfile();
    await refreshAccount('user');
    return true;
  }

  async function deleteAccount() {
    await deleteCurrentAccount();
    resetAccountState();
  }

  // ---- Profile edits ----------------------------------------------------------

  async function saveProfileName(name) {
    await updateSharedProfileFields(authUserId, accountRoles, { full_name: name.trim() });
    setProfileDetails((details) => ({ ...details, name: name.trim() }));
  }

  async function saveProfilePhoto(asset) {
    const { path, url } = await uploadProfilePhoto(asset, {
      roles: accountRoles,
      previousPath: storagePaths.photo,
    });
    setStoragePaths((paths) => ({ ...paths, photo: path }));
    setProfileDetails((details) => ({ ...details, photoUrl: url }));
  }

  async function savePalIdentity({ photo, id, idNumber }) {
    await savePalProfile({ verification: { ...palProfile.verification, id, idNumber } });
    if (photo) {
      await uploadPalIdentityDocument(photo, { previousPath: storagePaths.idDocument });
    }
    await refreshAccount('pal');
  }

  async function savePalSkills(selected, otherService) {
    await updatePalServices(authUserId, selected, otherService);
    setPalProfile((value) => ({
      ...value,
      occupation: { ...(value.occupation || {}), selected, otherService },
    }));
  }

  return {
    role,
    setRole,
    accountRoles,
    authUserId,
    authIntent,
    setAuthIntent,
    profileDetails,
    palProfile,
    setPalProfile,
    palVerification,
    dismissedVerificationStatus,
    setDismissedVerificationStatus,
    profileRating,
    pendingSignup,
    pendingPalCredentials,
    createAccount,
    finishPalSignup,
    confirmAccount,
    resendSignupEmail,
    loginAccount,
    logout,
    becomeOrSwitchRole,
    deleteAccount,
    saveProfileName,
    saveProfileEmail: requestEmailChange,
    savePassword: changePassword,
    saveProfilePhoto,
    savePalIdentity,
    savePalSkills,
  };
}
