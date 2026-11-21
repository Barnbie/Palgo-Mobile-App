import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

const SINGLE_LINE = 47;
const MULTI_LINE = 110;

// Gradient stops are [offset, colour, opacity].
// - glass: frosted glass with a white rim, for screens that sit on the uploaded artwork
//   (login, create account).
// - plainLight / plainDark: for ordinary screens. The field sits just under the page
//   colour with a soft edge so it blends in instead of standing out.
const LOOKS = {
  glass: {
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
  plainLight: {
    body: [
      ['0', '#E9ECF2', 1],
      ['1', '#F8F9FC', 1],
    ],
    rim: [
      ['0', '#C4CAD8', 0.8],
      ['0.5', '#FFFFFF', 0.4],
      ['1', '#FFFFFF', 0.95],
    ],
    inner: [
      ['0', '#9AA3B8', 0.22],
      ['0.5', '#FFFFFF', 0],
      ['1', '#FFFFFF', 0.4],
    ],
    shadow: '#8592B1',
    text: '#202433',
    placeholder: '#6B7488',
  },
  plainDark: {
    body: [
      ['0', '#090C16', 1],
      ['1', '#10162A', 1],
    ],
    rim: [
      ['0', '#05070F', 0.9],
      ['0.5', '#2A3552', 0.5],
      ['1', '#3A4668', 0.9],
    ],
    inner: [
      ['0', '#000000', 0.5],
      ['0.5', '#FFFFFF', 0],
      ['1', '#FFFFFF', 0.06],
    ],
    shadow: '#000000',
    text: '#F2F4F8',
    placeholder: '#8F99B0',
  },
};

const currentLook = (glass) => {
  if (glass) return LOOKS.glass;
  return colors.scheme === 'dark' ? LOOKS.plainDark : LOOKS.plainLight;
};

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
 * Raised input drawn with SVG: gradient body, a bright rim on one edge and a darker
 * rim on the other give it depth. Children (icon, field, eye) sit on top in a row.
 * Pass `glass` on screens that sit on the uploaded artwork.
 */
export function RaisedField({
  children,
  style,
  multiline = false,
  glass = false,
  height: fixedHeight,
}) {
  const [width, setWidth] = useState(0);
  const look = currentLook(glass);
  const height = fixedHeight || (multiline ? MULTI_LINE : SINGLE_LINE);
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
          shadowOpacity: glass ? 0.28 : 0.18,
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

export function RaisedTextInput({ style, multiline, glass = false, ...props }) {
  const look = currentLook(glass);
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

/**
 * A raised blue panel (header pill, round buttons) using the same depth trick as the
 * inputs: gradient body, bright upper rim, darker lower rim and a soft inner shade.
 */
export function Raised3D({ children, style }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const radius = Math.min(size.width, size.height) / 2;
  return (
    <View
      onLayout={(event) => setSize(event.nativeEvent.layout)}
      style={[
        {
          shadowColor: '#0F2F8A',
          shadowOpacity: 0.35,
          shadowRadius: 7,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
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
            <Stops
              id="panelBody"
              stops={[
                ['0', '#4F86F7', 1],
                ['1', '#1F4FCB', 1],
              ]}
            />
            <Stops
              id="panelRim"
              stops={[
                ['0', '#FFFFFF', 0.85],
                ['0.5', '#FFFFFF', 0.12],
                ['1', '#0B2578', 0.7],
              ]}
            />
            <Stops
              id="panelInner"
              stops={[
                ['0', '#0B2578', 0.35],
                ['0.4', '#FFFFFF', 0],
                ['1', '#FFFFFF', 0.28],
              ]}
            />
          </Defs>
          <Rect
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={radius}
            fill="url(#panelBody)"
          />
          <Rect
            x={4}
            y={4}
            width={size.width - 8}
            height={size.height - 8}
            rx={Math.max(radius - 3, 0)}
            fill="none"
            stroke="url(#panelInner)"
            strokeWidth={2.5}
          />
          <Rect
            x={1}
            y={1}
            width={size.width - 2}
            height={size.height - 2}
            rx={radius}
            fill="none"
            stroke="url(#panelRim)"
            strokeWidth={2}
          />
        </Svg>
      )}
      {children}
    </View>
  );
}
