import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

// Glossy pill button: a vertical gradient body, a soft highlight on the upper half and a
// thin light/dark rim, so it reads as a button rather than an input. Green by default.
const TONES = {
  green: {
    light: ['#3DDBA0', '#0E9F6E'],
    dark: ['#2FC38C', '#067A55'],
    edge: '#06684A',
  },
  blue: {
    light: ['#5B8FF9', '#2457D6'],
    dark: ['#4C7FEA', '#1B43AE'],
    edge: '#10307F',
  },
};

export function GradientButton({
  children,
  onPress,
  style,
  tone = 'green',
  disabled = false,
  accessibilityLabel,
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const palette = TONES[tone] || TONES.green;
  const [top, bottom] = colors.scheme === 'dark' ? palette.dark : palette.light;
  const radius = size.height / 2;
  const {
    backgroundColor: _bg,
    borderWidth: _bw,
    borderColor: _bc,
    ...rest
  } = StyleSheet.flatten(style) || {};
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      activeOpacity={0.85}
      onPress={onPress}
      onLayout={(event) => setSize(event.nativeEvent.layout)}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: disabled ? 0.55 : 1,
          shadowColor: palette.edge,
          shadowOpacity: colors.scheme === 'dark' ? 0.4 : 0.28,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        rest,
        { backgroundColor: bottom },
      ]}
    >
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={{ position: 'absolute', left: 0, top: 0 }}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="gbBody" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={top} />
              <Stop offset="1" stopColor={bottom} />
            </LinearGradient>
            <LinearGradient id="gbGloss" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.38" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="gbRim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="1" stopColor={palette.edge} stopOpacity="0.55" />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} rx={radius} fill="url(#gbBody)" />
          <Rect
            x={3}
            y={2}
            width={size.width - 6}
            height={size.height / 2}
            rx={Math.max(radius - 3, 0)}
            fill="url(#gbGloss)"
          />
          <Rect
            x={0.75}
            y={0.75}
            width={size.width - 1.5}
            height={size.height - 1.5}
            rx={Math.max(radius - 0.75, 0)}
            fill="none"
            stroke="url(#gbRim)"
            strokeWidth={1.5}
          />
        </Svg>
      )}
      <View pointerEvents="none" style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </TouchableOpacity>
  );
}
