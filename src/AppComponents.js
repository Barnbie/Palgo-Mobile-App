import { GradientButton } from './components/GradientButton';
import React from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Text } from './components/ThemedText';
import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  CreditCard,
  House,
  UserRound,
  X,
} from './components/glyphs';
import { colors as C } from './theme';
import { ArtBackground } from './components/art';
import { RaisedField, RaisedTextInput } from './components/Input3D';
import { homeProfileImage, palgoLogos, profileAssets } from './assets';

const money = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

function Shell({ children, back, right, scroll = true }) {
  const allChildren = React.Children.toArray(children);
  const fixedHeaders = allChildren.filter((child) => child.type === Header);
  const bodyChildren = allChildren.filter((child) => child.type !== Header);
  const nav = (back || right) && (
    <View style={[s.nav, { height: 42 }]}>
      {back ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={back}
          style={[s.back, { minHeight: 42, minWidth: 48, justifyContent: 'center' }]}
        >
          <ChevronLeft size={24} color={C.ink} />
        </TouchableOpacity>
      ) : (
        <View style={s.back} />
      )}
      <View style={{ flex: 1 }} />
      {right || null}
    </View>
  );
  return (
    <View style={[s.page, s.pageFill, { paddingTop: 28 }]}>
      {nav}
      {fixedHeaders}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {bodyChildren}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{bodyChildren}</View>
      )}
    </View>
  );
}
const Logo = ({ style, variant = 'onboarding' }) =>
  style === a.authLogo ? (
    <View style={{ height: 20 }} />
  ) : (
    <View style={[a.logoPlaceholder, style]}>
      {palgoLogos[variant] ? (
        <Image source={palgoLogos[variant]} resizeMode="contain" style={a.logoImage} />
      ) : (
        <Text style={a.logoPlaceholderText}>LOGO IMAGE</Text>
      )}
    </View>
  );
const Button = ({ title, onPress, kind = 'primary', small = false }) => {
  const filled = kind === 'primary' || kind === 'secondary';
  const label = (
    <Text
      style={[s.buttonText, kind === 'outline' && s.outlineText, kind === 'danger' && s.dangerText]}
    >
      {title}
    </Text>
  );
  if (filled) {
    return (
      <GradientButton
        onPress={onPress}
        tone={kind === 'secondary' ? 'green' : 'blue'}
        style={{ height: small ? 38 : 40, borderRadius: 20, paddingHorizontal: 14 }}
      >
        {label}
      </GradientButton>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.button,
        { height: 40, minHeight: 40, borderRadius: 20 },
        kind === 'outline' && s.outline,
        kind === 'danger' && s.danger,
        small && s.smallButton,
      ]}
    >
      {label}
    </TouchableOpacity>
  );
};
const Header = ({ eyebrow, title, sub }) => (
  <>
    <Text style={s.eyebrow}>{eyebrow}</Text>
    <Text style={s.title}>{title}</Text>
    {sub && <Text style={s.sub}>{sub}</Text>}
  </>
);
const AssetBackground = ({ source, art, style, children, placeholderLabel }) => {
  if (source) {
    return (
      <ImageBackground source={source} resizeMode="cover" style={style}>
        {children}
      </ImageBackground>
    );
  }
  if (art) {
    return (
      <ArtBackground variant={art} style={style}>
        {children}
      </ArtBackground>
    );
  }
  return (
    <View style={style}>
      {placeholderLabel && (
        <Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: '50%',
            fontSize: 8,
            fontWeight: '800',
            letterSpacing: 0.4,
            color: 'rgba(255,255,255,.48)',
          }}
        >
          {placeholderLabel}
        </Text>
      )}
      {children}
    </View>
  );
};

function PalCompleteWaiting({ errand, onBack }) {
  return (
    <Shell back={onBack}>
      <View style={{ alignItems: 'center', marginTop: 52 }}>
        <CheckCircle2 size={74} color={C.mint} fill={C.mint} />
        <Text style={{ fontSize: 21, fontWeight: '800', marginTop: 20 }}>Errand Complete!</Text>
      </View>
      <View
        style={{
          backgroundColor: C.paper,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: C.blue,
          padding: 18,
          marginTop: 44,
        }}
      >
        <Text style={{ fontSize: 14 }}>Errand: {errand.title}</Text>
        <Text style={{ fontSize: 14, marginTop: 14 }}>
          Customer: {errand.person?.name || 'User'}
        </Text>
        <Text style={{ fontSize: 14, marginTop: 14 }}>Payment amount: {money(errand.fee)}</Text>
      </View>
      <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 20 }}>
        The User will confirm completion and payment. Your errand status is saved.
      </Text>
      <Text style={{ fontSize: 15, textAlign: 'center', marginTop: 50 }}>
        Waiting for confirmation...
      </Text>
    </Shell>
  );
}

function Notifications({ onBack, load, onSeen }) {
  const [items, setItems] = React.useState(null);
  React.useEffect(() => {
    let active = true;
    Promise.resolve(load?.())
      .then((rows) => {
        if (!active) return;
        setItems(rows || []);
        onSeen?.();
      })
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell back={onBack}>
      <Header eyebrow="UPDATES" title="Notifications." />
      {items === null ? (
        <Text style={{ textAlign: 'center', color: C.muted, marginTop: 32 }}>Loading…</Text>
      ) : items.length ? (
        items.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: C.paper,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              borderLeftWidth: item.read_at ? 0 : 4,
              borderLeftColor: C.mint,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '800' }}>{item.title}</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 18 }}>
              {item.body}
            </Text>
            <Text style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={{ textAlign: 'center', color: C.muted, marginTop: 32 }}>
          You have no notifications yet.
        </Text>
      )}
    </Shell>
  );
}
function Success({ icon, title, copy, primary, onPrimary, secondary, onSecondary, imageSource }) {
  return (
    <Shell>
      <View style={s.success}>
        {imageSource ? (
          <Image
            source={imageSource}
            resizeMode="contain"
            style={{ height: 82, width: 82, marginBottom: 18 }}
          />
        ) : icon ? (
          <Text style={s.successIcon}>{icon}</Text>
        ) : (
          <View
            style={{
              height: 82,
              width: 82,
              borderRadius: 41,
              borderWidth: 2,
              borderColor: C.blue,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <CheckCircle2 size={38} color={C.mint} />
          </View>
        )}
        <Text style={s.eyebrow}>SUCCESS</Text>
        <Text style={s.successTitle}>{title}</Text>
        <Text style={s.sub}>{copy}</Text>
      </View>
      {primary && <Button title={primary} onPress={onPrimary} />}{' '}
      {secondary && (
        <>
          <View style={{ height: 10 }} />
          <Button kind="outline" title={secondary} onPress={onSecondary} />
        </>
      )}
    </Shell>
  );
}
function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  secure,
  maxLength,
}) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <RaisedField multiline={multiline} style={{ marginBottom: 0 }}>
        <RaisedTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          maxLength={maxLength}
          autoCorrect={false}
        />
      </RaisedField>
    </View>
  );
}
function Card({ children }) {
  return <View style={s.card}>{children}</View>;
}
function Avatar({ image, big }) {
  const size = big ? 76 : 44;
  return (
    <View
      style={[
        s.avatar,
        big && s.avatarBig,
        {
          overflow: 'hidden',
          backgroundColor: C.paper,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      {image ? (
        <Image
          source={image}
          resizeMode="cover"
          style={{ height: '100%', width: '100%', borderRadius: size / 2 }}
        />
      ) : (
        <UserRound size={Math.round(size * 0.48)} color={C.blue} strokeWidth={2} />
      )}
    </View>
  );
}
// Expo Go's Android client may not have a working bundled Google Maps key.
// Show OpenStreetMap tiles during development; installed builds use the
// project's Google Maps key configured by app.config.js.
const isExpoGo = Constants.appOwnership === 'expo';
const useDevelopmentMapTiles = __DEV__ && isExpoGo && Platform.OS === 'android';
const mapProvider =
  Platform.OS === 'android' || (Platform.OS === 'ios' && !isExpoGo) ? PROVIDER_GOOGLE : undefined;
const developmentMapTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
function MapAttribution({ home = false }) {
  return useDevelopmentMapTiles ? (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 8,
        bottom: home ? 83 : 5,
        backgroundColor: C.glass(0.88),
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
      }}
    >
      <Text style={{ fontSize: 9, color: C.ink }}>© OpenStreetMap contributors</Text>
    </View>
  ) : null;
}
function HomeMap() {
  const { width, height } = useWindowDimensions();
  const initialRegion = {
    latitude: 6.5244,
    longitude: 3.3792,
    latitudeDelta: 0.09,
    longitudeDelta: 0.09,
  };
  const renderer = Platform.OS === 'android' ? 'LATEST' : undefined;
  const mapFrame = {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: C.soft('#DCEFE8'),
  };
  return (
    <View
      style={mapFrame}
      onLayout={(event) => {
        const size = event.nativeEvent.layout;
        console.info('[Palgo map] home container size', size.width, size.height);
      }}
    >
      <MapView
        style={{ width, height }}
        provider={mapProvider}
        googleRenderer={renderer}
        initialRegion={initialRegion}
        mapType={useDevelopmentMapTiles ? 'none' : 'standard'}
        toolbarEnabled={false}
        loadingEnabled
        onLayout={(event) => {
          const size = event.nativeEvent.layout;
          console.info('[Palgo map] native map size', size.width, size.height);
        }}
        onMapReady={() => console.info('[Palgo map] home map ready')}
        onMapLoaded={() => console.info('[Palgo map] home map tiles loaded')}
        onError={(event) => console.error('[Palgo map] home map error', event.nativeEvent)}
      >
        {useDevelopmentMapTiles && (
          <UrlTile urlTemplate={developmentMapTiles} maximumZ={19} zIndex={-1} />
        )}
        <Marker
          coordinate={{ latitude: 6.5244, longitude: 3.3792 }}
          pinColor={C.blue}
          title="Your location"
        />
      </MapView>
      <MapAttribution home />
    </View>
  );
}
function Choice({ label, sub, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.choice, selected && s.choiceOn]}>
      <View>
        <Text style={s.cardTitle}>{label}</Text>
        <Text style={s.cardText}>{sub}</Text>
      </View>
      <Text style={{ fontSize: 20, color: selected ? C.mint : C.line }}>
        {selected ? '●' : '○'}
      </Text>
    </TouchableOpacity>
  );
}
function RowText({ left, right, strong }) {
  return (
    <View style={s.rowText}>
      <Text style={[s.cardText, strong && s.strong]}>{left}</Text>
      <Text style={[s.cardText, strong && s.strong]} numberOfLines={1}>
        {right}
      </Text>
    </View>
  );
}

const buildStyles = () =>
  StyleSheet.create({
    homeScreen: { flex: 1, backgroundColor: C.soft('#DCEFE8'), overflow: 'hidden' },
    homeMap: { ...StyleSheet.absoluteFillObject, backgroundColor: C.soft('#DCEFE8') },
    mapParkOne: {
      position: 'absolute',
      height: 250,
      width: 280,
      borderRadius: 140,
      backgroundColor: C.soft('#BDE8CD'),
      left: -90,
      top: 130,
    },
    mapParkTwo: {
      position: 'absolute',
      height: 210,
      width: 260,
      borderRadius: 110,
      backgroundColor: C.soft('#C9EEC7'),
      right: -100,
      bottom: 100,
    },
    mapRoadOne: {
      position: 'absolute',
      height: 24,
      width: '140%',
      backgroundColor: C.glass(0.9),
      top: '29%',
      left: '-18%',
      transform: [{ rotate: '-21deg' }],
    },
    mapRoadTwo: {
      position: 'absolute',
      height: 22,
      width: '140%',
      backgroundColor: C.glass(0.9),
      top: '58%',
      left: '-18%',
      transform: [{ rotate: '31deg' }],
    },
    mapRoadThree: {
      position: 'absolute',
      height: 18,
      width: '125%',
      backgroundColor: C.glass(0.86),
      top: '47%',
      left: '-16%',
      transform: [{ rotate: '-58deg' }],
    },
    mapPin: {
      position: 'absolute',
      height: 44,
      width: 44,
      borderRadius: 22,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: C.soft('#DCEFE8'),
      shadowColor: '#1646B4',
      shadowOpacity: 0.4,
      shadowRadius: 5,
      elevation: 5,
    },
    mapTown: { position: 'absolute', fontSize: 14, fontWeight: '800', color: C.muted },
    mapZoom: {
      position: 'absolute',
      right: 15,
      bottom: 170,
      backgroundColor: C.paper,
      borderRadius: 10,
      overflow: 'hidden',
      alignItems: 'center',
      shadowColor: '#555',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    mapZoomText: { fontSize: 25, fontWeight: '800', paddingHorizontal: 11, paddingVertical: 1 },
    mapZoomLine: { height: 1, width: 30, backgroundColor: C.line },
    homeMapPin: {
      position: 'absolute',
      top: '34%',
      left: '49%',
      height: 47,
      width: 47,
      borderRadius: 24,
      backgroundColor: C.paper,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#54716C',
      shadowOpacity: 0.25,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    homeMapLabel: {
      position: 'absolute',
      top: '47%',
      right: 34,
      fontSize: 13,
      fontWeight: '800',
      color: C.muted,
    },
    homeTop: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    homeRoundButton: {
      height: 46,
      width: 46,
      borderRadius: 23,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1646B4',
      shadowOpacity: 0.65,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 0,
      elevation: 4,
    },
    homePanel: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      minHeight: 144,
      backgroundColor: C.canvas,
      borderTopLeftRadius: 29,
      borderTopRightRadius: 29,
      paddingHorizontal: 22,
      paddingTop: 13,
      paddingBottom: 17,
    },
    homePanelExpanded: { minHeight: 390 },
    panelHandle: { alignItems: 'center', height: 24 },
    handle: { height: 4, width: 42, borderRadius: 4, backgroundColor: '#B9C4E0', marginBottom: 2 },
    homeRequestButton: {
      height: 44,
      width: 258,
      alignSelf: 'center',
      borderRadius: 24,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1646B4',
      shadowOpacity: 0.65,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 0,
      elevation: 4,
      marginTop: 21,
    },
    homeRequestText: { fontSize: 14, fontWeight: '800', color: C.white },
    homeSearch: {
      height: 44,
      backgroundColor: C.paper,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      marginTop: 8,
    },
    homeSearchInput: { flex: 1, paddingHorizontal: 9, fontSize: 14, color: C.ink },
    homeSectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: C.ink,
      marginTop: 15,
      marginBottom: 10,
    },
    homeServices: { flexDirection: 'row', gap: 8 },
    homeService: {
      flex: 1,
      height: 51,
      borderRadius: 13,
      backgroundColor: '#2563EB',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      shadowColor: '#1646B4',
      shadowOpacity: 0.55,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 0,
      elevation: 3,
    },
    homeServiceText: { color: C.white, fontSize: 10, fontWeight: '700', textAlign: 'center' },
    homeSectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    homeViewAll: { fontSize: 12, fontWeight: '700', color: C.blue, marginTop: 15 },
    homeRecent: {
      height: 48,
      borderRadius: 24,
      backgroundColor: C.paper,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    homeRecentTitle: { fontSize: 12, fontWeight: '700', color: C.ink },
    homeRecentMeta: { fontSize: 10, color: C.muted },
    safe: { flex: 1, backgroundColor: C.pale },
    scroll: { paddingBottom: 88 },
    page: { paddingHorizontal: 20, paddingTop: 14 },
    pageFill: { flex: 1 },
    nav: {
      height: 35,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    back: { minWidth: 70 },
    backText: { fontSize: 15, color: C.ink, fontWeight: '600' },
    bell: { fontSize: 20, color: C.blue },
    logo: { fontSize: 29, fontWeight: '800', color: C.blue, letterSpacing: -1, marginBottom: 28 },
    eyebrow: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.1,
      color: C.mint,
      marginBottom: 6,
    },
    title: {
      fontSize: 29,
      lineHeight: 34,
      fontWeight: '800',
      color: C.ink,
      letterSpacing: -0.7,
      marginBottom: 8,
    },
    titleSmall: { fontSize: 21, fontWeight: '800', color: C.ink, marginTop: 10 },
    sub: { fontSize: 14, lineHeight: 21, color: C.muted, marginBottom: 20 },
    button: {
      backgroundColor: C.blue,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    buttonText: { color: C.white, fontSize: 14, fontWeight: '800' },
    secondary: { backgroundColor: C.mint },
    outline: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.blue },
    outlineText: { color: C.blue },
    danger: { backgroundColor: C.soft('#FFF1F2') },
    dangerText: { color: C.red },
    smallButton: { minHeight: 38, borderRadius: 10 },
    centerLink: {
      textAlign: 'center',
      color: C.blue,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 18,
    },
    splash: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.pale,
      padding: 30,
    },
    splashMark: {
      height: 220,
      width: 220,
      borderRadius: 36,
      backgroundColor: C.soft('#BDEFE6'),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    splashTitle: { fontSize: 31, fontWeight: '800', color: C.ink, marginBottom: 10 },
    splashSub: {
      fontSize: 15,
      color: C.muted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 34,
    },
    onboard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue,
      padding: 26,
    },
    wave: {
      height: 240,
      width: '100%',
      borderRadius: 26,
      backgroundColor: C.soft('#BDEFE6'),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    onboardTitle: { fontSize: 27, fontWeight: '800', color: C.white, marginBottom: 9 },
    onboardSub: {
      fontSize: 14,
      color: C.white,
      textAlign: 'center',
      opacity: 0.85,
      marginBottom: 20,
    },
    dots: { flexDirection: 'row', marginBottom: 30 },
    dotActive: { color: C.mint, fontSize: 18, marginRight: 8 },
    dot: { color: C.white, fontSize: 18, opacity: 0.7 },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 13, fontWeight: '700', color: C.ink, marginBottom: 7 },
    input: {
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 11,
      backgroundColor: C.paper,
      paddingHorizontal: 13,
      height: 48,
      fontSize: 14,
      color: C.ink,
    },
    multiline: { height: 94, textAlignVertical: 'top', paddingTop: 13 },
    card: {
      backgroundColor: C.paper,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: C.line,
      padding: 15,
      marginBottom: 12,
    },
    cardTitle: { fontSize: 14, fontWeight: '800', color: C.ink },
    cardText: { fontSize: 12, color: C.muted, lineHeight: 18 },
    row: { flexDirection: 'row', alignItems: 'center' },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    category: {
      width: '48.5%',
      backgroundColor: C.paper,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: C.line,
      padding: 14,
      marginBottom: 11,
    },
    categoryOn: { borderWidth: 2, borderColor: C.mint, backgroundColor: C.mintSoft },
    categoryIcon: { fontSize: 24, marginBottom: 13 },
    categoryText: { fontSize: 13, fontWeight: '800', color: C.ink },
    info: { padding: 13, borderRadius: 12, backgroundColor: C.soft('#FFF6DD'), marginBottom: 16 },
    infoText: { color: '#80611C', fontSize: 12, lineHeight: 18 },
    progress: { height: 5, flexDirection: 'row', gap: 5, marginBottom: 23 },
    progressPart: { flex: 1, borderRadius: 5, backgroundColor: C.line },
    progressOn: { backgroundColor: C.blue },
    avatar: {
      height: 44,
      width: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.soft('#D9FBF0'),
      marginRight: 11,
    },
    avatarBig: { height: 76, width: 76, borderRadius: 38, marginRight: 0 },
    avatarText: { fontSize: 14, color: C.blue, fontWeight: '800' },
    avatarTextBig: { fontSize: 24 },
    verified: { color: C.mint },
    money: { fontSize: 16, fontWeight: '800', color: C.blue },
    feeSmall: { fontSize: 10, fontWeight: '400', color: C.muted },
    profileHead: { alignItems: 'center', marginBottom: 21 },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: C.paper,
      borderWidth: 1,
      borderColor: C.line,
      marginBottom: 9,
    },
    badgeGreen: { backgroundColor: C.mintSoft, borderColor: C.soft('#DDFBF1') },
    badgeActive: { backgroundColor: C.soft('#E5F2FF'), borderColor: C.soft('#E5F2FF') },
    badgePending: { backgroundColor: C.soft('#FFF4D6'), borderColor: C.soft('#FFF4D6') },
    badgeText: { fontSize: 10, fontWeight: '800', color: C.muted },
    badgeActiveText: { color: '#2F77B0' },
    badgePendingText: { color: '#9A701B' },
    map: {
      height: 215,
      borderRadius: 17,
      backgroundColor: C.soft('#CCE7DA'),
      overflow: 'hidden',
      marginVertical: 15,
      position: 'relative',
      borderWidth: 1,
      borderColor: '#B2D2C1',
    },
    roadOne: {
      position: 'absolute',
      height: 16,
      width: '150%',
      backgroundColor: C.glass(0.65),
      transform: [{ rotate: '-25deg' }],
      top: '43%',
      left: '-30%',
    },
    roadTwo: {
      position: 'absolute',
      height: 16,
      width: '150%',
      backgroundColor: C.glass(0.65),
      transform: [{ rotate: '37deg' }],
      top: '62%',
      left: '-26%',
    },
    pin: { position: 'absolute', fontSize: 25, zIndex: 2 },
    route: {
      position: 'absolute',
      left: '27%',
      top: '53%',
      width: '49%',
      borderTopWidth: 3,
      borderColor: C.blue,
      borderStyle: 'dashed',
      transform: [{ rotate: '-18deg' }],
    },
    mapLabel: {
      position: 'absolute',
      bottom: 8,
      left: 11,
      fontSize: 10,
      color: C.muted,
      fontWeight: '700',
    },
    timeline: {
      marginBottom: 15,
      borderLeftWidth: 2,
      borderColor: C.soft('#C8E8DD'),
      paddingLeft: 16,
      marginLeft: 8,
    },
    timelineRow: { flexDirection: 'row', marginBottom: 16, position: 'relative' },
    timelineDot: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: C.line,
      position: 'absolute',
      left: -22,
      top: 4,
    },
    timelineDotOn: { backgroundColor: C.mint },
    rowText: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderColor: C.soft('#EEF1F8'),
      gap: 16,
    },
    strong: { fontWeight: '800', color: C.ink },
    stars: { fontSize: 33, color: C.gold, letterSpacing: 3, marginTop: 6 },
    hero: {
      backgroundColor: C.blue,
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
      overflow: 'hidden',
    },
    heroKicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      color: C.mint,
      marginBottom: 8,
    },
    heroTitle: {
      color: C.white,
      fontSize: 24,
      lineHeight: 29,
      fontWeight: '800',
      maxWidth: '82%',
      marginBottom: 7,
    },
    heroCopy: { color: '#DDE7FF', fontSize: 13, lineHeight: 19, maxWidth: '86%', marginBottom: 16 },
    heroButton: {
      backgroundColor: C.paper,
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
    },
    heroButtonText: { fontSize: 12, fontWeight: '800', color: C.blue },
    section: { fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 6, marginBottom: 12 },
    blueLink: { color: C.blue, fontWeight: '800', fontSize: 12, marginLeft: 'auto' },
    wallet: { backgroundColor: C.blue, borderRadius: 18, padding: 20, marginBottom: 18 },
    walletSmall: { color: '#DDE7FF', fontSize: 11 },
    walletValue: { fontSize: 30, fontWeight: '800', color: C.white, marginVertical: 7 },
    filters: { flexDirection: 'row', gap: 7, marginBottom: 9 },
    success: { alignItems: 'center', marginTop: 55, marginBottom: 24 },
    successIcon: { fontSize: 51, marginBottom: 10 },
    successTitle: {
      fontSize: 27,
      lineHeight: 32,
      fontWeight: '800',
      color: C.ink,
      textAlign: 'center',
      marginVertical: 7,
    },
    tabs: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 75,
      backgroundColor: '#2563EB',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tab: { alignItems: 'center', minWidth: 58 },
    tabIconWrap: {
      height: 28,
      width: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabIconActive: { backgroundColor: C.canvas },
    tabText: { fontSize: 10, color: C.white, marginTop: 3 },
    tabTextActive: { color: C.mint, fontWeight: '800' },
    chatHead: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderColor: C.line,
      paddingBottom: 12,
    },
    call: { fontSize: 22, color: C.blue, marginLeft: 'auto' },
    chat: { flex: 1, marginVertical: 12 },
    bubble: {
      alignSelf: 'flex-start',
      maxWidth: '77%',
      backgroundColor: C.paper,
      padding: 12,
      borderRadius: 13,
      borderBottomLeftRadius: 3,
      marginBottom: 9,
    },
    bubbleMe: {
      alignSelf: 'flex-end',
      backgroundColor: C.mintSoft,
      borderBottomLeftRadius: 13,
      borderBottomRightRadius: 3,
    },
    bubbleText: { fontSize: 13, color: C.ink, lineHeight: 18 },
    time: { fontSize: 9, color: C.muted, marginTop: 4 },
    composer: { flexDirection: 'row', paddingVertical: 11, gap: 8 },
    composerInput: {
      flex: 1,
      height: 45,
      borderWidth: 1,
      borderColor: C.line,
      borderRadius: 13,
      paddingHorizontal: 12,
      backgroundColor: C.paper,
    },
    send: {
      width: 45,
      height: 45,
      borderRadius: 13,
      backgroundColor: C.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    choice: {
      backgroundColor: C.paper,
      borderColor: C.line,
      borderWidth: 1,
      borderRadius: 14,
      padding: 15,
      marginBottom: 11,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    choiceOn: { borderWidth: 2, borderColor: C.mint, backgroundColor: C.mintSoft },
    toast: {
      position: 'absolute',
      bottom: 88,
      alignSelf: 'center',
      backgroundColor: C.ink,
      paddingHorizontal: 16,
      paddingVertical: 11,
      borderRadius: 10,
    },
    toastText: { color: C.white, fontSize: 12, fontWeight: '700' },
  });
let styleSheet = buildStyles();

/** Rebuild the shared styles after the palette in theme.js has changed. */
function rebuildStyles() {
  styleSheet = buildStyles();
}

function HomeActionImage({ source, label, Icon, onPress }) {
  const isProfile = label === 'PROFILE';
  const profileImage = homeProfileImage || profileAssets.profileImage;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.homeRoundButton,
        {
          top: 22,
          height: 58,
          width: 58,
          borderRadius: 29,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      {source && (
        <Image
          source={source}
          resizeMode="contain"
          style={{ position: 'absolute', height: 66, width: 66 }}
        />
      )}
      {isProfile && profileImage ? (
        <Image
          source={profileImage}
          resizeMode="cover"
          style={{ height: 36, width: 36, borderRadius: 18 }}
        />
      ) : isProfile ? (
        <UserRound size={22} color={C.white} fill={C.white} strokeWidth={2.5} />
      ) : (
        <Icon size={20} color={C.white} fill={C.white} strokeWidth={2.5} />
      )}
    </TouchableOpacity>
  );
}
function PalGoBottomTabs({ role, screen, go }) {
  const tabs =
    role === 'pal'
      ? [
          ['home', House, 'Home'],
          ['errands', ClipboardList, 'Errands'],
          ['wallet', CreditCard, 'Wallet'],
          ['profile', UserRound, 'Profile'],
        ]
      : [
          ['home', House, 'Home'],
          ['errands', ClipboardList, 'Errands'],
          ['profile', UserRound, 'Profile'],
        ];
  return (
    <View style={[s.tabs, { backgroundColor: '#2563EB' }]}>
      {tabs.map(([id, Icon, label]) => {
        const active = screen === id,
          iconColor = active ? C.mint : C.white;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => go(id)}
            style={{ alignItems: 'center', justifyContent: 'center' }}
          >
            <View
              style={
                active
                  ? {
                      height: 38,
                      borderRadius: 21,
                      backgroundColor: C.canvas,
                      paddingHorizontal: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }
                  : { height: 38, justifyContent: 'center', alignItems: 'center' }
              }
            >
              <Icon size={19} color={iconColor} variant={active ? 'filled' : 'outline'} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: iconColor }}>{label}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DetailRow({ Icon, label, value, accent, size = 20 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 13 }}>
      <Icon size={size} color={accent || C.blue} strokeWidth={2.2} />
      <View style={{ marginLeft: 13, flex: 1 }}>
        <Text style={{ fontSize: 14, color: C.ink }}>
          {label}
          {value ? `: ${value}` : ''}
        </Text>
      </View>
    </View>
  );
}

function ImagePlaceholder({ size = 58, label = 'IMAGE', profile = false, image }) {
  return (
    <View
      style={{
        height: size,
        width: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: C.blue,
        backgroundColor: C.paper,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {image ? (
        <Image source={image} resizeMode="cover" style={{ height: '100%', width: '100%' }} />
      ) : profile ? (
        <UserRound size={Math.round(size * 0.42)} color={C.blue} strokeWidth={2} />
      ) : (
        <Text style={{ fontSize: 8, fontWeight: '800', color: C.blue, textAlign: 'center' }}>
          {label}
        </Text>
      )}
    </View>
  );
}
function PersonErrandCard({
  person = {},
  offer,
  distance,
  services,
  rating = '4.5',
  jobs = 0,
  phoneVerified = true,
  idVerified = true,
  status,
  primaryTitle = 'Accept',
  onPrimary,
  secondaryTitle = 'View Profile',
  onSecondary,
}) {
  const verification = (label, verified, color) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 10 }}>
      {verified ? <CheckCircle2 size={14} color={color} /> : <X size={14} color={C.red} />}
      <Text style={{ fontSize: 10, color: verified ? C.muted : C.red }}>
        {label} {verified ? 'verified' : 'not verified'}
      </Text>
    </View>
  );
  return (
    <View
      style={{
        backgroundColor: C.paper,
        borderRadius: 18,
        padding: 15,
        marginBottom: 13,
        shadowColor: '#8592B1',
        shadowOpacity: 0.12,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ImagePlaceholder size={58} profile image={person.image} />
        <View style={{ flex: 1, marginLeft: 11 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: C.ink }}>
            {person.name || 'PalGo member'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
            <Text style={{ fontSize: 12, color: '#FFD400' }}>★★★★★</Text>
            <Text style={{ fontSize: 11, color: C.muted, marginLeft: 5 }}>{rating}</Text>
            {jobs > 0 && <Text style={{ fontSize: 10, color: C.muted }}> · {jobs} errands</Text>}
          </View>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '800', color: C.blue, marginLeft: 7 }}>
          {money(offer)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 13 }}>
        {verification('Phone', phoneVerified, C.mint)}
        {verification('ID', idVerified, C.blue)}
      </View>
      <Text numberOfLines={2} style={{ fontSize: 11, color: C.muted, marginTop: 11 }}>
        {services || 'Errand support'} · {distance || 'Distance unavailable'}
      </Text>
      {!!status && (
        <Text style={{ fontSize: 11, fontWeight: '800', color: C.mint, marginTop: 8 }}>
          {status}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
        <TouchableOpacity
          onPress={onPrimary}
          style={{
            height: 40,
            flex: 1,
            borderRadius: 20,
            backgroundColor: C.mint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.white }}>{primaryTitle}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSecondary}
          style={{
            height: 40,
            flex: 1,
            borderRadius: 20,
            backgroundColor: C.blue,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.white }}>{secondaryTitle}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CompletionConfirm({ onBack, onContinue }) {
  return (
    <Shell back={onBack}>
      <View
        style={{
          marginTop: 120,
          backgroundColor: C.paper,
          borderRadius: 24,
          padding: 24,
          shadowColor: '#38466A',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
          Confirm completion?
        </Text>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 21,
            color: C.muted,
            textAlign: 'center',
            marginTop: 13,
          }}
        >
          Confirm only after your Pal has marked the saved errand complete.
        </Text>
        <View style={{ height: 24 }} />
        <Button title="Confirm completed errand" onPress={onContinue} />
        <TouchableOpacity onPress={onBack}>
          <Text
            style={{
              textAlign: 'center',
              color: C.blue,
              fontSize: 13,
              fontWeight: '800',
              marginTop: 18,
            }}
          >
            Not yet
          </Text>
        </TouchableOpacity>
      </View>
    </Shell>
  );
}

const a = StyleSheet.create({
  splash: { flex: 1, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { marginTop: 92 },
  authCanvas: { flex: 1, overflow: 'hidden', backgroundColor: C.canvas },
  backgroundPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B99BD',
    letterSpacing: 0.4,
  },
  waveBand: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 1,
    zIndex: 2,
  },
  waveBandFlip: { position: 'absolute', bottom: 0, left: 0, right: 0, transform: [{ scaleY: -1 }] },
  waveBar: { width: 8, borderRadius: 9, backgroundColor: C.blue },
  logoPlaceholder: { height: 48, width: 140, alignItems: 'center', justifyContent: 'center' },
  logoImage: { height: '100%', width: '100%' },
  logoPlaceholderText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: C.blue },
  onboardContent: { alignItems: 'center', paddingTop: 62, paddingHorizontal: 30, zIndex: 3 },
  onboardMiddle: { alignItems: 'center' },
  imagePlaceholder: {
    height: 267,
    width: 267,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 42,
    marginBottom: 43,
  },
  onboardImage: { height: '100%', width: '100%' },
  placeholderLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, color: C.blue },
  placeholderNote: { fontSize: 10, color: C.muted, marginTop: 6 },
  onboardTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    color: '#101522',
    textAlign: 'center',
  },
  onboardFooter: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 46,
    zIndex: 4,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 8, marginTop: 14, alignSelf: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,.55)',
    borderWidth: 1,
    borderColor: 'rgba(46,99,233,.22)',
  },
  dotOn: { backgroundColor: C.mint, borderColor: C.mint },
  onboardBack: { paddingVertical: 10, alignSelf: 'center' },
  onboardBackText: { fontSize: 14, fontWeight: '700', color: C.blue },
  pillPrimary: {
    height: 44,
    width: 258,
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#1C52D2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1746BC',
    shadowOpacity: 0.65,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
    elevation: 4,
  },
  pillOnboardChoice: { width: 149, height: 40 },
  pillPrimaryText: { fontSize: 14, fontWeight: '700', color: C.white },
  skipButton: { position: 'absolute', bottom: 90, alignSelf: 'center', zIndex: 4, padding: 8 },
  skip: { color: C.blue, fontSize: 12, fontWeight: '700' },
  entryContent: { alignItems: 'center', paddingTop: 48, zIndex: 3 },
  entryTitle: { fontSize: 16, fontWeight: '700', color: '#101522', textAlign: 'center' },
  entryButtons: { zIndex: 4, flexDirection: 'row', gap: 15, width: 313, alignSelf: 'center' },
  pillGhost: {
    height: 44,
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#1C52D2',
    backgroundColor: 'rgba(67,124,241,.38)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1746BC',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 0,
    elevation: 3,
  },
  pillGhostText: { color: C.white, fontSize: 14, fontWeight: '700' },
  dimLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,19,58,.67)', zIndex: 5 },
  roleSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
    backgroundColor: C.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 46,
    paddingTop: 31,
    paddingBottom: 22,
  },
  close: { position: 'absolute', right: 16, top: 13 },
  authScreen: { zIndex: 3, paddingHorizontal: 30, paddingTop: 150, alignItems: 'center' },
  authLogo: { position: 'absolute', top: 62, alignSelf: 'center' },
  authBack: {
    position: 'absolute',
    top: 25,
    left: 16,
    zIndex: 3,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authHead: { alignItems: 'center', marginTop: 0, marginBottom: 24 },
  authTitle: { fontSize: 22, fontWeight: '800', color: '#101522', marginBottom: 8 },
  authCopy: { fontSize: 12, lineHeight: 17, color: '#34415C', textAlign: 'center', maxWidth: 276 },
  authField: {
    height: 47,
    width: 367,
    maxWidth: '100%',
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: C.paper,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 14,
    shadowColor: '#98AECB',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  authInput: { flex: 1, fontSize: 14, color: C.ink, paddingHorizontal: 10, paddingVertical: 0 },
  terms: {
    width: 367,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 21,
  },
  remember: {
    width: 367,
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 21,
  },
  checkBox: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#4D9F9A',
    marginRight: 7,
    marginTop: 1,
    backgroundColor: 'rgba(255,255,255,.65)',
  },
  termsText: { fontSize: 10, color: '#35445D', flex: 1, lineHeight: 14 },
  forgot: { fontSize: 10, color: C.blue, fontWeight: '700', marginLeft: 'auto' },
  authLink: { fontSize: 12, color: '#35445D', textAlign: 'center', marginTop: 18 },
  linkText: { color: C.blue, fontWeight: '700' },
});

const s = new Proxy(
  {},
  {
    get: (_target, key) => styleSheet[key],
    set: (_target, key, value) => {
      styleSheet = { ...styleSheet, [key]: value };
      return true;
    },
    ownKeys: () => Reflect.ownKeys(styleSheet),
    getOwnPropertyDescriptor: (_target, key) =>
      key in styleSheet
        ? { enumerable: true, configurable: true, value: styleSheet[key] }
        : undefined,
  },
);

export {
  C,
  rebuildStyles,
  s,
  a,
  Logo,
  AssetBackground,
  Button,
  Header,
  money,
  Shell,
  PalCompleteWaiting,
  Notifications,
  Success,
  Input,
  Card,
  Avatar,
  HomeMap,
  Choice,
  RowText,
  HomeActionImage,
  PalGoBottomTabs,
  DetailRow,
  ImagePlaceholder,
  PersonErrandCard,
  CompletionConfirm,
};
