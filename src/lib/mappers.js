// Pure helpers that translate database rows into the shapes the screens use.
// Keeping them free of React/Supabase makes them easy to unit test.

export const ERRAND_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  ACTIVE: 'ACTIVE',
  PAL_COMPLETED: 'PAL_COMPLETED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const IN_PROGRESS_FOR_USER = [
  ERRAND_STATUS.ACCEPTED,
  ERRAND_STATUS.ACTIVE,
  ERRAND_STATUS.PAL_COMPLETED,
];
const FINISHED = [ERRAND_STATUS.COMPLETED, ERRAND_STATUS.CANCELLED];

/** Adds the camelCase/UI fields the screens expect to an errand row. */
export function normalizeErrand(row) {
  if (!row) return row;
  return {
    ...row,
    fee: Number(row.amount),
    category: row.service_category,
    status: String(row.status || '').toUpperCase(),
    requesterUserId: row.requesterUserId || row.requester_id,
    palUserId: row.palUserId || row.pal_id,
  };
}

/** Same as normalizeErrand, plus the counterpart's skills as one display string. */
export function normalizeAccountErrand(item) {
  const result = normalizeErrand(item);
  const profile = result.pal || result.person;
  if (Array.isArray(profile?.skills)) {
    profile.skills = profile.skills.join(' · ');
  }
  return result;
}

/** The errand the signed-in person is currently working on, if any. */
export function pickAssignedErrand(rows, role, userId) {
  const match = rows.find((item) =>
    role === 'pal'
      ? item.palUserId === userId && !FINISHED.includes(item.status)
      : IN_PROGRESS_FOR_USER.includes(item.status),
  );
  return match || null;
}

/** Next status a Pal can move an errand to by tapping the main button. */
export function nextPalStatus(status) {
  if (status === ERRAND_STATUS.ACCEPTED) return 'active';
  if (status === ERRAND_STATUS.ACTIVE) return 'pal_completed';
  return null;
}

/** Pending errands a Pal may accept. */
export function availableForPal(errands) {
  return errands.filter((item) => item.status === ERRAND_STATUS.PENDING);
}

export function profileDetailsFromRow(row, user) {
  return {
    name: row?.full_name || user?.user_metadata?.full_name || '',
    phone: row?.phone || '',
    email: user?.email || row?.email || '',
    emailVerified: Boolean(user?.email_confirmed_at),
    memberSince: user?.created_at || '',
    pushEnabled: row?.push_enabled !== false,
    emailNotifications: row?.email_notifications !== false,
    available: row?.available !== false,
    receiveAll: row?.receive_all_errands === true,
  };
}

export function palProfileFromRow(row) {
  if (!row) return {};
  return {
    verification: {
      id: row.id_type || '',
      idNumber: row.id_number || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      submitted: Boolean(row.id_submitted),
    },
    occupation: {
      occupation: row.occupation || '',
      selected: Array.isArray(row.services) ? row.services : [],
      otherService: row.other_service || '',
      experience: row.experience || '',
      about: row.about || '',
    },
  };
}

export function palVerificationFromRow(row) {
  if (!row) return { status: 'not_submitted', reason: '' };
  return {
    status: row.pal_profile_complete ? row.verification_status || 'pending' : 'incomplete',
    reason: '',
  };
}

/** What the save_pal_profile RPC accepts. Keys left undefined are not sent. */
export function palDetailsToPayload({ verification, occupation } = {}) {
  const payload = {};
  if (verification) {
    payload.id_type = verification.id;
    payload.id_number = verification.idNumber;
    payload.address = verification.address;
    payload.city = verification.city;
    payload.state = verification.state;
  }
  if (occupation) {
    payload.occupation = occupation.occupation;
    payload.services = occupation.selected || [];
    payload.other_service = occupation.otherService || '';
    payload.experience = occupation.experience || '';
    payload.about = occupation.about || '';
  }
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

/** File extension for an image picked from the library. */
export function imageExtension(asset) {
  const raw = asset?.fileName?.split('.').pop() || asset?.mimeType?.split('/').pop() || 'jpg';
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
}
