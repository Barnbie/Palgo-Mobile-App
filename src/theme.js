// PalGo tokens transcribed from the supplied mobile design boards.
export const colors = {
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
}
