import React from 'react';
import { colors } from '../theme';
import Svg, { Circle, Defs, G, LinearGradient, Line, Path, Stop } from 'react-native-svg';

// PalGo's code-drawn icon set (24x24 grid). Every icon is a filled shape with a soft
// top-to-bottom gradient so it looks slightly raised. Pass variant="outline" for the
// outline version (used by inactive tab-bar icons). Names match the lucide icons the
// app used before, so screens can swap imports without other changes.

function lighten(hex) {
  const value = String(hex).replace('#', '');
  if (value.length !== 6) return hex;
  const mix = (offset) => {
    const channel = parseInt(value.slice(offset, offset + 2), 16);
    return Math.round(channel + (255 - channel) * 0.28)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${mix(0)}${mix(2)}${mix(4)}`;
}

// In dark mode the brand blue is shown as green, which reads better on navy cards.
const tone = (color) => (colors.scheme === 'dark' && color === '#2563EB' ? '#34D399' : color);

let counter = 0;
function useGradientId() {
  const ref = React.useRef(null);
  if (!ref.current) {
    counter += 1;
    ref.current = `pg-grad-${counter}`;
  }
  return ref.current;
}

/** Shared wrapper: gives children the fill (gradient or none) and stroke settings. */
function Glyph({
  size = 22,
  color: rawColor = colors.icon(),
  variant = 'filled',
  style,
  children,
}) {
  const color = tone(rawColor);
  const id = useGradientId();
  const outline = variant === 'outline';
  const paint = {
    fill: outline ? 'none' : `url(#${id})`,
    stroke: outline ? color : 'none',
    strokeWidth: outline ? 1.7 : 0,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lighten(color)} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>
      {children(paint, color)}
    </Svg>
  );
}

const shape = (d) =>
  function ShapeIcon(props) {
    return <Glyph {...props}>{(paint) => <Path d={d} {...paint} fillRule="evenodd" />}</Glyph>;
  };

// ---- Shapes -------------------------------------------------------------------
export const PersonIcon = shape(
  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
);
export const HomeIcon = shape('M12 3 2 12h3v8h5v-6h4v6h5v-8h3z');
export const WalletIcon = shape(
  'M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2zm-9-2h10V8H12zm4-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
);
export const ErrandsIcon = shape(
  'M19 3h-4.2c-.4-1.2-1.5-2-2.8-2s-2.4.8-2.8 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm2 14H7v-2h7zm3-4H7v-2h10zm0-4H7V7h10z',
);
export const MailIcon = shape(
  'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z',
);
export const LockIcon = shape(
  'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0z',
);
export const EyeIcon = shape(
  'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
);
export const EyeOffIcon = shape(
  'M12 7a5 5 0 0 1 5 5c0 .65-.13 1.26-.36 1.83l2.92 2.92A11.8 11.8 0 0 0 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.8 11.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55A3 3 0 0 0 9 12a3 3 0 0 0 3 3c.22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53a5 5 0 0 1-5-5c0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16a3 3 0 0 0-3-3z',
);
export const PhoneIcon = shape(
  'M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z',
);
export const StarIcon = shape(
  'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
);
export const CheckCircleIcon = shape(
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8z',
);
export const ClockIcon = shape(
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z',
);
export const MapPinIcon = shape(
  'M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
);
export const ChatIcon = shape('M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z');
export const CalendarIcon = shape(
  'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14zM7 12h4v4H7z',
);
export const CashIcon = shape(
  'M19 14V6a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zm-9-1a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm13-6v11a2 2 0 0 1-2 2H4v-2h17V7z',
);
export const CameraIcon = shape(
  'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10z',
);
export const ReceiptIcon = shape(
  'M19.5 3.5 18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V2zM19 19a1 1 0 0 1-2 0v-3H8V5h11zM9 7h6v2H9zm7 0h2v2h-2zm-7 3h6v2H9zm7 0h2v2h-2z',
);
export const TrashIcon = shape(
  'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
);
export const TermsIcon = shape(
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 7V3.5L18.5 9zM8 13h8v2H8zm0 4h8v2H8z',
);
export const PrivacyIcon = shape(
  'M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5zm-1.2 14L7 12.2l1.4-1.4 2.4 2.4 4.8-4.8L17 9.8z',
);
export const SupportIcon = shape(
  'M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h3v-8H5v-2a7 7 0 0 1 14 0v2h-4v8h4v1h-7v2h7a3 3 0 0 0 3-3V10a9 9 0 0 0-9-9z',
);
export const LogoutIcon = shape(
  'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4z',
);
export const WarningIcon = shape('M12 2 1 21h22zm1 15h-2v-2h2zm0-4h-2V9h2z');
export const IdCardIcon = shape(
  'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 7.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM14 16H4v-.5c0-1.7 3.3-2.5 5-2.5s5 .8 5 2.5zM20 14h-4v-1.5h4zm0-3h-5V9.5h5z',
);
export const GlobeIcon = shape(
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8 8 0 0 1 18.9 8zM12 4c.83 1.2 1.48 2.53 1.91 4h-3.82c.43-1.47 1.08-2.8 1.91-4zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4zm.84 2h2.95c.32 1.25.78 2.45 1.38 3.56A8 8 0 0 1 5.1 16zM8.05 8H5.1a8 8 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.05 8zM12 20c-.83-1.2-1.48-2.53-1.91-4h3.82c-.43 1.47-1.08 2.8-1.91 4zm2.34-6H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8 8 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4z',
);
export const WrenchIcon = shape(
  'M22.7 19 13.6 9.9c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
);
export const TruckIcon = shape(
  'M20 8h-3V4H3a2 2 0 0 0-2 2v11h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2v-5zM6 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13.5-9 1.96 2.5H17V9.5zm-1.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
);
export const CartIcon = shape(
  'M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96a2 2 0 0 0 2 2h12v-2H7.42a.25.25 0 0 1-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2zm16 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
);
export const BoxIcon = shape(
  'M12 2 3 6.5v11L12 22l9-4.5v-11zm0 2.3 5.8 2.9L12 10 6.2 7.2zM5 8.8l6 3v7.4l-6-3zm8 10.4v-7.4l6-3v7.4z',
);
export const PotIcon = shape(
  'M3 11h18v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM9.5 5.5h5a.9.9 0 0 1 0 1.8h-5a.9.9 0 0 1 0-1.8zM10.5 7.3h3V9.5h-3zM1.5 11.7h1.5v1.8H1.5a.9.9 0 0 1 0-1.8zM21 11.7h1.5a.9.9 0 0 1 0 1.8H21z',
);
export const SparkleIcon = shape('M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z');
export const ChevronRightIcon = shape('M8 5l9 7-9 7z');
export const ChevronLeftIcon = shape('M16 5l-9 7 9 7z');
export const ChevronDownIcon = shape('M5 8h14l-7 9z');

export function PasswordIcon(props) {
  return (
    <Glyph {...props}>
      {(paint) => (
        <G>
          <Path
            {...paint}
            d="M3 5.5A1.5 1.5 0 0 1 4.5 4h14A1.5 1.5 0 0 1 20 5.5V11l-3 3h-3v3H4.5A1.5 1.5 0 0 1 3 15.5z"
          />
          <Path
            {...paint}
            d="M20.7 13.3l-1-1a1 1 0 0 0-1.4 0L13 17.6V20h2.4l5.3-5.3a1 1 0 0 0 0-1.4z"
          />
          {props.variant !== 'outline' && (
            <Path
              d="M6 8h10M6 11h6"
              stroke="#FFFFFF"
              strokeWidth={1.6}
              strokeLinecap="round"
              fill="none"
            />
          )}
        </G>
      )}
    </Glyph>
  );
}

const BELL_BODY =
  'M12 2.8a1.6 1.6 0 0 1 1.6 1.6v.5A6 6 0 0 1 18 10.7v3.2l1.7 2.5c.4.6 0 1.4-.8 1.4H5.1c-.8 0-1.2-.8-.8-1.4L6 13.9v-3.2A6 6 0 0 1 10.4 4.9v-.5A1.6 1.6 0 0 1 12 2.8z';
const BELL_CLAPPER = 'M9.6 19.4a2.4 2.4 0 0 0 4.8 0z';

/** A plain bell. The home and wallet headers draw their own red count badge on top of it. */
export function BellOnlyIcon(props) {
  return (
    <Glyph {...props}>
      {(paint) => (
        <G>
          <Path {...paint} d={BELL_BODY} />
          <Path {...paint} d={BELL_CLAPPER} />
        </G>
      )}
    </Glyph>
  );
}

/** A bell with a small dot, used where the screen is about notifications. */
export function NotificationIcon(props) {
  return (
    <Glyph {...props}>
      {(paint, color) => (
        <G>
          <Path {...paint} d={BELL_BODY} />
          <Path {...paint} d={BELL_CLAPPER} />
          <Circle
            cx={18.6}
            cy={5.4}
            r={3.3}
            fill="#F15959"
            stroke={color === '#FFFFFF' ? '#2563EB' : '#FFFFFF'}
            strokeWidth={1.2}
          />
        </G>
      )}
    </Glyph>
  );
}

export function ThemeIcon({ size = 22, color: rawColor = colors.icon() }) {
  const color = tone(rawColor);
  const rays = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 4;
    return {
      x1: 12 + Math.cos(angle) * 8,
      y1: 12 + Math.sin(angle) * 8,
      x2: 12 + Math.cos(angle) * 10.5,
      y2: 12 + Math.sin(angle) * 10.5,
    };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={5.2} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M12 6.8a5.2 5.2 0 0 0 0 10.4z" fill={color} />
      {rays.map((ray) => (
        <Line
          key={`${ray.x1}-${ray.y1}`}
          {...ray}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

export function CloseIcon({ size = 22, color: rawColor = colors.icon() }) {
  const color = tone(rawColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6 6 18" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 22, color: rawColor = colors.icon() }) {
  const color = tone(rawColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} fill="none" stroke={color} strokeWidth={2.6} />
      <Path d="M15.5 15.5 21 21" stroke={color} strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  );
}

export function MoreIcon({ size = 22, color: rawColor = colors.icon() }) {
  const color = tone(rawColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {[5, 12, 19].map((cx) => (
        <Circle key={cx} cx={cx} cy={12} r={2.2} fill={color} />
      ))}
    </Svg>
  );
}

/** Large round badge used on success screens. */
export function SuccessBadge({ size = 92, color = '#10B981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Defs>
        <LinearGradient id="pg-success" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lighten(color)} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>
      <Circle cx={48} cy={48} r={44} fill="url(#pg-success)" />
      <Circle
        cx={48}
        cy={48}
        r={44}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.55}
        strokeWidth={3}
      />
      <Path
        d="M30 49l13 13 24-26"
        stroke="#FFFFFF"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ---- Active errand icons --------------------------------------------------------
/** A big phone with a small chat bubble in the hollow of the handset: the "contact" button. */
export function PhoneChatIcon(props) {
  return (
    <Glyph {...props}>
      {(paint) => (
        <>
          <Path
            d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02z"
            {...paint}
          />
          <G transform="translate(-2.6 2.4)">
            <Path
              d="M16.2 3.2h3.6a1.7 1.7 0 0 1 1.7 1.7v2.9a1.7 1.7 0 0 1-1.7 1.7h-1.3l-1.9 1.8v-1.8h-.4a1.7 1.7 0 0 1-1.7-1.7V4.9a1.7 1.7 0 0 1 1.7-1.7z"
              {...paint}
            />
          </G>
        </>
      )}
    </Glyph>
  );
}

/** Shield with a small person badge at the bottom corner: the "safety" button. */
export function SafetyIcon({ cutout = '#2563EB', ...props }) {
  return (
    <Glyph {...props}>
      {(paint, color) => (
        <>
          <G transform="translate(1.3 2)">
            <Path
              d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z"
              transform="translate(-1.5 -1.5) scale(.82)"
              {...paint}
            />
            <Circle cx={15.2} cy={15.4} r={4.4} fill={cutout} />
            <Circle cx={15.2} cy={15.4} r={3.4} fill={paint.fill === 'none' ? color : paint.fill} />
            <Circle cx={15.2} cy={14.3} r={1} fill={cutout} />
            <Path d="M13.3 17.2c0-1 1.3-1.5 1.9-1.5s1.9.5 1.9 1.5z" fill={cutout} />
          </G>
        </>
      )}
    </Glyph>
  );
}

export const SirenIcon = shape(
  'M12 3a6 6 0 0 0-6 6v5H4v3h16v-3h-2V9a6 6 0 0 0-6-6zm-1 3h2v4h-2zM3 19h18v2H3zM2 8l2-1 1 2-2 1zm20 0-2-1-1 2 2 1z',
);
export const ShareIcon = shape('M14 4l8 8-8 8v-5c-5.5 0-9 1.8-11 5.5.6-6.5 4.7-10.7 11-11.4z');
export const CancelCircleIcon = shape(
  'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 13.6L15.6 17 12 13.4 8.4 17 7 15.6 10.6 12 7 8.4 8.4 7 12 10.6 15.6 7 17 8.4 13.4 12z',
);

export const SendIcon = shape('M3 20.5v-6.7l9-1.8-9-1.8V3.5L22 12z');

// Material Symbols "moped_package" (Apache 2.0): a delivery moped with a package on the back.
const MOPED_SOLID =
  'M3 8V3h7v5zm4 11q-1.25 0-2.125-.875T4 16H2v-3q0-1.65 1.175-2.825T6 9h4v5h3.5L17 9.65V7h-3V5h3q.825 0 1.413.588T19 7v3.35L14.5 16H10q0 1.25-.875 2.125T7 19m0-2q.425 0 .713-.288T8 16H6q0 .425.288.713T7 17m12 2q-1.25 0-2.125-.875T16 16t.875-2.125T19 13t2.125.875T22 16t-.875 2.125T19 19m0-2q.425 0 .713-.288T20 16t-.288-.712T19 15t-.712.288T18 16t.288.713T19 17';
const MOPED_HOLLOW =
  'M3 8V3h7v5zm2-2h3V5H5zm2 13q-1.25 0-2.125-.875T4 16H2v-3q0-1.65 1.175-2.825T6 9h4v5h3.5L17 9.65V7h-3V5h3q.825 0 1.413.588T19 7v3.35L14.5 16H10q0 1.25-.875 2.125T7 19m0-2q.425 0 .713-.288T8 16H6q0 .425.288.713T7 17m12 2q-1.25 0-2.125-.875T16 16t.875-2.125T19 13t2.125.875T22 16t-.875 2.125T19 19m0-2q.425 0 .713-.288T20 16t-.288-.712T19 15t-.712.288T18 16t.288.713T19 17M4 14h4v-3H6q-.825 0-1.412.588T4 13zm4-8V5zm0 8';

/** Errands tab icon: solid when active, hollow when inactive. */
export function ErrandsBikeIcon(props) {
  const hollow = props.variant === 'outline';
  return (
    <Glyph {...props} variant="filled">
      {(paint, color) => (
        <Path
          d={hollow ? MOPED_HOLLOW : MOPED_SOLID}
          fill={hollow ? color : paint.fill}
          fillRule="evenodd"
        />
      )}
    </Glyph>
  );
}
