import { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../../components/ThemedText';
import {
  Banknote,
  Bell,
  CancelCircleIcon,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPinned,
  PhoneChatIcon,
  SafetyIcon,
  ShareIcon,
  SirenIcon,
  Star,
  UserRound,
} from '../../components/glyphs';
import * as Shared from '../../AppComponents';
import { RaisedField } from '../../components/Input3D';
import { colors as C } from '../../theme';
import { homeActionImages } from '../../assets';
import { describeEta, distanceKm, STALE_MS } from '../../lib/eta';
import { useLatestPosition } from '../../lib/liveLocation';
import { useGeocoded, usePalLocation } from '../../state/useLiveLocation';
import { useUnreadMessages } from '../../state/useUnreadMessages';

const {
  s,
  Button,
  DetailRow,
  HomeActionImage,
  HomeMap,
  ImagePlaceholder,
  NotificationBadge,
  money,
} = Shared;

const PEER_GREEN = '#16A34A';
const GREEN_DOT = '#7FA882';
const GREEN_DOT_INNER = '#BCD6BE';
const RED = '#E11D2E';

const callEmergency = () =>
  Alert.alert('Call emergency services?', 'This opens your phone dialer with 112.', [
    { text: 'Not now', style: 'cancel' },
    { text: 'Call 112', style: 'destructive', onPress: () => Linking.openURL('tel:112') },
  ]);

const shareDetails = (person, errand) =>
  Share.share({
    message: `I'm doing an errand on PalGo with ${person?.name || 'a PalGo member'}: "${errand.title || 'Errand'}" at ${errand.location || 'a location I will confirm'}.`,
  }).catch(() => {});

/** The time the User asked for, e.g. "12pm" or a scheduled date. */
function requestedTime(e = {}) {
  if (e.requested_time && String(e.requested_time).trim()) return String(e.requested_time).trim();
  if (e.scheduled_for) return new Date(e.scheduled_for).toLocaleString();
  return '';
}

function RatingPill({ person = {} }) {
  const count = person.reviewCount || 0;
  return (
    <RaisedField
      height={24}
      style={{
        width: 'auto',
        alignSelf: 'center',
        marginBottom: 0,
        marginTop: 7,
        paddingHorizontal: 12,
      }}
    >
      <Star
        size={12}
        color="#F2C400"
        variant={count ? 'filled' : 'outline'}
        fill={count ? '#F2C400' : 'transparent'}
      />
      <Text style={{ fontSize: 11, color: C.muted, marginLeft: 5 }}>
        {Number(count ? person.rating || 0 : 0).toFixed(1)}
      </Text>
    </RaisedField>
  );
}

function Photo({ person = {}, size = 60 }) {
  return <ImagePlaceholder size={size} profile image={person.image} />;
}

/** Round blue button with a label under it (Contact / Safety). */
function CircleAction({ label, onPress, badge = 0, children }) {
  return (
    <View style={{ alignItems: 'center', width: 92 }}>
      <View style={{ height: 60, width: 60 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={{
            height: 60,
            width: 60,
            borderRadius: 30,
            backgroundColor: C.blue,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#1646B4',
            shadowOpacity: 0.45,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 0,
            elevation: 3,
          }}
        >
          {children}
        </TouchableOpacity>
        <NotificationBadge count={badge} style={{ top: -2, right: -4 }} />
      </View>
      <Text style={{ fontSize: 12, color: C.ink, marginTop: 8 }}>{label}</Text>
    </View>
  );
}

function StatusLine({ text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          height: 20,
          width: 20,
          borderRadius: 10,
          backgroundColor: GREEN_DOT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: GREEN_DOT_INNER }}
        />
      </View>
      <Text style={{ fontSize: 14, color: C.ink, marginLeft: 12, flex: 1 }}>{text}</Text>
    </View>
  );
}

function ActionRow({ Icon, label, color, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}
    >
      <View style={{ width: 38, alignItems: 'center' }}>
        <Icon size={24} color={color || C.blue} />
      </View>
      <Text style={{ fontSize: 14, color: color || C.ink, marginLeft: 13, flex: 1 }}>{label}</Text>
      <ChevronRight size={15} color={C.blue} />
    </TouchableOpacity>
  );
}

function Divider({ margin = 14 }) {
  return <View style={{ height: 1, backgroundColor: C.line, marginVertical: margin }} />;
}

function ServiceDetails({ errand }) {
  const time = requestedTime(errand);
  return (
    <>
      <Text style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>Your current service</Text>
      <DetailRow Icon={CheckCircle2} label={errand.title || '—'} accent="#89A9ED" />
      <DetailRow Icon={MapPinned} label={errand.location || '—'} />
      <DetailRow Icon={Banknote} label={money(errand.fee)} />
      {!!time && <DetailRow Icon={Clock3} label={`Requested time: ${time}`} />}
      {!!errand.estimated_time && (
        <DetailRow Icon={Clock3} label={`Estimated duration: ${errand.estimated_time}`} />
      )}
      {!!errand.special_notes && (
        <DetailRow Icon={ClipboardList} label={`Special notes: “${errand.special_notes}”`} />
      )}
      <Text style={{ fontSize: 14, color: C.muted, marginTop: 6, marginBottom: 12 }}>Payment</Text>
      <DetailRow Icon={Banknote} label="Transfer" accent={C.mint} />
    </>
  );
}

/** The map with the profile and alert buttons, and the sheet that slides over it. */
function ActiveScreen({ onProfile, markers, showUser, children }) {
  const { height } = useWindowDimensions();
  return (
    <View style={s.homeScreen}>
      <HomeMap markers={markers} showUser={showUser} />
      <View style={[s.homeTop, { top: 42 }]}>
        <HomeActionImage
          source={homeActionImages.profile}
          label="PROFILE"
          Icon={UserRound}
          onPress={onProfile}
        />
        <HomeActionImage
          source={homeActionImages.notifications}
          label="ALERT"
          Icon={Bell}
          onPress={() => Alert.alert('Notifications', 'No new notifications.')}
        />
      </View>
      <View
        style={[
          s.homePanel,
          {
            bottom: 75,
            maxHeight: height * 0.7,
            paddingHorizontal: 0,
            shadowColor: '#38466A',
            shadowOpacity: 0.23,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -5 },
            elevation: 12,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Handle({ onPress }) {
  return (
    <TouchableOpacity style={s.panelHandle} onPress={onPress}>
      <View style={[s.handle, { backgroundColor: C.mint }]} />
    </TouchableOpacity>
  );
}

/** Active errand as the User sees it. */
function TrackingHomeActive({ errand = {}, pal = {}, onProfile, onChat, onConfirm, onCancel }) {
  const [expanded, setExpanded] = useState(true);
  const person = errand.pal || pal || {};
  const status = errand.status;
  const running = status === 'ACCEPTED' || status === 'ACTIVE';
  const unread = useUnreadMessages(errand.id, 'user', running || status === 'PAL_COMPLETED');
  const palPosition = usePalLocation(errand.id, running);
  const destination = useGeocoded(running ? errand.location : '');
  // Keep showing the last known position and estimate: a Pal in a hold-up has not moved.
  const live = palPosition;
  const staleMinutes =
    live && Date.now() - new Date(live.updated_at).getTime() > STALE_MS
      ? Math.round((Date.now() - new Date(live.updated_at).getTime()) / 60000)
      : 0;
  const eta = describeEta(distanceKm(live, destination));
  const headline = eta
    ? eta.arrived
      ? 'Your Pal is nearby'
      : `Pal is about ${eta.minutes} min away from you`
    : {
        ACCEPTED: 'Your Pal has accepted your errand',
        ACTIVE: 'Your errand is in progress',
        PAL_COMPLETED: 'Your Pal marked this errand complete',
      }[status] || 'Active errand';
  const line = eta
    ? eta.arrived
      ? 'Your Pal has arrived at the errand location'
      : `Your Pal is on the way. Estimated arrival: about ${eta.minutes} min`
    : {
        ACCEPTED: running
          ? 'Accepted. Waiting for your Pal’s live location. You can chat to agree when to start.'
          : 'Accepted.',
        ACTIVE: 'In progress',
        PAL_COMPLETED: 'Waiting for your confirmation',
      }[status] || 'Active';
  // You are blue, the other person is green.
  const markers = [
    live && { id: 'pal', ...live, title: 'Your Pal', color: PEER_GREEN },
    destination && { id: 'dest', ...destination, title: 'You (errand location)', color: C.blue },
  ].filter(Boolean);
  const safety = () =>
    Alert.alert(
      'Safety',
      'Share your Pal’s details with someone you trust, or call emergency services if you feel unsafe.',
      [
        { text: 'Share Pal’s details', onPress: () => shareDetails(person, errand) },
        { text: 'Call emergency', style: 'destructive', onPress: callEmergency },
        { text: 'Close', style: 'cancel' },
      ],
    );
  return (
    <ActiveScreen onProfile={onProfile} markers={markers.length ? markers : undefined}>
      <Handle onPress={() => setExpanded((v) => !v)} />
      <ScrollView
        style={{ flexGrow: 0 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20 }}
      >
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{headline}</Text>
        <Text style={{ fontSize: 13, color: C.blue, marginTop: 7 }}>
          {person.name || 'Your Pal'}
        </Text>
        <Divider margin={16} />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <CircleAction label="Contact Pal" onPress={onChat} badge={unread}>
            <PhoneChatIcon size={36} color={C.white} />
          </CircleAction>
          <View style={{ alignItems: 'center' }}>
            <Photo person={person} size={60} />
            <RatingPill person={person} />
          </View>
          <CircleAction label="Safety" onPress={safety}>
            <SafetyIcon size={36} color={C.white} cutout={C.blue} />
          </CircleAction>
        </View>
        {expanded && (
          <>
            <View style={{ marginTop: 22 }}>
              <StatusLine text={line} />
              {staleMinutes > 0 && (
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 6, marginLeft: 32 }}>
                  Last location update {staleMinutes} min ago. Your Pal may be in traffic or have a
                  weak network.
                </Text>
              )}
            </View>
            <View style={{ marginTop: 20 }}>
              <ServiceDetails errand={errand} />
            </View>
            {status === 'PAL_COMPLETED' && (
              <View style={{ marginVertical: 8 }}>
                <Button title="Confirm completion" onPress={onConfirm} />
              </View>
            )}
            <View style={{ marginTop: 10 }}>
              <ActionRow
                Icon={ShareIcon}
                label="Share Pal’s details"
                onPress={() => shareDetails(person, errand)}
              />
              <ActionRow
                Icon={SirenIcon}
                label="Call emergency"
                color={RED}
                onPress={callEmergency}
              />
              <ActionRow
                Icon={CancelCircleIcon}
                label="Cancel errand"
                color={RED}
                onPress={onCancel}
              />
            </View>
          </>
        )}
      </ScrollView>
    </ActiveScreen>
  );
}

/** Active errand as the Pal sees it. */
function PalTrackingHomeLatest({ errand, onProfile, onChat, onStart, onComplete, onCancel }) {
  const [expanded, setExpanded] = useState(true);
  const item = errand || {};
  const person = item.person || {};
  const status = item.status;
  const first = String(person.name || 'the User').split(' ')[0];
  const running = status === 'ACCEPTED' || status === 'ACTIVE';
  const unread = useUnreadMessages(item.id, 'pal', running || status === 'PAL_COMPLETED');
  const own = useLatestPosition();
  const destination = useGeocoded(running ? item.location : '');
  const eta = describeEta(distanceKm(own, destination));
  const line = eta
    ? eta.arrived
      ? 'You are at the errand location'
      : `On the way. Estimated arrival: about ${eta.minutes} min`
    : {
        ACCEPTED: 'Accepted',
        ACTIVE: 'In progress',
        PAL_COMPLETED: 'Waiting for the User to confirm',
      }[status] || 'Active';
  const headline = eta
    ? eta.arrived
      ? `You are near ${first}`
      : `You are about ${eta.minutes} min from ${first}`
    : {
        ACCEPTED: `Start when you and ${first} are ready`,
        ACTIVE: 'Errand in progress',
        PAL_COMPLETED: 'Waiting for User confirmation',
      }[status] || 'Active errand';
  // You are the blue dot (the phone's own location); the User's address is the green pin.
  const markers = destination
    ? [{ id: 'dest', ...destination, title: 'Errand location', color: PEER_GREEN }]
    : undefined;
  return (
    <ActiveScreen onProfile={onProfile} markers={markers} showUser={running}>
      <Handle onPress={() => setExpanded((v) => !v)} />
      <ScrollView
        style={{ flexGrow: 0 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 20 }}
      >
        <StatusLine text={line} />
        <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink, marginTop: 14 }}>
          {headline}
        </Text>
        {running && (
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
            Your live location is shared with {first} while this errand runs.
          </Text>
        )}
        <Divider margin={16} />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Photo person={person} size={60} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.ink }}>
              {person.name || 'User'}
            </Text>
            <View style={{ alignSelf: 'flex-start' }}>
              <RatingPill person={person} />
            </View>
          </View>
          <View style={{ height: 60, width: 60 }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Contact the User"
              onPress={onChat}
              style={{
                height: 60,
                width: 60,
                borderRadius: 30,
                backgroundColor: C.mint,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#087A59',
                shadowOpacity: 0.45,
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 0,
                elevation: 3,
              }}
            >
              <PhoneChatIcon size={36} color={C.white} />
            </TouchableOpacity>
            <NotificationBadge count={unread} style={{ top: -2, right: -4 }} />
          </View>
        </View>
        {expanded && (
          <>
            <View style={{ marginTop: 20 }}>
              <ServiceDetails errand={item} />
            </View>
            {status === 'PAL_COMPLETED' ? (
              <Text
                style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginVertical: 10 }}
              >
                Waiting for the User to confirm.
              </Text>
            ) : (
              <View style={{ marginVertical: 8 }}>
                <Button
                  title={status === 'ACCEPTED' ? 'Start errand' : 'Mark errand complete'}
                  onPress={status === 'ACCEPTED' ? onStart : onComplete}
                />
              </View>
            )}
            <View style={{ marginTop: 10 }}>
              <ActionRow
                Icon={CancelCircleIcon}
                label="Cancel errand"
                color={RED}
                onPress={onCancel}
              />
            </View>
          </>
        )}
      </ScrollView>
    </ActiveScreen>
  );
}

export { TrackingHomeActive, PalTrackingHomeLatest };
