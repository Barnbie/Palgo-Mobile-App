import React from 'react';
import { fetchNotifications, markNotificationsRead } from '../../lib/api/notifications';
import { Alert } from 'react-native';
import { CompletionConfirm, Notifications, PalCompleteWaiting, Success } from '../../AppComponents';
import { CreateCategoryFinal, CreateErrandFormFinal } from '../../features/auth/screens';
import {
  CompletedErrandDetail,
  ErrandsUpdated,
  PalDetailFinal,
  PalTrackingHomeLatest,
  PendingErrandDetail,
  Rating,
  TrackingHomeActive,
} from '../../features/errands/screens';
import { DateFilter } from '../../features/wallet/screens';
import { showCounterOfferNotice, showMessagingNotice } from '../notices';

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
        errand={c.errand}
        onBack={() => c.go('home')}
        onFilter={() => c.go('errand-filter')}
        onOpen={(kind, item) => {
          if (item) {
            c.setFocusedErrand(item);
            if (['active', 'completed', 'complete'].includes(kind)) c.setErrand(item);
          }
          if (kind === 'active') c.go(c.role === 'pal' ? 'pal-active' : 'tracking');
          else if (kind === 'completed') c.go('completed-detail');
          else if (kind === 'complete')
            c.go(c.role === 'pal' ? 'pal-complete' : 'complete-confirm');
          else if (kind === 'accept') c.acceptAvailableErrand(item);
          else if (kind === 'cancel') c.cancelErrand(item);
          else c.go('pending-detail');
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
          onChat={showMessagingNotice}
          onRate={() => {
            c.setErrand(item);
            c.go(c.role === 'pal' ? 'rating-customer' : 'rating');
          }}
        />
      ),
    };
  },

  tracking: (c) => ({
    back: () => c.go('home'),
    view: (
      <TrackingHomeActive
        errand={c.focusedErrand || c.current}
        pal={c.activePal}
        onProfile={() => c.go('profile')}
        onChat={showMessagingNotice}
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
    back: () => c.go('home'),
    view: (
      <Rating
        name={c.current.pal?.name || c.activePal.name}
        image={c.current.pal?.image}
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
    back: () => c.go('home'),
    view: (
      <Rating
        name={c.current.person?.name || 'the customer'}
        image={c.current.person?.image}
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
    const back = () => {
      c.setFocusedErrand(null);
      c.go('home');
    };
    return {
      back,
      view: (
        <PalDetailFinal
          errand={c.focusedErrand || c.current}
          onBack={back}
          onAccept={() => c.acceptAvailableErrand(c.focusedErrand || c.current)}
          onCounter={showCounterOfferNotice}
        />
      ),
    };
  },

  'pal-active': (c) => ({
    back: () => c.go('home'),
    view: (
      <PalTrackingHomeLatest
        errand={c.current}
        onProfile={() => c.go('profile')}
        onChat={showMessagingNotice}
        onStart={c.updateStatus}
        onComplete={c.finishErrandAsPal}
      />
    ),
  }),

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
