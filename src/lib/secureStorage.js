import * as SecureStore from 'expo-secure-store';

// SecureStore values are limited to roughly 2 KB, and a Supabase session is
// larger than that, so a session is split across several small entries.
const CHUNK_SIZE = 1000;

export function splitIntoChunks(value, size = CHUNK_SIZE) {
  if (!value) return [''];
  const chunks = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
}

const countKey = (key) => `${key}.chunks`;

async function readChunkCount(key) {
  const count = Number(await SecureStore.getItemAsync(countKey(key)));
  return Number.isInteger(count) && count > 0 ? count : 0;
}

/** Encrypted-at-rest storage adapter for the Supabase auth session. */
export const secureAuthStorage = {
  async getItem(key) {
    const count = await readChunkCount(key);
    if (!count) return null;
    const parts = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${key}.${index}`)),
    );
    return parts.some((part) => part == null) ? null : parts.join('');
  },

  async setItem(key, value) {
    const previousCount = await readChunkCount(key);
    const chunks = splitIntoChunks(value);
    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(`${key}.${index}`, chunk)),
    );
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
    for (let index = chunks.length; index < previousCount; index += 1) {
      await SecureStore.deleteItemAsync(`${key}.${index}`);
    }
  },

  async removeItem(key) {
    const count = await readChunkCount(key);
    for (let index = 0; index < count; index += 1) {
      await SecureStore.deleteItemAsync(`${key}.${index}`);
    }
    await SecureStore.deleteItemAsync(countKey(key));
  },
};

/** Small synchronous preferences (theme, onboarding flag, last active role). */
export const preferences = {
  get(key, fallback = null) {
    try {
      return SecureStore.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      SecureStore.setItem(key, String(value));
    } catch {
      // Preferences are a convenience; losing one is harmless.
    }
  },
};
