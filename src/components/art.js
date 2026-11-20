import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Code-drawn card backgrounds (no image files). Each draws a gradient plus soft
// translucent shapes and a glossy highlight, sized to whatever view they fill.
const PALETTES = {
  walletHeader: ['#3B82F6', '#1D4FD7', '#FFFFFF'],
  walletBalance: ['#2F6FF0', '#173FAF', '#FFFFFF'],
  walletPromo: ['#22C98E', '#0B8F66', '#FFFFFF'],
};

function Shapes({ variant, width: w, height: h }) {
  if (variant === 'walletHeader') {
    return (
      <>
        <Circle cx={w * 0.92} cy={h * 0.1} r={h * 0.9} fill="#FFFFFF" fillOpacity={0.1} />
        <Circle cx={w * 0.72} cy={h * 1.1} r={h * 0.7} fill="#FFFFFF" fillOpacity={0.08} />
        <Circle cx={w * 0.05} cy={h * 1.0} r={h * 0.55} fill="#0B2E8F" fillOpacity={0.25} />
      </>
    );
  }
  if (variant === 'walletBalance') {
    return (
      <>
        <Circle cx={w * 0.88} cy={h * 0.15} r={h * 0.75} fill="#FFFFFF" fillOpacity={0.1} />
        <Circle cx={w * 0.78} cy={h * 0.95} r={h * 0.6} fill="#FFFFFF" fillOpacity={0.07} />
        <Circle cx={w * 0.02} cy={h * 0.95} r={h * 0.6} fill="#0B2E8F" fillOpacity={0.3} />
        <Path
          d={`M0 ${h * 0.78} C ${w * 0.25} ${h * 0.55}, ${w * 0.5} ${h * 1.0}, ${w} ${h * 0.62} L ${w} ${h} L 0 ${h} Z`}
          fill="#FFFFFF"
          fillOpacity={0.08}
        />
      </>
    );
  }
  return (
    <>
      <Circle cx={w * 0.86} cy={h * 0.5} r={h * 0.62} fill="#FFFFFF" fillOpacity={0.14} />
      <Circle
        cx={w * 0.86}
        cy={h * 0.5}
        r={h * 0.4}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.35}
        strokeWidth={3}
      />
      <Circle cx={w * 0.7} cy={h * 1.05} r={h * 0.4} fill="#FFFFFF" fillOpacity={0.08} />
      <Circle cx={w * 0.04} cy={h * 0.1} r={h * 0.5} fill="#05694B" fillOpacity={0.22} />
    </>
  );
}

export function ArtBackground({ variant, style, children }) {
  const radius = StyleSheet.flatten(style)?.borderRadius || 0;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [from, to] = PALETTES[variant] || PALETTES.walletBalance;
  return (
    <View
      onLayout={(event) => setSize(event.nativeEvent.layout)}
      style={[{ overflow: 'hidden' }, style]}
    >
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={{ position: 'absolute', left: 0, top: 0 }}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={`art-${variant}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LinearGradient>
            <LinearGradient id="art-gloss" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#art-${variant})`} />
          <Shapes variant={variant} width={size.width} height={size.height} />
          <Rect width={size.width} height={size.height * 0.5} fill="url(#art-gloss)" />
          <Rect
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={radius}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.25}
            strokeWidth={1.5}
          />
        </Svg>
      )}
      {children}
    </View>
  );
}
