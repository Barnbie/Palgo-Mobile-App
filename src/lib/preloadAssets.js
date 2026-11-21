import { Image } from 'react-native';
import * as assets from '../assets';

// Collects every local image listed in src/assets.js (they are numbers after require()).
function localImages() {
  const found = [];
  const visit = (value) => {
    if (typeof value === 'number') found.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(assets);
  return found;
}

/**
 * Loads the app's pictures before the first screen shows, so backgrounds and illustrations
 * are there the moment a screen opens. In development the pictures come from the computer
 * over wifi, which is the slow part this removes; installed builds already have them.
 * Never throws and never waits longer than `limitMs`.
 */
export async function preloadAssets(limitMs = 4000) {
  const loads = localImages().map((module) => {
    const uri = Image.resolveAssetSource(module)?.uri;
    return uri && /^https?:/.test(uri) ? Image.prefetch(uri).catch(() => false) : null;
  });
  const timeout = new Promise((resolve) => setTimeout(resolve, limitMs));
  await Promise.race([Promise.all(loads.filter(Boolean)), timeout]);
}

/** Warm the cache for a picture that arrives later (profile photos). */
export function prefetchImage(url) {
  if (url) Image.prefetch(url).catch(() => {});
}
