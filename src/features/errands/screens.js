import { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/ThemedText';
import { GradientButton } from '../../components/GradientButton';
import {
  Banknote,
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPinned,
  Search,
  Star,
} from '../../components/glyphs';
import * as Shared from '../../AppComponents';
import { colors as C } from '../../theme';
import { RaisedField, RaisedTextInput } from '../../components/Input3D';

const {
  s,

  Button,
  Header,

  money,

  Shell,

  Input,

  Avatar,

  DetailRow,

  ImagePlaceholder,
} = Shared;

function Rating({ name, image, onDone }) {
  const [review, setReview] = useState(''),
    [rating, setRating] = useState(0);
  return (
    <Shell>
      <View style={s.profileHead}>
        <Avatar big image={image ? { uri: image } : undefined} />
        <Header
          title={`How was your experience with ${String(name || 'your counterpart').split(' ')[0]}?`}
        />
        <View
          accessibilityLabel={`${rating} out of 5`}
          style={{ flexDirection: 'row', gap: 10, marginVertical: 16 }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <TouchableOpacity
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${i + 1} stars`}
              onPress={() => setRating(i + 1)}
            >
              <Star
                size={30}
                color="#F2C400"
                fill={i < rating ? '#F2C400' : 'transparent'}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <Input
        label="Leave a review (optional)"
        multiline
        placeholder="Share your experience…"
        value={review}
        onChangeText={setReview}
      />
      <Button
        title="Submit review"
        onPress={() =>
          rating > 0
            ? onDone?.(rating, review)
            : Alert.alert(
                'Choose a rating',
                'Select between one and five stars to submit your review.',
              )
        }
      />
    </Shell>
  );
}
function CompletedErrandDetail({ errand = {}, pal, role, onBack, onChat, onRate }) {
  const counterpart = role === 'pal' ? errand.person : errand.pal || pal;
  const person = counterpart?.name || (role === 'pal' ? 'User' : 'Pal');
  const fee = Number(errand.fee || 0);
  const completedAt = errand.completed_at ? new Date(errand.completed_at) : null;
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 23, fontWeight: '800', color: C.muted, marginBottom: 24 }}>
        Completed errand
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <ImagePlaceholder size={62} profile image={counterpart?.image} />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800' }}>{person}</Text>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 7 }}>
            {Number(counterpart?.rating || 0).toFixed(1)} · {counterpart?.reviewCount || 0} reviews
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, marginBottom: 5 }}>
        Completed: {completedAt ? completedAt.toLocaleString() : '—'}
      </Text>
      <Text style={{ fontSize: 15, textDecorationLine: 'underline', marginBottom: 16 }}>
        Errand details
      </Text>
      <DetailRow Icon={MapPinned} label="Errand" value={errand.title || '—'} />
      <DetailRow Icon={ClipboardList} label="Description" value={errand.description || '—'} />
      <DetailRow Icon={MapPinned} label="Location" value={errand.location || '—'} />
      <DetailRow Icon={Clock3} label="Service time" value={errand.estimated_time || '—'} />
      <DetailRow
        Icon={CalendarDays}
        label="Requested"
        value={
          errand.requested_time ||
          (errand.scheduled_for ? new Date(errand.scheduled_for).toLocaleString() : 'Not specified')
        }
      />
      <Text
        style={{ fontSize: 15, textDecorationLine: 'underline', marginTop: 23, marginBottom: 15 }}
      >
        Errand amount
      </Text>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: C.line,
        }}
      >
        <Text>Agreed service fee</Text>
        <Text style={{ fontWeight: '800' }}>{money(fee)}</Text>
      </View>
      {errand.reviewedByCurrentUser ? (
        <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 18 }}>
          You have reviewed this errand.
        </Text>
      ) : (
        <Button title={`Rate ${role === 'pal' ? 'User' : 'Pal'}`} onPress={onRate} />
      )}
      <View style={{ marginTop: 12 }}>
        <Button kind="outline" title="Contact" onPress={onChat} />
      </View>
    </Shell>
  );
}
function PendingErrandDetail({ errand = {}, role = 'user', onBack, onAccept }) {
  const heading = {
    fontSize: 15,
    textDecorationLine: 'underline',
    marginTop: 23,
    marginBottom: 15,
  };
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 23, fontWeight: '800', color: C.muted, marginBottom: 24 }}>
        Errand details
      </Text>
      {!!errand.person && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <ImagePlaceholder size={62} profile image={errand.person.image} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800' }}>{errand.person.name || 'User'}</Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 7 }}>
              {Number(errand.person.rating || 0).toFixed(1)} · {errand.person.reviewCount || 0}{' '}
              reviews
            </Text>
          </View>
        </View>
      )}
      <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
        {errand.title || '—'}
      </Text>
      <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 8 }}>
        {errand.description || '—'}
      </Text>
      <DetailRow Icon={MapPinned} label="Location" value={errand.location || '—'} />
      <DetailRow Icon={Banknote} label="Offer" value={money(errand.fee)} />
      <DetailRow
        Icon={Clock3}
        label="Requested time"
        value={
          errand.requested_time ||
          (errand.scheduled_for ? new Date(errand.scheduled_for).toLocaleString() : 'Not specified')
        }
      />
      <DetailRow Icon={Clock3} label="Duration" value={errand.estimated_time || 'Not specified'} />
      <Text style={heading}>Special notes</Text>
      <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20 }}>
        {errand.special_notes || 'No special notes provided.'}
      </Text>
      {role === 'pal' && (
        <View style={{ marginTop: 26 }}>
          <Button title="Accept" onPress={onAccept} />
        </View>
      )}
    </Shell>
  );
}
function PalDetailFinal({ errand, onBack, onAccept, onCounter }) {
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 23, fontWeight: '800', color: C.muted, marginBottom: 22 }}>
        Errand details
      </Text>
      <View style={{ backgroundColor: C.paper, borderRadius: 18, padding: 17 }}>
        <Text style={{ fontSize: 17, fontWeight: '800' }}>{errand.title}</Text>
        <Text style={{ fontSize: 14, lineHeight: 22, marginTop: 15 }}>
          {errand.description || 'Please help with this errand.'}
        </Text>
        <View style={{ height: 1, backgroundColor: C.line, marginVertical: 17 }} />
        <DetailRow Icon={MapPinned} label={errand.location} />
        <DetailRow
          Icon={Clock3}
          label={
            errand.requested_time ||
            (errand.scheduled_for
              ? new Date(errand.scheduled_for).toLocaleString()
              : 'Time not specified')
          }
        />
        <DetailRow Icon={Banknote} label={`User offer: ${money(errand.fee)}`} />
        <Text style={{ fontSize: 14, color: C.muted, marginTop: 7 }}>Special notes</Text>
        <Text style={{ fontSize: 13, lineHeight: 20, marginTop: 7 }}>
          {errand.special_notes || 'No special notes provided.'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 31 }}>
        <View style={{ flex: 1 }}>
          <Button kind="outline" title="Counter offer" onPress={onCounter} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Accept" onPress={onAccept} />
        </View>
      </View>
    </Shell>
  );
}
/** The time the User asked for, e.g. "12pm" or a scheduled date. */
function requestedTimeText(e = {}) {
  if (e.requested_time && String(e.requested_time).trim()) return String(e.requested_time).trim();
  if (e.scheduled_for) return new Date(e.scheduled_for).toLocaleString();
  return '';
}

function StarLine({ person = {} }) {
  const count = person.reviewCount || 0;
  return (
    <Text style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
      {count ? `★ ${Number(person.rating || 0).toFixed(1)} · ${count} reviews` : 'No reviews yet'}
    </Text>
  );
}

/** Two equal pills: View details (blue, left) and the main action (green, right). */
function CardButtons({ onView, actionLabel, onAction }) {
  const base = { height: 34, flex: 1, borderRadius: 17 };
  const label = { fontSize: 11, fontWeight: '800', color: C.white };
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
      <GradientButton tone="blue" onPress={onView} style={base}>
        <Text style={label}>View details</Text>
      </GradientButton>
      {actionLabel ? (
        <GradientButton tone="green" onPress={onAction} style={base}>
          <Text style={label}>{actionLabel}</Text>
        </GradientButton>
      ) : null}
    </View>
  );
}

// Functions, not constants: the colours change when dark mode is switched on.
const cardStyle = () => ({
  backgroundColor: C.paper,
  borderRadius: 18,
  padding: 15,
  marginBottom: 12,
});
const amountStyle = () => ({ fontSize: 22, fontWeight: '800', color: C.icon() });

// Status colours: pending amber, active blue, completed green, cancelled red.
const STATUS_AMBER = '#F2C400';
const statusColor = (state) =>
  state === 'Completed'
    ? C.mint
    : state === 'Canceled'
      ? C.red
      : state === 'Pending'
        ? STATUS_AMBER
        : C.scheme === 'dark'
          ? '#60A5FA'
          : C.blue;

/**
 * The card used for errands on Home and in the Errands list.
 * Optional `person` adds the photo, name and stars at the top (active errands).
 */
function ErrandSummaryCard({ errand, person, state, label, actionLabel, onView, onAction }) {
  const place = [errand.location, errand.city, errand.state].filter(Boolean).join(', ');
  const time = requestedTimeText(errand);
  return (
    <View style={cardStyle()}>
      {person ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <ImagePlaceholder size={44} profile image={person.image} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.ink }}>
              {person.name || 'PalGo member'}
            </Text>
            <StarLine person={person} />
          </View>
        </View>
      ) : null}
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
      >
        <Text style={{ fontSize: 15, fontWeight: '800', color: C.ink, flex: 1, marginRight: 10 }}>
          {errand.title}
        </Text>
        <Text style={amountStyle()}>{money(errand.fee)}</Text>
      </View>
      {!!errand.description && (
        <Text
          numberOfLines={2}
          style={{ fontSize: 11, color: C.muted, lineHeight: 17, marginTop: 7 }}
        >
          {errand.description}
        </Text>
      )}
      {!!place && <Text style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{place}</Text>}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: statusColor(state), flexShrink: 1 }}>
          {label || state}
        </Text>
        {!!time && (
          <Text
            numberOfLines={1}
            style={{ fontSize: 11, color: C.muted, marginLeft: 10, flexShrink: 1 }}
          >
            {time}
          </Text>
        )}
      </View>
      <CardButtons onView={onView} actionLabel={actionLabel} onAction={onAction} />
    </View>
  );
}

function OfferCard({ offer, errand, onView, onAccept }) {
  return (
    <View style={cardStyle()}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ImagePlaceholder size={48} profile image={offer.pal?.image} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.ink }}>
            {offer.pal?.name || 'Pal'}
          </Text>
          <StarLine person={offer.pal} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={amountStyle()}>{money(offer.amount)}</Text>
          <Text style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
            Your offer {money(errand.fee)}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 11, fontWeight: '800', color: C.mint, marginTop: 10 }}>
        Counter offer
      </Text>
      <Text numberOfLines={1} style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
        {errand.title}
      </Text>
      <CardButtons onView={onView} actionLabel="Accept" onAction={onAccept} />
    </View>
  );
}

function ErrandsCardsUpdated({
  role,
  errands = [],
  offers = [],
  onBack,
  onOpen,
  onOpenOffer,
  onFilter,
}) {
  const [filter, setFilter] = useState('All'),
    [query, setQuery] = useState('');
  const filters = ['All', 'Completed', 'Active', 'Pending', 'Canceled'];
  const stateOf = (item) =>
    item.status === 'PENDING'
      ? 'Pending'
      : ['ACCEPTED', 'ACTIVE', 'PAL_COMPLETED', 'PAL_SELECTED', 'PAL_ARRIVED'].includes(item.status)
        ? 'Active'
        : item.status === 'COMPLETED'
          ? 'Completed'
          : item.status === 'CANCELLED'
            ? 'Canceled'
            : 'Pending';
  const visible = errands.filter((item) => {
    const state = stateOf(item);
    const matchesFilter = filter === 'All' || state === filter;
    const matchesQuery =
      !query ||
      `${item.title || ''} ${item.description || ''} ${item.location || ''}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, marginBottom: 17 }}>
        Errands
      </Text>
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 16 }}>
        {filters.map((name) => {
          const selected = filter === name;
          return (
            <TouchableOpacity
              key={name}
              onPress={() => setFilter(name)}
              style={{
                height: 35,
                flex: 1,
                borderRadius: 18,
                backgroundColor: selected ? C.mint : C.paper,
                borderWidth: selected ? 0 : 1,
                borderColor: C.blue,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: selected ? C.white : C.blue }}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <RaisedField style={{ marginBottom: 14 }}>
        <Search size={18} color={C.muted} />
        <RaisedTextInput value={query} onChangeText={setQuery} placeholder="Search errands" />
      </RaisedField>
      <TouchableOpacity
        onPress={onFilter}
        style={{
          alignSelf: 'flex-start',
          height: 31,
          paddingHorizontal: 13,
          borderRadius: 16,
          backgroundColor: C.paper,
          justifyContent: 'center',
          marginBottom: 13,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: C.blue }}>Filter by date</Text>
      </TouchableOpacity>
      {visible.length === 0 ? (
        <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 30 }}>
          No {filter === 'All' ? '' : filter.toLowerCase() + ' '}errands yet.
        </Text>
      ) : (
        visible.map((item) => {
          const state = stateOf(item),
            isPal = role === 'pal',
            pending = item.status === 'PENDING',
            itemOffers = offers.filter((o) => o.errandId === item.id),
            userOffers = !isPal && pending ? itemOffers.filter((o) => o.status === 'pending') : [],
            myOffer = isPal && pending ? itemOffers[0] : null;
          const viewKind =
            state === 'Completed' ? 'completed' : state === 'Active' ? 'active' : 'pending-detail';
          // The green button on the right depends on where the errand is.
          let actionLabel = null;
          let actionKind = null;
          if (pending) {
            actionLabel = isPal
              ? myOffer?.status === 'pending'
                ? null
                : 'Counter offer'
              : 'Cancel';
            actionKind = isPal ? 'counter' : 'cancel';
          } else if (state === 'Active') {
            actionLabel = 'Complete';
            actionKind = isPal ? 'active' : 'complete';
          }
          let stateLabel = state;
          if (userOffers.length)
            stateLabel = `Pending · ${userOffers.length} counter offer${userOffers.length > 1 ? 's' : ''}`;
          if (myOffer?.status === 'pending') stateLabel = `Offer sent · ${money(myOffer.amount)}`;
          if (myOffer?.status === 'declined') stateLabel = 'Offer declined';
          return (
            <View key={item.id}>
              <View style={cardStyle()}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '800',
                      color: C.ink,
                      flex: 1,
                      marginRight: 10,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text style={amountStyle()}>{money(item.fee)}</Text>
                </View>
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 11, color: C.muted, lineHeight: 17, marginTop: 7 }}
                >
                  {item.description}
                </Text>
                <Text style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                  {item.location}
                  {item.city ? `, ${item.city}` : ''}
                  {item.state ? `, ${item.state}` : ''}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: myOffer?.status === 'declined' ? C.red : statusColor(state),
                      flexShrink: 1,
                    }}
                  >
                    {stateLabel}
                  </Text>
                  {!!requestedTimeText(item) && (
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: C.muted, marginLeft: 10, flexShrink: 1 }}
                    >
                      {requestedTimeText(item)}
                    </Text>
                  )}
                </View>
                <CardButtons
                  onView={() => onOpen(viewKind, item)}
                  actionLabel={actionLabel}
                  onAction={() => onOpen(actionKind, item)}
                />
              </View>
              {userOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  errand={item}
                  onView={() => onOpenOffer(offer, item, false)}
                  onAccept={() => onOpenOffer(offer, item, true)}
                />
              ))}
            </View>
          );
        })
      )}
    </Shell>
  );
}

/** What the requester sees when they open a counter offer: the Pal, the price and the errand. */
function CounterOfferDetail({ offer = {}, errand = {}, onBack, onAccept, onDecline }) {
  const pal = offer.pal || {};
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 23, fontWeight: '800', color: C.muted, marginBottom: 22 }}>
        Counter offer
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <ImagePlaceholder size={72} profile image={pal.image} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>{pal.name || 'Pal'}</Text>
          <StarLine person={pal} />
          {!!pal.skills && (
            <Text numberOfLines={2} style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              {pal.skills}
            </Text>
          )}
        </View>
      </View>
      <View style={{ backgroundColor: C.paper, borderRadius: 18, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: C.muted }}>The Pal is asking for</Text>
        <Text style={{ ...amountStyle(), fontSize: 28, marginTop: 4 }}>{money(offer.amount)}</Text>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
          Your offer was {money(errand.fee)}
        </Text>
        {!!offer.message && (
          <Text style={{ fontSize: 13, lineHeight: 20, color: C.ink, marginTop: 12 }}>
            “{offer.message}”
          </Text>
        )}
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 8 }}>
        {errand.title || '—'}
      </Text>
      <Text style={{ fontSize: 13, color: C.muted, lineHeight: 20, marginBottom: 8 }}>
        {errand.description || '—'}
      </Text>
      <DetailRow Icon={MapPinned} label="Location" value={errand.location || '—'} />
      <DetailRow
        Icon={Clock3}
        label="Requested time"
        value={
          errand.requested_time ||
          (errand.scheduled_for ? new Date(errand.scheduled_for).toLocaleString() : 'Not specified')
        }
      />
      <DetailRow Icon={Clock3} label="Duration" value={errand.estimated_time || 'Not specified'} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 28 }}>
        <View style={{ flex: 1 }}>
          <Button kind="outline" title="Decline" onPress={onDecline} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Accept" kind="secondary" onPress={onAccept} />
        </View>
      </View>
    </Shell>
  );
}

/** A Pal proposes a different price (and an optional note) for a pending errand. */
function CounterOfferForm({ errand = {}, onBack, onSubmit }) {
  const [amount, setAmount] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const value = Number(String(amount).replace(/[^0-9.]/g, ''));
  const submit = async () => {
    if (!value || value < 2000) {
      Alert.alert('Check the amount', 'The minimum amount is 2,000.');
      return;
    }
    setBusy(true);
    await onSubmit(value, message.trim());
    setBusy(false);
  };
  return (
    <Shell back={onBack}>
      <Text style={{ fontSize: 23, fontWeight: '800', color: C.muted, marginBottom: 20 }}>
        Counter offer
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 6 }}>
        {errand.title || '—'}
      </Text>
      <Text style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
        The User is offering {money(errand.fee)}. Suggest the amount you would do it for.
      </Text>
      <Input
        label="Your price"
        value={amount}
        onChangeText={setAmount}
        placeholder="e.g. 5000"
        keyboardType="number-pad"
        maxLength={9}
      />
      <Input
        label="Note to the User (optional)"
        value={message}
        onChangeText={setMessage}
        placeholder="Why this price?"
        multiline
        maxLength={300}
      />
      <View style={{ marginTop: 20 }}>
        <Button title={busy ? 'Sending...' : 'Send offer'} onPress={busy ? undefined : submit} />
      </View>
    </Shell>
  );
}

export { TrackingHomeActive, PalTrackingHomeLatest } from './activeErrand';
export {
  Rating,
  CompletedErrandDetail,
  PendingErrandDetail,
  PalDetailFinal,
  ErrandsCardsUpdated as ErrandsUpdated,
  CounterOfferDetail,
  CounterOfferForm,
  ErrandSummaryCard,
};
