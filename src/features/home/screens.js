import { GradientButton } from '../../components/GradientButton';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  PanResponder,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '../../components/ThemedText';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserRound,
  X,
} from '../../components/glyphs';
import * as Shared from '../../AppComponents';
import { CompletionPrompt, ErrandSummaryCard } from '../errands/screens';
import { colors as C } from '../../theme';
import { homeActionImages } from '../../assets';

const {
  s,

  money,

  HomeMap,

  HomeActionImage,
} = Shared;

/** Sheet height: medium (1) when there is something to act on, otherwise the lowest (0). */
function useDefaultSheet(wantsMedium) {
  const [panelState, setPanelState] = useState(wantsMedium ? 1 : 0);
  useEffect(() => {
    setPanelState(wantsMedium ? 1 : 0);
  }, [wantsMedium]);
  return [panelState, setPanelState];
}

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
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function PalHomeErrandCard({ item, available = false, onCounter, onStart, onComplete, onView }) {
  const person = item.person || item.requester || item.user || { name: 'User' };
  if (available)
    return (
      <ErrandSummaryCard
        errand={item}
        state="Pending"
        actionLabel="Counter offer"
        onView={onView}
        onAction={onCounter}
      />
    );
  const start = item.status === 'ACCEPTED';
  return (
    <ErrandSummaryCard
      errand={item}
      person={person}
      state="Active"
      actionLabel={start ? 'Start' : item.status === 'PAL_COMPLETED' ? null : 'Complete'}
      onView={onView}
      onAction={start ? onStart : onComplete}
    />
  );
}

function UserActiveErrandCard({ errand, onComplete, onView }) {
  const pal = errand.pal || { name: 'PalGo member', rating: 0, reviewCount: 0 };
  return (
    <ErrandSummaryCard
      errand={errand}
      person={pal}
      state="Active"
      actionLabel={errand.status === 'PAL_COMPLETED' ? 'Confirm' : null}
      onView={onView}
      onAction={onComplete}
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
        backgroundColor: C.paper,
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
          backgroundColor: C.paper,
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
          <View style={{ backgroundColor: C.paper, borderRadius: 18, padding: 18, elevation: 10 }}>
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
  palAvailable = true,
  onToggleAvailability,
  onErrands,
  onTrack,
  onNotify,
  onWallet,
  onStart,
  onComplete,
  onCounterAvailable,
  onViewAvailable,
  verification,
  verificationDismissed,
  onDismissVerification,
  onResumeVerification,
}) {
  const [panelState, setPanelState] = useDefaultSheet(availableErrands.length > 0);
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
      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityLabel="Availability"
        onPress={onToggleAvailability}
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          top: 52,
          alignSelf: 'center',
          zIndex: 11,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          height: 32,
          paddingHorizontal: 14,
          borderRadius: 16,
          backgroundColor: palAvailable ? C.mint : C.paper,
          borderWidth: palAvailable ? 0 : 1,
          borderColor: C.line,
        }}
      >
        <View
          style={{
            height: 9,
            width: 9,
            borderRadius: 5,
            backgroundColor: palAvailable ? C.white : C.muted,
          }}
        />
        <Text style={{ fontSize: 12, fontWeight: '800', color: palAvailable ? C.white : C.muted }}>
          {palAvailable ? 'Available' : 'Unavailable'}
        </Text>
      </TouchableOpacity>
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
              onCounter={() => onCounterAvailable(item)}
              onView={() => onViewAvailable(item)}
            />
          ))
        ) : (
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
            {palAvailable
              ? 'No available errands right now'
              : 'You are set to unavailable. Tap the badge at the top to start seeing errands again.'}
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
  palAvailable = true,
  onToggleAvailability,
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
  onConfirmCompletion,
}) {
  const recent = errands[0];
  const isActive =
    errand &&
    ['ACCEPTED', 'ACTIVE', 'PAL_COMPLETED', 'PAL_SELECTED', 'PAL_ARRIVED'].includes(errand.status);
  const [panelState, setPanelState] = useDefaultSheet(!!isActive);
  if (role === 'pal')
    return (
      <PalHomeFinal
        errand={errand}
        availableErrands={availableErrands}
        palAvailable={palAvailable}
        onToggleAvailability={onToggleAvailability}
        onErrands={onErrands}
        onTrack={onTrack}
        onNotify={onNotify}
        onWallet={onWallet}
        onStart={onStart}
        onComplete={onComplete}
        onCounterAvailable={onCounterAvailable}
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
      <CompletionPrompt errand={errand} onConfirm={onConfirmCompletion || onComplete} />
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
        <GradientButton
          tone="green"
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
        </GradientButton>
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
                  backgroundColor: C.paper,
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
