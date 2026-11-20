import {
  availableForPal,
  imageExtension,
  nextPalStatus,
  normalizeAccountErrand,
  normalizeErrand,
  palDetailsToPayload,
  palProfileFromRow,
  palVerificationFromRow,
  pickAssignedErrand,
  profileDetailsFromRow,
} from './mappers';

describe('normalizeErrand', () => {
  it('adds the UI fields and upper-cases the status', () => {
    const result = normalizeErrand({
      id: '1',
      amount: '2500.00',
      service_category: 'Grocery',
      status: 'pending',
      requester_id: 'u1',
      pal_id: null,
    });
    expect(result).toMatchObject({
      fee: 2500,
      category: 'Grocery',
      status: 'PENDING',
      requesterUserId: 'u1',
    });
  });

  it('joins a Pal skills array into one display string', () => {
    const result = normalizeAccountErrand({
      status: 'accepted',
      amount: 3000,
      pal: { skills: ['Delivery', 'Errand'] },
    });
    expect(result.pal.skills).toBe('Delivery · Errand');
  });
});

describe('errand helpers', () => {
  const rows = [
    { id: 'a', status: 'PENDING', palUserId: null },
    { id: 'b', status: 'ACTIVE', palUserId: 'pal1' },
    { id: 'c', status: 'COMPLETED', palUserId: 'pal1' },
  ];

  it('picks the errand a Pal is working on, ignoring finished ones', () => {
    expect(pickAssignedErrand(rows, 'pal', 'pal1').id).toBe('b');
    expect(pickAssignedErrand([rows[2]], 'pal', 'pal1')).toBeNull();
  });

  it('picks the in-progress errand for a User', () => {
    expect(pickAssignedErrand(rows, 'user', 'u1').id).toBe('b');
    expect(pickAssignedErrand([rows[0]], 'user', 'u1')).toBeNull();
  });

  it('lists only pending errands as available to a Pal', () => {
    expect(availableForPal(rows).map((item) => item.id)).toEqual(['a']);
  });

  it('moves a Pal through accepted -> active -> pal_completed', () => {
    expect(nextPalStatus('ACCEPTED')).toBe('active');
    expect(nextPalStatus('ACTIVE')).toBe('pal_completed');
    expect(nextPalStatus('COMPLETED')).toBeNull();
  });
});

describe('profile mappers', () => {
  const palRow = {
    id_type: 'NIN',
    id_number: '123',
    address: '1 Road',
    city: 'Lagos',
    state: 'Lagos',
    id_submitted: true,
    occupation: 'Rider',
    services: ['Delivery'],
    verification_status: 'pending',
    pal_profile_complete: true,
  };

  it('maps a pal_profiles row to the shape the screens use', () => {
    const profile = palProfileFromRow(palRow);
    expect(profile.verification).toMatchObject({ id: 'NIN', idNumber: '123', submitted: true });
    expect(profile.occupation.selected).toEqual(['Delivery']);
  });

  it('reports an incomplete profile regardless of stored status', () => {
    expect(palVerificationFromRow({ ...palRow, pal_profile_complete: false }).status).toBe(
      'incomplete',
    );
    expect(palVerificationFromRow(palRow).status).toBe('pending');
    expect(palVerificationFromRow(null).status).toBe('not_submitted');
  });

  it('builds profile details from the row and the auth user', () => {
    const details = profileDetailsFromRow(
      { full_name: 'Ada', phone: '080' },
      { email: 'a@x.com', email_confirmed_at: 'now', created_at: 'then' },
    );
    expect(details).toMatchObject({ name: 'Ada', email: 'a@x.com', emailVerified: true });
  });

  it('only sends the fields that were provided to the save RPC', () => {
    expect(
      palDetailsToPayload({ occupation: { occupation: 'Rider', selected: ['Delivery'] } }),
    ).toEqual({
      occupation: 'Rider',
      services: ['Delivery'],
      other_service: '',
      experience: '',
      about: '',
    });
    expect(palDetailsToPayload({})).toEqual({});
  });
});

describe('imageExtension', () => {
  it('prefers the file name, then the mime type, then jpg', () => {
    expect(imageExtension({ fileName: 'ID.PNG' })).toBe('png');
    expect(imageExtension({ mimeType: 'image/webp' })).toBe('webp');
    expect(imageExtension({})).toBe('jpg');
  });
});
