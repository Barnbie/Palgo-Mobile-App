import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  acceptCounterOfferRecord,
  acceptErrandRecord,
  createErrandRecord,
  declineCounterOfferRecord,
  getAccountErrands,
  getCounterOffers,
  sendCounterOffer,
  submitErrandReview,
  updateErrandRecordStatus,
} from '../lib/api/errands';
import { ERRAND_STATUS, nextPalStatus, pickAssignedErrand } from '../lib/mappers';

/** How often the errand list refreshes while the app is open. */
export const ERRAND_REFRESH_MS = 20000;
const LIST_SCREENS = ['home', 'errands'];
const EMPTY_FORM = {
  category: 'Grocery',
  title: '',
  description: '',
  location: '',
  area: '',
  state: '',
  schedule: 'Now',
  fee: '',
};

const mergeById = (rows, updated) =>
  rows.map((item) => (item.id === updated.id ? { ...item, ...updated } : item));

/**
 * The signed-in person's errands. The list refreshes on sign-in, whenever the
 * app returns to the foreground, every ERRAND_REFRESH_MS, on the home/errands
 * screens, and after every change they make, so it never needs a manual reload.
 */
export function useErrands({ role, authUserId, screen, screenRef, go, notify }) {
  const [errand, setErrand] = useState(null);
  const [accountErrands, setAccountErrands] = useState([]);
  const [focusedErrand, setFocusedErrand] = useState(null);
  const [offers, setOffers] = useState([]);
  const [focusedOffer, setFocusedOffer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const lastErrorRef = useRef('');
  const current = errand || {};
  const signedIn = Boolean(authUserId && role && supabase);

  const applyRows = useCallback(
    (rows) => {
      setAccountErrands(rows);
      setErrand((previous) => {
        const onListScreen = LIST_SCREENS.includes(screenRef.current);
        if (onListScreen) return pickAssignedErrand(rows, role, authUserId);
        // Elsewhere keep what the person is looking at, but with fresh data.
        const fresh = previous?.id && rows.find((item) => item.id === previous.id);
        return fresh ? { ...previous, ...fresh } : previous;
      });
      setFocusedErrand((previous) => {
        const fresh = previous?.id && rows.find((item) => item.id === previous.id);
        return fresh ? { ...previous, ...fresh } : previous;
      });
    },
    [authUserId, role, screenRef],
  );

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    try {
      applyRows(await getAccountErrands(role));
      // Offers are secondary: a failure here must not hide the errands.
      setOffers(await getCounterOffers().catch(() => []));
      lastErrorRef.current = '';
    } catch (error) {
      const message = error?.message || 'Your errands could not be loaded.';
      // Tell the person once, not on every background retry.
      if (message !== lastErrorRef.current) notify(message);
      lastErrorRef.current = message;
    }
  }, [applyRows, notify, role, signedIn]);

  // Reset when the signed-in profile changes.
  useEffect(() => {
    setAccountErrands([]);
    setOffers([]);
    setErrand(null);
    setFocusedErrand(null);
    setFocusedOffer(null);
  }, [authUserId, role]);

  // Load on sign-in, then keep fresh in the background and on foreground.
  useEffect(() => {
    if (!signedIn) return undefined;
    refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, ERRAND_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [signedIn, refresh]);

  // Opening the lists always shows the latest.
  useEffect(() => {
    if (LIST_SCREENS.includes(screen)) refresh();
  }, [screen, refresh]);

  function startErrand(category) {
    setForm({ ...EMPTY_FORM, category: category || 'Grocery', notes: '', estimatedTime: '' });
    go('create-category');
  }

  async function submitErrand() {
    const created = await createErrandRecord({
      ...form,
      scheduledFor: form.schedule === 'Now' ? new Date().toISOString() : null,
    });
    setErrand(created);
    setAccountErrands((rows) => [created, ...rows]);
    go('submitted');
  }

  const replaceWith = useCallback((updated, extra = {}) => {
    setErrand((previous) => ({ ...previous, ...updated, ...extra }));
    setAccountErrands((rows) => mergeById(rows, { ...updated, ...extra }));
  }, []);

  async function acceptAvailableErrand(item) {
    try {
      const accepted = await acceptErrandRecord(item.id);
      // The full address is revealed once the errand is accepted.
      const updated = { ...item, ...accepted, person: item.person, locationHidden: false };
      setErrand(updated);
      setAccountErrands((rows) => mergeById(rows, updated));
      go('home');
    } catch (error) {
      Alert.alert('Could not accept errand', error?.message || 'Please try again.');
    }
  }

  async function updateStatus() {
    const next = nextPalStatus(current.status);
    if (!current.id || !next) return;
    try {
      replaceWith(await updateErrandRecordStatus(current.id, next));
    } catch (error) {
      Alert.alert('Could not update errand', error?.message || 'Please try again.');
    }
  }

  async function finishErrandAsPal() {
    if (!current.id) return;
    try {
      replaceWith(await updateErrandRecordStatus(current.id, 'pal_completed'));
      go('pal-complete');
    } catch (error) {
      Alert.alert('Could not complete errand', error?.message || 'Please try again.');
    }
  }

  function requestUserCompletion() {
    if (errand?.status === ERRAND_STATUS.PAL_COMPLETED) {
      go('complete-confirm');
    } else {
      Alert.alert(
        'Waiting for your Pal',
        'Your Pal needs to mark the errand complete before you can confirm it.',
      );
    }
  }

  async function confirmErrandCompletion() {
    const item = focusedErrand || current;
    if (!item.id) {
      Alert.alert('Errand unavailable', 'This errand is not connected to a saved request.');
      return;
    }
    try {
      const updated = await updateErrandRecordStatus(item.id, 'completed');
      const saved = { ...item, ...updated };
      setErrand(saved);
      setAccountErrands((rows) => mergeById(rows, updated));
      setFocusedErrand(saved);
      go('completed-detail');
    } catch (error) {
      Alert.alert(
        'Could not confirm completion',
        error?.message || 'The Pal must mark the errand complete before you confirm it.',
      );
    }
  }

  async function cancelErrand(item) {
    try {
      await updateErrandRecordStatus(item.id, 'cancelled');
      await refresh();
    } catch (error) {
      Alert.alert('Could not cancel errand', error.message);
    }
  }

  async function submitCounterOffer(item, amount, message) {
    try {
      await sendCounterOffer(item.id, amount, message);
      await refresh();
      notify('Your counter offer was sent.');
      go('errands');
    } catch (error) {
      Alert.alert('Could not send offer', error?.message || 'Please try again.');
    }
  }

  async function acceptOffer(offer) {
    try {
      const accepted = await acceptCounterOfferRecord(offer.id);
      const base = accountErrands.find((item) => item.id === offer.errandId) || {};
      const updated = { ...base, ...accepted, pal: offer.pal };
      setErrand(updated);
      setFocusedOffer(null);
      await refresh();
      notify('Offer accepted. Your Pal is on the way.');
      go('tracking');
    } catch (error) {
      Alert.alert('Could not accept offer', error?.message || 'Please try again.');
      refresh();
    }
  }

  async function declineOffer(offer) {
    try {
      await declineCounterOfferRecord(offer.id);
      setFocusedOffer(null);
      await refresh();
      go('errands');
    } catch (error) {
      Alert.alert('Could not decline offer', error?.message || 'Please try again.');
    }
  }

  async function saveErrandReview(errandId, targetId, stars, words) {
    if (!supabase || !authUserId || !errandId || !targetId) {
      Alert.alert('Review not saved', 'This errand is not connected to both real account IDs yet.');
      return;
    }
    try {
      await submitErrandReview(errandId, stars, words, role);
      await refresh();
      notify('Your review was submitted.');
      go('home');
    } catch (error) {
      Alert.alert(
        'Review not saved',
        error?.message || 'Please try again after the errand is completed.',
      );
    }
  }

  return {
    errand,
    setErrand,
    current,
    accountErrands,
    focusedErrand,
    setFocusedErrand,
    offers,
    focusedOffer,
    setFocusedOffer,
    submitCounterOffer,
    acceptOffer,
    declineOffer,
    form,
    setForm,
    refreshErrands: refresh,
    startErrand,
    submitErrand,
    acceptAvailableErrand,
    updateStatus,
    finishErrandAsPal,
    requestUserCompletion,
    confirmErrandCompletion,
    cancelErrand,
    saveErrandReview,
  };
}
