import React, { createContext, useContext } from 'react';
import { Text as NativeText } from 'react-native';
import { colors } from '../theme';

const InsideText = createContext(false);

/**
 * Drop-in replacement for React Native's Text. It starts from the current theme's text
 * colour (so dark mode gets light text); any colour set in `style` still wins. Text
 * nested inside another Text keeps inheriting its parent's colour as usual.
 */
export function Text({ style, ...props }) {
  const nested = useContext(InsideText);
  return (
    <InsideText.Provider value>
      <NativeText {...props} style={nested ? style : [{ color: colors.ink }, style]} />
    </InsideText.Provider>
  );
}
