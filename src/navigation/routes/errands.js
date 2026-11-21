import React from 'react';
import { fetchNotifications, markNotificationsRead } from '../../lib/api/notifications';
import { Alert } from 'react-native';
import {
  CompletionConfirm,
  Notifications,
  PalCompleteWaiting,
  Success,
  money,
} from '../../AppComponents';
import { CreateCategoryFinal, CreateErrandFormFinal } from '../../features/auth/screens';
import {
  CompletedErrandDetail,
  CounterOfferDetail,
  CounterOfferForm,
  ErrandsUpdated,
  PalDetailFinal,
  PalTrackingHomeLatest,
  PendingErrandDetail,
  Rating,
  TrackingHomeActive,
} from '../../features/errands/screens';
import { DateFilter } from '../../features/wallet/screens';
import { ChatScreen } from '../../features/chat/screens';
import { CancelErrandScreen } from '../../features/errands/cancel';

// Where the chat's back arrow returns to.
let chatReturn = 'tracking';

export const errandRoutes = {
  'create-category': (c) => {
    const back = () => c.go('home');
    return {
      back,
      view: (
        <CreateCategoryFinal
          form={c.form}
          setForm={c.setForm}
          onBack={back}
          onContinue={() => c.go('create-form')}
        />
      ),
    };
  },

  'create-form': (c) => {
    const back = () => c.go('create-category');
    return {
      back,
      view: (
        <CreateErrandFormFinal
          form={c.form}
          setForm={c.setForm}
          onBack={back}
          onSubmit={() =>
            c
              .submitErrand()
              .catch((error) =>
                Alert.alert('Could not request errand', error?.message || 'Please try again.'),
              )
          }
        />
      ),
    };
  },

  submitted: (c) => ({
    back: () => c.go('home'),
    view: (
      <Success
        icon="✓"
        title="Your errand is live!"
        copy="Your request is now visible to nearby Pals."
        primary="View my errands"
        onPrimary={() => c.go('errands')}
        secondary="Back to home"
        onSecondary={() => c.go('home')}
      />
    ),
  }),

  errands: (c) => ({
    back: () => c.go('home'),
    view: (
      <ErrandsUpdated
        role={c.role}
        errands={c.accountErrands}
        offers={c.offers}
        errand={c.errand}
        onOpenOffer={(offer, item, acceptNow) => {
          c.setFocusedErrand(item);
          c.setFocusedOffer(offer);
          if (acceptNow) {
            Alert.alert(
              'Accept this offer?',
              `${offer.pal?.name || 'This Pal'} will do it for ${money(offer.amount)}.`,
              [
                { text: 'Not now', style: 'cancel' },
                { text: 'Accept', onPress: () => c.acceptOffer(offer) },
              ],
            );
          } else c.go('offer-detail');
        }}
        onBack={() => c.go('home')}
        onFilter={() => c.go('errand-filter')}
        onOpen={(kind, item) => {
          if (item) {
            c.setFocusedErrand({ ...item, _from: 'errands' });
            if (['active', 'completed', 'complete'].includes(kind)) c.setErrand(item);
          }
          if (kind === 'active') c.go(c.role === 'pal' ? 'pal-active' : 'tracking');
          else if (kind === 'completed') c.go('completed-detail');
          else if (kind === 'complete') {
            if (c.role === 'pal') c.go('pal-complete');
            else if (item?.status === 'PAL_COMPLETED') {
              c.setErrand(item);
              c.go('complete-confirm');
            } else
              Alert.alert(
                'Waiting for your Pal',
                'Your Pal needs to mark the errand complete before you can confirm it.',
              );
          } else if (kind === 'accept') c.acceptAvailableErrand(item);
          else if (kind === 'counter') c.go('counter-offer');
          else if (kind === 'cancel')
            Alert.alert('Cancel this errand?', 'Pals will no longer see it.', [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Cancel errand', style: 'destructive', onPress: () => c.cancelErrand(item) },
            ]);
          else c.go(c.role === 'pal' ? 'pal-detail' : 'pending-detail');
        }}
      />
    ),
  }),

  'errand-filter': (c) => {
    const back = () => c.go('errands');
    return { back, view: <DateFilter title="Filter errands" onBack={back} /> };
  },

  'pending-detail': (c) => {
    const back = () => c.go('errands');
    return {
      back,
      view: (
        <PendingErrandDetail
          errand={c.focusedErrand || c.current}
          role={c.role}
          onBack={back}
          onAccept={() => c.acceptAvailableErrand(c.focusedErrand || c.current)}
        />
      ),
    };
  },

  'offer-detail': (c) => {
    const back = () => c.go('errands');
    const offer = c.focusedOffer || {};
    return {
      back,
      view: (
        <CounterOfferDetail
          offer={offer}
          errand={c.focusedErrand || {}}
          onBack={back}
          onAccept={() => c.acceptOffer(offer)}
          onDecline={() => c.declineOffer(offer)}
        />
      ),
    };
  },

  'counter-offer': (c) => {
    const item = c.focusedErrand || c.current;
    const back = () => c.go('pal-detail');
    return {
      back,
      view: (
        <CounterOfferForm
          errand={item}
          onBack={back}
          onSubmit={(amount, message) => c.submitCounterOffer(item, amount, message)}
        />
      ),
    };
  },

  'completed-detail': (c) => {
    const item = c.focusedErrand || c.current;
    const back = () => c.go('errands');
    return {
      back,
      view: (
        <CompletedErrandDetail
          errand={item}
          pal={c.activePal}
          role={c.role}
          onBack={back}
          onRate={() => {
            c.setErrand(item);
            c.go(c.role === 'pal' ? 'rating-customer' : 'rating');
          }}
        />
      ),
    };
  },

  tracking: (c) => ({
    back: () => c.go(c.focusedErrand?._from || 'home'),
    view: (
      <TrackingHomeActive
        errand={c.focusedErrand || c.current}
        pal={c.activePal}
        onProfile={() => c.go('profile')}
        onChat={() => {
          chatReturn = 'tracking';
          c.go('chat');
        }}
        onCancel={() => c.go('cancel-errand')}
        onConfirm={() => c.go('complete-confirm')}
      />
    ),
  }),

  'complete-confirm': (c) => {
    const back = () => c.go('tracking');
    return {
      back,
      view: <CompletionConfirm onBack={back} onContinue={c.confirmErrandCompletion} />,
    };
  },

  rating: (c) => ({
    back: () => c.go('completed-detail'),
    view: (
      <Rating
        onBack={() => c.go('completed-detail')}
        name={(c.focusedErrand || c.current).pal?.name || c.activePal.name}
        image={(c.focusedErrand || c.current).pal?.image || c.activePal?.image}
        onDone={(stars, words) =>
          c.saveErrandReview(
            c.current.id,
            c.current.palUserId || c.current.pal?.userId || c.activePal.userId,
            stars,
            words,
          )
        }
      />
    ),
  }),

  'rating-customer': (c) => ({
    back: () => c.go('completed-detail'),
    view: (
      <Rating
        onBack={() => c.go('completed-detail')}
        name={(c.focusedErrand || c.current).person?.name || 'the customer'}
        image={(c.focusedErrand || c.current).person?.image}
        onDone={(stars, words) =>
          c.saveErrandReview(
            c.current.id,
            c.current.requesterUserId || c.current.requester_id || c.current.person?.userId,
            stars,
            words,
          )
        }
      />
    ),
  }),

  'pal-detail': (c) => {
    const from = c.focusedErrand?._from || 'home';
    const back = () => {
      if (from === 'home') c.setFocusedErrand(null);
      c.go(from);
    };
    return {
      back,
      view: (
        <PalDetailFinal
          errand={c.focusedErrand || c.current}
          onBack={back}
          onAccept={() => c.acceptAvailableErrand(c.focusedErrand || c.current)}
          onCounter={() => c.go('counter-offer')}
        />
      ),
    };
  },

  'pal-active': (c) => ({
    back: () => c.go(c.focusedErrand?._from || 'home'),
    view: (
      <PalTrackingHomeLatest
        errand={c.current}
        onProfile={() => c.go('profile')}
        onChat={() => {
          chatReturn = 'pal-active';
          c.go('chat');
        }}
        onCancel={() => c.go('cancel-errand')}
        onStart={c.updateStatus}
        onComplete={c.finishErrandAsPal}
      />
    ),
  }),

  chat: (c) => {
    const back = () => c.go(chatReturn);
    return {
      back,
      view: <ChatScreen errand={c.focusedErrand || c.current} role={c.role} onBack={back} />,
    };
  },

  'cancel-errand': (c) => {
    const item = c.focusedErrand || c.current;
    const back = () => c.go(c.role === 'pal' ? 'pal-active' : 'tracking');
    return {
      back,
      view: (
        <CancelErrandScreen
          errand={item}
          role={c.role}
          onBack={back}
          onConfirm={(reason, note) => c.cancelWithReason(item, reason, note)}
        />
      ),
    };
  },

  'pal-complete': (c) => {
    const back = () => c.go('pal-active');
    return { back, view: <PalCompleteWaiting errand={c.current} onBack={back} /> };
  },

  notifications: (c) => {
    const back = () => c.go('home');
    return {
      back,
      view: (
        <Notifications
          onBack={back}
          load={() => fetchNotifications(c.role)}
          onSeen={() => markNotificationsRead(c.role).catch(() => {})}
        />
      ),
    };
  },
};
