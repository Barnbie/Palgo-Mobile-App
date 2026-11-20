import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const SINGLE_LINE = 47;
const MULTI_LINE = 110;

// Gradient stops for the light and dark looks. Light: frosted glass with a white
// rim; dark: a deeper body with a soft light rim, so the raised edge still shows.
const LOOKS = {
  light: {
    body: [
      ['0', '#8FBFCF', 0.5],
      ['0.55', '#B7DDE6', 0.45],
      ['1', '#E3F1F5', 0.8],
    ],
    rim: [
      ['0', '#FFFFFF', 0.95],
      ['0.5', '#FFFFFF', 0.3],
      ['1', '#6F9BB5', 0.6],
    ],
    inner: [
      ['0', '#5F8FA6', 0.4],
      ['0.35', '#FFFFFF', 0],
      ['1', '#FFFFFF', 0.75],
    ],
    shadow: '#5C7FA8',
    text: '#16202E',
    placeholder: '#5F6B7A',
  },
  dark: {
    body: [
      ['0', '#0E1424', 0.9],
      ['1', '#27304A', 0.9],
    ],
    rim: [
      ['0', '#6C7BA6', 0.9],
      ['0.5', '#4A5880', 0.35],
      ['1', '#0A0E19', 0.9],
    ],
    inner: [
      ['0', '#000000', 0.45],
      ['0.4', '#FFFFFF', 0],
      ['1', '#FFFFFF', 0.12],
    ],
    shadow: '#000000',
    text: '#F2F4F8',
    placeholder: '#A3ACBF',
  },
};

const currentLook = () => (colors.canvas === '#EEF2FF' ? LOOKS.light : LOOKS.dark);

function Stops({ id, stops }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([offset, color, opacity]) => (
        <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </LinearGradient>
  );
}

/**
 * Raised glass-style input drawn with SVG: a gradient body, a bright top rim and a
 * darker bottom rim give it depth. Children (icon, field, eye) sit on top in a row.
 */
export function RaisedField({ children, style, multiline = false }) {
  const [width, setWidth] = useState(0);
  const look = currentLook();
  const height = multiline ? MULTI_LINE : SINGLE_LINE;
  const radius = multiline ? 24 : height / 2;
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        {
          height,
          width: 367,
          maxWidth: '100%',
          alignSelf: 'center',
          marginBottom: 14,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          paddingHorizontal: 18,
          paddingTop: multiline ? 14 : 0,
          shadowColor: look.shadow,
          shadowOpacity: 0.28,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        style,
      ]}
    >
      {width > 0 && (
        <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Defs>
            <Stops id="raisedBody" stops={look.body} />
            <Stops id="raisedRim" stops={look.rim} />
            <Stops id="raisedInner" stops={look.inner} />
          </Defs>
          <Rect
            x={1}
            y={1}
            width={width - 2}
            height={height - 2}
            rx={radius}
            fill="url(#raisedBody)"
          />
          <Rect
            x={4}
            y={4}
            width={width - 8}
            height={height - 8}
            rx={radius - 3}
            fill="none"
            stroke="url(#raisedInner)"
            strokeWidth={2.5}
          />
          <Rect
            x={1}
            y={1}
            width={width - 2}
            height={height - 2}
            rx={radius}
            fill="none"
            stroke="url(#raisedRim)"
            strokeWidth={2}
          />
        </Svg>
      )}
      {children}
    </View>
  );
}

export function RaisedTextInput({ style, multiline, ...props }) {
  const look = currentLook();
  return (
    <TextInput
      placeholderTextColor={look.placeholder}
      multiline={multiline}
      {...props}
      style={[
        {
          flex: 1,
          fontSize: 14,
          color: look.text,
          paddingHorizontal: 12,
          paddingVertical: 0,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        multiline && { height: 82 },
        style,
      ]}
    />
  );
}
