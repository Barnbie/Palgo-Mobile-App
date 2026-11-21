import React from 'react';
import { Alert } from 'react-native';
import { submitSupportRequest } from '../../lib/api/support';
import {
  PalIdVerification,
  PalMultiSelect,
  PalProfileLatest,
  PersonalInformation,
  ProfileDeleteLatest,
  ProfileDeleteReasonLatest,
  ProfileDeleteSuccessLatest,
  LanguageSelect,
  ProfileEdit,
  ProfileFlowFinal,
  ProfilePassword,
  ProfilePin,
  ProfileSupportLatest,
  ProfileTerms,
  ProfileTheme,
  ReportProblem,
} from '../../features/profile/screens';

const PAL_SKILL_OPTIONS = [
  'Errand',
  'Delivery',
  'Car wash',
  'Plumbing',
  'Electrician',
  'House chores',
  'Mechanic',
  'Chef',
  'Nanny',
  'Security',
  'Hairstylist',
  'Barber',
  'Tailor',
  'Others',
];

const toProfile = (c) => () => c.go('profile');

export const profileRoutes = {
  profile: (c) => {
    const shared = {
      profileDetails: c.profileDetails,
      rating: c.profileRating,
      availableRoles: c.accountRoles,
      onBecomeRole: async (target) => {
        try {
          if (await c.becomeOrSwitchRole(target)) c.go('home');
        } catch (error) {
          Alert.alert('Could not switch profile', error?.message || 'Please try again.');
        }
      },
      onBack: () => c.go('home'),
      onNavigate: c.go,
      onLogout: c.logout,
      onSetting: async (key, value) => {
        try {
          await c.saveNotificationSetting(key, value);
        } catch (error) {
          c.notify(error?.message || 'That setting could not be saved.');
        }
      },
      onReceiveAll: async (value) => {
        try {
          await c.saveReceiveAll(value);
          c.notify(
            value
              ? 'You will receive every errand.'
              : 'You will only receive errands that match your skills.',
          );
        } catch (error) {
          c.notify(error?.message || 'That setting could not be saved.');
        }
      },
      onAvailability: async (value) => {
        try {
          await c.saveAvailability(value);
          c.notify(
            value ? 'You are available for errands.' : 'You are set to unavailable for errands.',
          );
        } catch (error) {
          c.notify(error?.message || 'Availability could not be saved.');
        }
      },
    };
    return {
      back: shared.onBack,
      view:
        c.role === 'pal' ? (
          <PalProfileLatest {...shared} />
        ) : (
          <ProfileFlowFinal role={c.role} {...shared} />
        ),
    };
  },

  'profile-personal': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: (
        <PersonalInformation
          profileDetails={c.profileDetails}
          onBack={back}
          onEdit={(field) => c.go(`profile-edit-${field}`)}
          onPickPhoto={async (asset) => {
            try {
              await c.saveProfilePhoto(asset);
              c.notify('Profile photo updated.');
            } catch (error) {
              c.notify(error?.message || 'Profile photo could not be updated.');
            }
          }}
        />
      ),
    };
  },

  'profile-theme': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: <ProfileTheme mode={c.themeMode} onChange={c.setThemeMode} onBack={back} />,
    };
  },

  'profile-support': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: <ProfileSupportLatest onBack={back} onReport={() => c.go('profile-report')} />,
    };
  },

  'profile-report': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: (
        <ReportProblem
          onBack={back}
          defaultName={c.profileDetails?.name || ''}
          defaultEmail={c.profileDetails?.email || ''}
          onSubmit={(details) => submitSupportRequest({ ...details, role: c.role })}
        />
      ),
    };
  },

  'profile-terms': (c) => {
    const back = toProfile(c);
    return { back, view: <ProfileTerms onBack={back} /> };
  },

  'profile-privacy': (c) => {
    const back = toProfile(c);
    return { back, view: <ProfileTerms title="Privacy Policy" onBack={back} /> };
  },

  'profile-id': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: (
        <PalIdVerification
          idDetails={c.palProfile.verification}
          verification={c.palVerification}
          onBack={back}
          onSave={async (details) => {
            await c.savePalIdentity({
              photo: details.photo,
              id: details.id,
              idNumber: details.idNumber,
            });
            c.go('profile');
          }}
        />
      ),
    };
  },

  'profile-skills': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: (
        <PalMultiSelect
          title="Occupation / Skills"
          options={PAL_SKILL_OPTIONS}
          initialSelected={c.palProfile.occupation?.selected || []}
          initialOther={c.palProfile.occupation?.otherService || ''}
          onBack={back}
          onSave={async (selected, other) => {
            await c.savePalSkills(selected, selected.includes('Others') ? other : '');
            c.go('profile');
          }}
        />
      ),
    };
  },

  'profile-language': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: <LanguageSelect language={c.language} onChange={c.setLanguage} onBack={back} />,
    };
  },

  'profile-password': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: <ProfilePassword onBack={back} onSave={({ next }) => c.savePassword(next)} />,
    };
  },

  'profile-pin': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: (
        <ProfilePin
          isSet={Boolean(c.palPin)}
          currentPin={c.palPin}
          onBack={back}
          onSave={async (value) => {
            await c.savePin(value);
            c.go('profile');
          }}
        />
      ),
    };
  },

  'profile-delete': (c) => {
    const back = toProfile(c);
    return {
      back,
      view: <ProfileDeleteLatest onBack={back} onContinue={() => c.go('profile-delete-reason')} />,
    };
  },

  'profile-delete-reason': (c) => {
    const back = () => c.go('profile-delete');
    return {
      back,
      view: (
        <ProfileDeleteReasonLatest
          onBack={back}
          onDelete={async () => {
            try {
              const userId = c.authUserId;
              await c.deleteAccount();
              await c.clearPin(userId);
              c.go('profile-delete-success');
            } catch (error) {
              c.notify(error?.message || 'Account deletion could not be completed.');
            }
          }}
        />
      ),
    };
  },

  'profile-delete-success': (c) => ({
    view: <ProfileDeleteSuccessLatest onDone={() => c.go('splash')} />,
  }),
};

/** `profile-edit-name`, `profile-edit-email`, `profile-edit-phone`. */
export function profileEditRoute(c) {
  const field = c.screen.replace('profile-edit-', '');
  const back = () => c.go('profile-personal');
  return {
    back,
    view: (
      <ProfileEdit
        field={field}
        profileDetails={c.profileDetails}
        onBack={back}
        onSave={async (value) => {
          if (field === 'phone') {
            await c.saveProfilePhone(value);
            c.notify('Phone number updated.');
            c.go('profile-personal');
            return;
          }
          if (field === 'email') {
            await c.saveProfileEmail(value);
            c.notify(
              'Check the new email address and confirm the change. Your email changes after confirmation.',
            );
            return;
          }
          await c.saveProfileName(value);
          c.go('profile-personal');
        }}
      />
    ),
  };
}
