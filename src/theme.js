// PalGo tokens transcribed from the supplied mobile design boards.
export const colors = {
  scheme: 'light',
  canvas: '#EEF2FF',
  paper: '#FFFFFF',
  blue: '#2563EB',
  blueDark: '#1949C5',
  mint: '#10B981',
  mintSoft: '#DDF8F1',
  ink: '#202433',
  muted: '#70778D',
  line: '#D6DEF3',
  success: '#18B990',
  warning: '#F3BA39',
  danger: '#F15959',
  map: '#CDE9DF',
  sheet: '#F7F9FF',
  // Compatibility aliases while the existing screen state machine is refactored.
  pale: '#EEF2FF',
  white: '#FFFFFF',
  red: '#F15959',
  gold: '#F3BA39',
};

const LIGHT = {
  canvas: '#EEF2FF',
  paper: '#FFFFFF',
  sheet: '#F7F9FF',
  pale: '#EEF2FF',
  ink: '#202433',
  muted: '#70778D',
  line: '#D6DEF3',
  mintSoft: '#DDF8F1',
};

// Dark mode: neutral dark grey page, dark navy cards, white / light-grey text.
// Brand colours (blue, mint) and `white` (text on coloured buttons) stay the same.
const DARK = {
  canvas: '#12151C',
  paper: '#1B2236',
  sheet: '#161C2C',
  pale: '#12151C',
  ink: '#F2F4F8',
  muted: '#A3ACBF',
  line: '#2C3652',
  mintSoft: '#123A33',
};

/** Switch the shared palette in place; callers must rebuild styles and re-render. */
export function applyColorScheme(scheme) {
  Object.assign(colors, scheme === 'dark' ? DARK : LIGHT);
  colors.scheme = scheme === 'dark' ? 'dark' : 'light';
}

const CARD_DARK = [27, 34, 54];
const toRgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));

/** A light pastel fill in light mode; the same tint, deepened towards navy, in dark mode. */
colors.soft = (hex) => {
  if (colors.scheme !== 'dark' || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  const rgb = toRgb(hex);
  const luma = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  if (luma < 0.78) return hex;
  const mixed = rgb.map((channel, index) =>
    Math.round(CARD_DARK[index] + (channel - CARD_DARK[index]) * 0.1),
  );
  return `rgb(${mixed.join(',')})`;
};

/** Translucent white panel in light mode, translucent navy in dark mode. */
colors.glass = (alpha) =>
  colors.scheme === 'dark'
    ? `rgba(27,34,54,${Math.min(1, alpha + 0.1)})`
    : `rgba(255,255,255,${alpha})`;

/** Default colour for code-drawn icons: brand blue in light mode, green in dark mode. */
colors.icon = () => (colors.scheme === 'dark' ? '#34D399' : '#2563EB');
