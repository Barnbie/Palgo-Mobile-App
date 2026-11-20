import React from 'react';
import { UserHomeLatest } from '../../features/home/screens';
import { availableForPal } from '../../lib/mappers';

/** The home screen is also the fallback for any unknown screen id. */
export function homeRoute(c) {
  return {
    view: (
      <UserHomeLatest
        role={c.role}
        errand={c.errand}
        errands={c.accountErrands}
        availableErrands={c.role === 'pal' ? availableForPal(c.accountErrands) : []}
        wallet={c.wallet}
        verification={c.palVerification}
        verificationDismissed={c.dismissedVerificationStatus === c.palVerification.status}
        onDismissVerification={() => c.setDismissedVerificationStatus(c.palVerification.status)}
        onResumeVerification={() => c.go('pal-verification')}
        onCreate={c.startErrand}
        onErrands={() => c.go('errands')}
        onTrack={() => c.go(c.role === 'pal' ? 'pal-active' : 'tracking')}
        onNotify={() => c.go('notifications')}
        onWallet={() => c.go('profile-personal')}
        onStart={c.updateStatus}
        onComplete={c.role === 'pal' ? c.finishErrandAsPal : c.requestUserCompletion}
        onAccept={c.acceptAvailableErrand}
        onViewAvailable={(item) => {
          c.setFocusedErrand(item);
          c.go('pal-detail');
        }}
      />
    ),
  };
}
