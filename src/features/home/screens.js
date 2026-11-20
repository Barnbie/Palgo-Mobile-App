import { useMemo, useState } from 'react';
import {
  Modal,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Bell, ChevronDown, ChevronRight, ShieldCheck, UserRound, X } from 'lucide-react-native';
import * as Shared from '../../AppComponents';
import { colors as C } from '../../theme';
import { homeActionImages } from '../../assets';

const {
  s,

  money,

  HomeMap,

  HomeActionImage,

  PersonErrandCard,
} = Shared;

function HomePanel({
  state,
  setState,
  baseHeight,
  children,
  collapsedBottomPadding = 17,
  contentBottomPadding = 24,
}) {
  const { height } = useWindowDimensions();
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 7,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -30) setState(2);
          else if (gesture.dy > 30) setState((value) => Math.max(0, value - 1));
          else setState((value) => (value + 1) % 3);
        },
      }),
    [setState],
  );
  const panelSize =
    state === 0
      ? { height: baseHeight, bottom: 75, paddingBottom: collapsedBottomPadding }
      : state === 1
        ? { height: Math.round(height * 0.6), bottom: 75 }
        : { top: 0, bottom: 0, paddingTop: 102, zIndex: 5 };
  return (
    <View style={[s.homePanel, { overflow: 'hidden' }, panelSize]}>
      <View {...panResponder.panHandlers} style={s.panelHandle}>
        <View style={s.handle} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: state === 0 ? contentBottomPadding : 24,
        }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={state === 2}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function PalHomeErrandCard({
  item,
  status,
  available = false,
  onAccept,
  onCounter,
  onStart,
  onComplete,
  onView,
}) {
  const person = item.person ||
    item.requester ||
    item.user || {
      name: available ? 'User' : 'Pal',
      userId: available ? item.requesterUserId : item.palUserId,
    };
  const start = item.status === 'ACCEPTED';
  return (
    <PersonErrandCard
      person={person}
      offer={item.fee}
      rating={person.rating || '0.0'}
      jobs={person.reviewCount || 0}
      phoneVerified={person.phoneVerified === true}
      idVerified={person.idVerified === true}
      distance={person.distance || item.distance || item.location}
      services={available ? item.title : item.services || item.title}
      status={status}
      primaryTitle={available ? 'Accept' : start ? 'Start' : 'Complete'}
      onPrimary={available ? onAccept : start ? onStart : onComplete}
      secondaryTitle="View details"
      onSecondary={onView}
    />
  );
}

function UserActiveErrandCard({ errand, onComplete, onView }) {
  const pal = errand.pal || {
    name: 'PalGo member',
    userId: errand.palUserId,
    rating: 0,
    reviewCount: 0,
    phoneVerified: false,
    idVerified: false,
  };
  return (
    <PersonErrandCard
      person={pal}
      offer={errand.fee}
      rating={pal.rating || '0.0'}
      jobs={pal.reviewCount || 0}
      phoneVerified={pal.phoneVerified === true}
      idVerified={pal.idVerified === true}
      distance={pal.distance || errand.location}
      services={pal.skills || errand.title}
      status={errand.status}
      primaryTitle="Complete"
      onPrimary={onComplete}
      secondaryTitle="View details"
      onSecondary={onView}
    />
  );
}

function RecentErrandCard({ errand, onPress }) {
  const created = errand.created_at ? new Date(errand.created_at).toLocaleDateString() : '';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        height: 62,
        backgroundColor: C.white,
        borderRadius: 31,
        paddingHorizontal: 17,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '800', color: C.ink }}>
          {errand.title || 'Errand'}
        </Text>
        <Text style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{created}</Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '800', color: C.blue }}>{money(errand.fee)}</Text>
      <ChevronRight size={17} color={C.blue} style={{ marginLeft: 5 }} />
    </TouchableOpacity>
  );
}

function VerificationStatusNotice({ verification = {}, dismissed, onDismiss, onResume }) {
  const [expanded, setExpanded] = useState(false);
  const status = String(verification.status || 'not_submitted').toLowerCase();
  const approved = ['approved', 'verified'].includes(status);
  const rejected = ['rejected', 'not_verified', 'declined'].includes(status);
  const incomplete = status === 'incomplete' || status === 'not_submitted';
  const title = approved
    ? 'Your Pal profile is verified'
    : rejected
      ? 'Verification needs an update'
      : incomplete
        ? 'Finish your verification'
        : 'Verification is under review';
  const copy = approved
    ? 'Your identity documents were reviewed and approved.'
    : rejected
      ? verification.reason ||
        'Your documents could not be verified. Please contact support for the reason and next steps.'
      : incomplete
        ? 'Complete your Pal profile and submit your documents to continue the review.'
        : 'We’re reviewing your identity documents. We’ll update this notice when the review is complete.';
  const accent = approved ? C.mint : rejected ? C.red : C.blue;
  if (dismissed) return null;
  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setExpanded(true)}
        style={{
          position: 'absolute',
          top: 130,
          left: 18,
          right: 18,
          zIndex: 9,
          minHeight: 54,
          borderRadius: 15,
          backgroundColor: C.white,
          paddingHorizontal: 13,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          borderLeftWidth: 4,
          borderLeftColor: accent,
          elevation: 4,
          shadowColor: '#25324F',
          shadowOpacity: 0.16,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <ShieldCheck size={20} color={accent} />
        <View style={{ marginLeft: 9, flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.ink }}>{title}</Text>
          <Text numberOfLines={1} style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
            {rejected ? copy : 'Tap to see your verification status'}
          </Text>
        </View>
        <ChevronDown size={18} color={C.muted} />
      </TouchableOpacity>
      <Modal
        transparent
        visible={expanded}
        animationType="fade"
        onRequestClose={() => setExpanded(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            paddingTop: 143,
            paddingHorizontal: 20,
            backgroundColor: 'rgba(15,23,42,.28)',
          }}
        >
          <View style={{ backgroundColor: C.white, borderRadius: 18, padding: 18, elevation: 10 }}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Dismiss verification notice"
              onPress={() => {
                setExpanded(false);
                onDismiss?.();
              }}
              hitSlop={10}
              style={{ position: 'absolute', right: 11, top: 11, padding: 5, zIndex: 1 }}
            >
              <X size={20} color={C.muted} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 30 }}>
              <ShieldCheck size={23} color={accent} />
              <Text
                style={{ fontSize: 15, fontWeight: '800', color: C.ink, marginLeft: 10, flex: 1 }}
              >
                {title}
              </Text>
            </View>
            <Text style={{ fontSize: 13, lineHeight: 20, color: C.muted, marginTop: 13 }}>
              {copy}
            </Text>
            {incomplete && (
              <TouchableOpacity
                onPress={() => {
                  setExpanded(false);
                  onResume?.();
                }}
                style={{
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: C.blue,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 17,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: C.white }}>
                  Continue verification
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function PalHomeFinal({
  errand,
  availableErrands = [],
  onErrands,
  onTrack,
  onNotify,
  onWallet,
  onStart,
  onComplete,
  onAccept,
  onViewAvailable,
  verification,
  verificationDismissed,
  onDismissVerification,
  onResumeVerification,
}) {
  const [panelState, setPanelState] = useState(0);
  return (
    <View
      style={s.homeScreen}
      onLayout={(event) =>
        console.info(
          '[Palgo map] home screen size',
          event.nativeEvent.layout.width,
          event.nativeEvent.layout.height,
        )
      }
    >
      <HomeMap />
      <View style={[s.homeTop, { top: 42, zIndex: 10 }]}>
        <HomeActionImage
          source={homeActionImages.profile}
          label="PROFILE"
          Icon={UserRound}
          onPress={onWallet}
        />
        <HomeActionImage
          source={homeActionImages.notifications}
          label="ALERT"
          Icon={Bell}
          onPress={onNotify}
        />
      </View>
      <VerificationStatusNotice
        verification={verification}
        dismissed={verificationDismissed}
        onDismiss={onDismissVerification}
        onResume={onResumeVerification}
      />
      <HomePanel
        state={panelState}
        setState={setPanelState}
        baseHeight={250}
        contentBottomPadding={32}
      >
        <Text style={{ fontSize: 17, fontWeight: '800' }}>Active errand</Text>
        {errand ? (
          <PalHomeErrandCard
            item={errand}
            status={errand.status}
            onStart={onStart}
            onComplete={onComplete}
            onView={onTrack}
          />
        ) : (
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>No active errand</Text>
        )}
        <Text style={{ fontSize: 17, fontWeight: '800', marginTop: 22, marginBottom: 2 }}>
          Available errands
        </Text>
        {availableErrands.length ? (
          availableErrands.map((item) => (
            <PalHomeErrandCard
              key={item.id}
              item={item}
              available
              onAccept={() => onAccept(item)}
              onView={() => onViewAvailable(item)}
            />
          ))
        ) : (
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
            No available errands right now
          </Text>
        )}
      </HomePanel>
    </View>
  );
}

function UserHomeLatest({
  role,
  errand,
  errands = [],
  availableErrands = [],
  wallet,
  verification,
  verificationDismissed,
  onDismissVerification,
  onResumeVerification,
  onCreate,
  onErrands,
  onTrack,
  onNotify,
  onWallet,
  onStart,
  onComplete,
  onAccept,
  onCounterAvailable,
  onViewAvailable,
}) {
  const [panelState, setPanelState] = useState(0);
  const recent = errands[0];
  const isActive =
    errand &&
    ['ACCEPTED', 'ACTIVE', 'PAL_COMPLETED', 'PAL_SELECTED', 'PAL_ARRIVED'].includes(errand.status);
  if (role === 'pal')
    return (
      <PalHomeFinal
        errand={errand}
        availableErrands={availableErrands}
        onErrands={onErrands}
        onTrack={onTrack}
        onNotify={onNotify}
        onWallet={onWallet}
        onStart={onStart}
        onComplete={onComplete}
        onAccept={onAccept}
        onViewAvailable={onViewAvailable}
        verification={verification}
        verificationDismissed={verificationDismissed}
        onDismissVerification={onDismissVerification}
        onResumeVerification={onResumeVerification}
      />
    );
  return (
    <View
      style={s.homeScreen}
      onLayout={(event) =>
        console.info(
          '[Palgo map] home screen size',
          event.nativeEvent.layout.width,
          event.nativeEvent.layout.height,
        )
      }
    >
      <HomeMap />
      <View style={[s.homeTop, { top: 42, zIndex: 10 }]}>
        <HomeActionImage
          source={homeActionImages.profile}
          label="PROFILE"
          Icon={UserRound}
          onPress={onWallet}
        />
        <HomeActionImage
          source={homeActionImages.notifications}
          label="ALERT"
          Icon={Bell}
          onPress={onNotify}
        />
      </View>
      <HomePanel
        state={panelState}
        setState={setPanelState}
        baseHeight={130}
        collapsedBottomPadding={9}
        contentBottomPadding={0}
      >
        <TouchableOpacity
          style={[
            s.homeRequestButton,
            {
              height: 40,
              borderRadius: 20,
              marginTop: 7,
              backgroundColor: C.mint,
              shadowColor: '#087A59',
            },
          ]}
          onPress={() => onCreate()}
        >
          <Text style={s.homeRequestText}>Request an errand</Text>
        </TouchableOpacity>
        {panelState > 0 && (
          <>
            <Text style={s.homeSectionTitle}>Active errand</Text>
            {isActive ? (
              <UserActiveErrandCard errand={errand} onComplete={onComplete} onView={onTrack} />
            ) : (
              <View
                style={{
                  minHeight: 55,
                  borderRadius: 18,
                  backgroundColor: C.white,
                  padding: 14,
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 12, color: C.muted }}>No active errand</Text>
              </View>
            )}
            <View style={s.homeSectionRow}>
              <Text style={s.homeSectionTitle}>Recent errands</Text>
              <TouchableOpacity onPress={onErrands}>
                <Text style={s.homeViewAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recent ? (
              <RecentErrandCard errand={recent} onPress={onErrands} />
            ) : (
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>No recent errands</Text>
            )}
          </>
        )}
      </HomePanel>
    </View>
  );
}

export { PalHomeFinal, UserHomeLatest };
