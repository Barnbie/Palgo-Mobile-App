import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/ThemedText';
import { RaisedField, RaisedTextInput } from '../../components/Input3D';
import * as Shared from '../../AppComponents';
import { colors as C } from '../../theme';

const { Button, Shell } = Shared;

export const AGREED_REASON = 'We agreed to cancel together';
const OTHER = 'Other';

const USER_REASONS = [
  'My Pal is taking too long',
  'My Pal is not responding',
  'My Pal asked me to cancel',
  'I no longer need this errand',
  'I made a mistake in the details',
  AGREED_REASON,
  OTHER,
];
const PAL_REASONS = [
  'The User is not responding',
  'The User asked me to cancel',
  'I cannot get there in time',
  'Something came up',
  'The details are different from the request',
  AGREED_REASON,
  OTHER,
];

/** Pick a reason, add a note if "Other", then cancel. */
export function CancelErrandScreen({ errand = {}, role, onBack, onConfirm }) {
  const reasons = role === 'pal' ? PAL_REASONS : USER_REASONS;
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [busy, setBusy] = useState(false);
  const started = errand.status === 'ACTIVE';
  const ready = reason && (reason !== OTHER || other.trim().length >= 3);
  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onConfirm(reason === OTHER ? OTHER : reason, reason === OTHER ? other.trim() : '');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: C.ink }}>Cancel errand</Text>
      <Text
        style={{ fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 8, marginBottom: 18 }}
      >
        {errand.title || 'This errand'} · Please tell us why. The other person will be told that you
        cancelled.
      </Text>
      {started && (
        <View
          style={{
            backgroundColor: C.paper,
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#F2C400',
          }}
        >
          <Text style={{ fontSize: 12, lineHeight: 18, color: C.ink }}>
            This errand has already started. A cancellation fee may apply once payments are live,
            unless you both agreed to cancel.
          </Text>
        </View>
      )}
      {reasons.map((item) => {
        const on = reason === item;
        return (
          <TouchableOpacity
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => setReason(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: C.line,
            }}
          >
            <View
              style={{
                height: 22,
                width: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: on ? C.mint : C.muted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on && (
                <View style={{ height: 11, width: 11, borderRadius: 6, backgroundColor: C.mint }} />
              )}
            </View>
            <Text style={{ fontSize: 14, color: C.ink, marginLeft: 14, flex: 1 }}>{item}</Text>
          </TouchableOpacity>
        );
      })}
      {reason === OTHER && (
        <RaisedField multiline style={{ marginTop: 16 }}>
          <RaisedTextInput
            multiline
            value={other}
            onChangeText={setOther}
            placeholder="Write your reason"
            maxLength={300}
          />
        </RaisedField>
      )}
      <View style={{ marginTop: 24, opacity: ready ? 1 : 0.5 }}>
        <Button title={busy ? 'Cancelling…' : 'Cancel errand'} onPress={submit} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button kind="outline" title="Keep errand" onPress={onBack} />
      </View>
    </Shell>
  );
}
