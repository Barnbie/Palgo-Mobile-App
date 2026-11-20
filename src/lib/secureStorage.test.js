const mockStore = new Map();

jest.mock('expo-secure-store', () => ({
  getItemAsync: async (key) => (mockStore.has(key) ? mockStore.get(key) : null),
  setItemAsync: async (key, value) => {
    mockStore.set(key, value);
  },
  deleteItemAsync: async (key) => {
    mockStore.delete(key);
  },
  getItem: (key) => (mockStore.has(key) ? mockStore.get(key) : null),
  setItem: (key, value) => {
    mockStore.set(key, value);
  },
}));

const { preferences, secureAuthStorage, splitIntoChunks } = require('./secureStorage');

beforeEach(() => mockStore.clear());

describe('splitIntoChunks', () => {
  it('splits long values and keeps short ones whole', () => {
    expect(splitIntoChunks('abcdef', 4)).toEqual(['abcd', 'ef']);
    expect(splitIntoChunks('abc', 4)).toEqual(['abc']);
    expect(splitIntoChunks('')).toEqual(['']);
  });
});

describe('secureAuthStorage', () => {
  it('round-trips a session larger than one SecureStore entry', async () => {
    const session = JSON.stringify({ token: 'x'.repeat(5000) });
    await secureAuthStorage.setItem('sb-auth', session);
    expect(mockStore.size).toBeGreaterThan(2);
    expect(await secureAuthStorage.getItem('sb-auth')).toBe(session);
  });

  it('cleans up leftover chunks when a value shrinks', async () => {
    await secureAuthStorage.setItem('k', 'y'.repeat(4500));
    await secureAuthStorage.setItem('k', 'short');
    expect(await secureAuthStorage.getItem('k')).toBe('short');
    expect([...mockStore.keys()].sort()).toEqual(['k.0', 'k.chunks']);
  });

  it('returns null for missing or corrupted data and removes everything', async () => {
    expect(await secureAuthStorage.getItem('missing')).toBeNull();
    await secureAuthStorage.setItem('k', 'z'.repeat(3000));
    mockStore.delete('k.1');
    expect(await secureAuthStorage.getItem('k')).toBeNull();
    await secureAuthStorage.removeItem('k');
    expect(mockStore.size).toBe(0);
  });
});

describe('preferences', () => {
  it('reads with a fallback and writes strings', () => {
    expect(preferences.get('theme', 'system')).toBe('system');
    preferences.set('theme', 'dark');
    expect(preferences.get('theme', 'system')).toBe('dark');
  });
});
