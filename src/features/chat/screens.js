import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../components/ThemedText';
import { ChevronLeft, Phone, Send } from '../../components/glyphs';
import { RaisedBubble, RaisedField, RaisedTextInput } from '../../components/Input3D';
import { colors as C } from '../../theme';
import {
  fetchMessages,
  getContactPhone,
  markChatRead,
  sendMessage,
  subscribeToMessages,
} from '../../lib/api/chat';

const OPEN_STATUSES = ['ACCEPTED', 'ACTIVE', 'PAL_COMPLETED'];
const POLL_MS = 8000;

const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function Bubble({ message, mine }) {
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      <RaisedBubble style={{ maxWidth: '78%' }}>
        <View style={{ paddingHorizontal: 17, paddingVertical: 13 }}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: C.ink }}>{message.body}</Text>
          <Text style={{ fontSize: 9, color: C.muted, marginTop: 5, textAlign: 'right' }}>
            {new Date(message.created_at).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </RaisedBubble>
    </View>
  );
}

/** One errand's conversation between the User and the Pal. */
export function ChatScreen({ errand = {}, role, onBack }) {
  const person = (role === 'pal' ? errand.person : errand.pal) || {};
  const open = OPEN_STATUSES.includes(errand.status);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  const merge = useCallback((incoming) => {
    setMessages((previous) => {
      const known = new Set(previous.map((m) => m.id));
      const fresh = incoming.filter((m) => !known.has(m.id));
      return fresh.length
        ? [...previous, ...fresh].sort((a, b) => a.created_at.localeCompare(b.created_at))
        : previous;
    });
  }, []);

  // Opening the chat, and every message that arrives while it is open, counts as read.
  const incoming = messages.filter((m) => m.sender_role !== role).length;
  useEffect(() => {
    if (errand.id && role) markChatRead(errand.id, role).catch(() => {});
  }, [errand.id, role, incoming]);
  useEffect(
    () => () => {
      if (errand.id && role) markChatRead(errand.id, role).catch(() => {});
    },
    [errand.id, role],
  );

  useEffect(() => {
    if (!errand.id) return undefined;
    let alive = true;
    const load = () =>
      fetchMessages(errand.id)
        .then((rows) => alive && merge(rows))
        .catch(() => {})
        .finally(() => alive && setLoaded(true));
    load();
    const unsubscribe = subscribeToMessages(errand.id, (row) => alive && merge([row]));
    // A slow poll backs up the live connection if it drops.
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
      unsubscribe();
    };
  }, [errand.id, merge]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const saved = await sendMessage(errand.id, role, body);
      setText('');
      merge([saved]);
    } catch (error) {
      Alert.alert('Message not sent', error?.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const call = async () => {
    try {
      const phone = String(await getContactPhone(errand.id, role)).replace(/\s+/g, '');
      if (!phone) {
        Alert.alert('No phone number', 'This person has not added a phone number yet.');
        return;
      }
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      Alert.alert('Could not start the call', error?.message || 'Please try again.');
    }
  };

  let lastDay = '';
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.canvas }}
    >
      <View style={{ paddingTop: 52, paddingHorizontal: 22 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={onBack}
          style={{ minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <ChevronLeft size={24} color={C.ink} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: C.ink }}>
            {person.name || (role === 'pal' ? 'User' : 'Your Pal')}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Call"
            onPress={call}
            style={{
              height: 42,
              width: 42,
              borderRadius: 21,
              backgroundColor: C.mint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Phone size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {loaded && !messages.length && (
          <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 40 }}>
            No messages yet. Say hello and agree when to start.
          </Text>
        )}
        {messages.map((message) => {
          const day = dayLabel(message.created_at);
          const header = day !== lastDay;
          lastDay = day;
          return (
            <View key={message.id}>
              {header && (
                <Text
                  style={{
                    fontSize: 12,
                    color: C.ink,
                    textAlign: 'center',
                    marginBottom: 14,
                    marginTop: 4,
                  }}
                >
                  {day}
                </Text>
              )}
              <Bubble message={message} mine={message.sender_role === role} />
            </View>
          );
        })}
      </ScrollView>
      {open ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 22,
            paddingBottom: 30,
            paddingTop: 6,
          }}
        >
          <RaisedField style={{ flex: 1, width: 'auto', marginBottom: 0 }}>
            <RaisedTextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={send}
              style={{ paddingHorizontal: 0 }}
            />
          </RaisedField>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send"
            onPress={send}
            disabled={sending || !text.trim()}
            style={{
              height: 42,
              width: 42,
              borderRadius: 21,
              marginLeft: 12,
              backgroundColor: C.blue,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: sending || !text.trim() ? 0.55 : 1,
            }}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <Text
          style={{
            fontSize: 12,
            color: C.muted,
            textAlign: 'center',
            paddingHorizontal: 22,
            paddingBottom: 34,
            paddingTop: 10,
          }}
        >
          This errand is finished, so messages are read only.
        </Text>
      )}
    </KeyboardAvoidingView>
  );
}
