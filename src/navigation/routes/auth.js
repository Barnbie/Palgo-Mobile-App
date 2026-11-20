import React from 'react';
import {
  Login,
  OnboardingFlowFinal,
  PalOccupation,
  PalVerification,
  RegistrationFlow,
  RolePickerFinal,
  Splash,
  UserEmailConfirmation,
  UserEmailVerified,
} from '../../features/auth/screens';

// Each route is `(ctx) => ({ view, back })`: `view` is the screen to show and
// `back` is what Android's hardware back button does there (omit to let the
// system handle it, e.g. leave the app).

export const authRoutes = {
  splash: (c) => ({
    view: <Splash onStart={() => c.go(c.hasSeenOnboarding ? 'entry' : 'onboarding1')} />,
  }),

  entry: (c) => {
    const back = () => c.go('onboarding2');
    return {
      back,
      view: (
        <OnboardingFlowFinal
          page={3}
          onNext={() => {}}
          onBack={back}
          onChoose={c.chooseAuthIntent}
        />
      ),
    };
  },

  role: (c) => {
    const back = () => c.go(c.hasSeenOnboarding ? 'entry' : 'onboarding3');
    return {
      back,
      view: (
        <RolePickerFinal
          onDismiss={back}
          onPick={(picked) => {
            c.setRole(picked);
            c.go(c.authIntent);
          }}
        />
      ),
    };
  },

  signup: (c) => {
    const back = () => c.go('role');
    return {
      back,
      view: (
        <RegistrationFlow
          role={c.role}
          initialValues={c.pendingPalCredentials || {}}
          onBack={back}
          onContinue={(credentials) => c.createAccount({ ...credentials, role: c.role })}
          onLogin={() => c.go('login')}
        />
      ),
    };
  },

  login: (c) => {
    const back = () => c.go('entry');
    return { back, view: <Login role={c.role} onBack={back} onLogin={c.loginAccount} /> };
  },

  'email-verify': (c) => {
    const back = () => c.go(c.pendingSignup?.returnTo || 'signup');
    return {
      back,
      view: (
        <UserEmailConfirmation
          email={c.pendingSignup?.email || ''}
          onBack={back}
          onVerify={c.confirmAccount}
          onResend={c.resendSignupEmail}
        />
      ),
    };
  },

  'email-verified': (c) => ({ view: <UserEmailVerified onContinue={() => c.go('login')} /> }),

  'pal-verification': (c) => {
    const back = () => c.go(c.pendingPalCredentials ? 'signup' : 'home');
    return {
      back,
      view: (
        <PalVerification
          initialValue={c.palProfile.verification}
          onBack={back}
          onNext={(details) => {
            c.setPalProfile((value) => ({ ...value, verification: details }));
            c.go('pal-occupation');
          }}
        />
      ),
    };
  },

  'pal-occupation': (c) => {
    const back = () => c.go('pal-verification');
    return {
      back,
      view: (
        <PalOccupation
          initialValue={c.palProfile.occupation}
          onBack={back}
          onNext={(details) => {
            c.setPalProfile((value) => ({ ...value, occupation: details }));
            c.finishPalSignup(details).catch((error) =>
              c.notify(error?.message || 'Could not finish account setup.'),
            );
          }}
        />
      ),
    };
  },
};

/** `onboarding1`, `onboarding2`, ... share one screen. */
export function onboardingRoute(c) {
  const page = Number(c.screen.replace('onboarding', '')) || 1;
  const back = page > 1 ? () => c.go(`onboarding${page - 1}`) : undefined;
  return {
    back,
    view: (
      <OnboardingFlowFinal
        page={page}
        onNext={(next) => c.go(`onboarding${next + 1}`)}
        onBack={(previous) => c.go(`onboarding${previous - 1}`)}
        onChoose={c.chooseAuthIntent}
      />
    ),
  };
}
