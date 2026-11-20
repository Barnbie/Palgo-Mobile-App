import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const HEIGHT = 47;
const RADIUS = HEIGHT / 2;

/**
 * Raised glass-style input drawn with SVG: a soft gradient body, a bright top
 * rim and a darker bottom rim give it depth. Children (icon, field, eye) are
 * laid out on top in a row.
 */
export function RaisedField({ children, style }) {
  const [width, setWidth] = useState(0);
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[
        {
          height: HEIGHT,
          width: 367,
          maxWidth: '100%',
          alignSelf: 'center',
          marginBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 18,
          shadowColor: '#5C7FA8',
          shadowOpacity: 0.28,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        },
        style,
      ]}
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT} style={{ position: 'absolute', left: 0, top: 0 }}>
          <Defs>
            <LinearGradient id="raisedBody" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#8FBFCF" stopOpacity="0.55" />
              <Stop offset="0.55" stopColor="#B7DDE6" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#D9EEF2" stopOpacity="0.7" />
            </LinearGradient>
            <LinearGradient id="raisedRim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.25" />
              <Stop offset="1" stopColor="#6F9BB5" stopOpacity="0.6" />
            </LinearGradient>
            <LinearGradient id="raisedInner" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#5F8FA6" stopOpacity="0.45" />
              <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.75" />
            </LinearGradient>
          </Defs>
          <Rect
            x={1}
            y={1}
            width={width - 2}
            height={HEIGHT - 2}
            rx={RADIUS}
            fill="url(#raisedBody)"
          />
          <Rect
            x={4}
            y={4}
            width={width - 8}
            height={HEIGHT - 8}
            rx={RADIUS - 3}
            fill="none"
            stroke="url(#raisedInner)"
            strokeWidth={2.5}
          />
          <Rect
            x={1}
            y={1}
            width={width - 2}
            height={HEIGHT - 2}
            rx={RADIUS}
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

export function RaisedTextInput(props) {
  return (
    <TextInput
      placeholderTextColor="#5F6B7A"
      {...props}
      style={[
        { flex: 1, fontSize: 14, color: '#16202E', paddingHorizontal: 12, paddingVertical: 0 },
        props.style,
      ]}
    />
  );
}
