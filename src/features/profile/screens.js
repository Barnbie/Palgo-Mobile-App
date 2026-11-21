import { GradientButton } from '../../components/GradientButton';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, TouchableOpacity, View } from 'react-native';
import { Text } from '../../components/ThemedText';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  Star,
  X,
} from '../../components/glyphs';
import * as ImagePicker from 'expo-image-picker';
import { colors as C } from '../../theme';
import { LANGUAGES } from '../../i18n';
import { LEGAL_UPDATED, PRIVACY, TERMS } from './legal';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../../config/contact';
import { uiPlaceholders } from '../../assets';
import * as Shared from '../../AppComponents';
import {
  CheckCircleIcon,
  ChatIcon,
  GlobeIcon,
  MailIcon,
  PhoneIcon,
  IdCardIcon,
  LockIcon,
  LogoutIcon,
  NotificationIcon,
  PasswordIcon,
  PersonIcon,
  PrivacyIcon,
  SupportIcon,
  TermsIcon,
  ThemeIcon,
  TrashIcon,
  WarningIcon,
  WrenchIcon,
} from '../../components/icons';
const {
  s,

  Button,
  Header,

  Shell,

  Input,

  Choice,

  ImagePlaceholder,
} = Shared;

function ProfileHeader({ compact = false, editable = false, photoUrl, onPickPhoto }) {
  const background =
    uiPlaceholders.personalInfoBackground || uiPlaceholders.profileHeaderBackground;
  const frame = {
    position: 'absolute',
    height: compact ? 112 : 108,
    width: compact ? 112 : 108,
    borderRadius: 54,
    overflow: 'hidden',
    backgroundColor: C.soft('#E7EEFF'),
    alignItems: 'center',
    justifyContent: 'center',
  };
  const choose = () =>
    Alert.alert('Profile photo', 'Choose how you want to add your photo.', [
      {
        text: 'Take a photo',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              'Camera permission needed',
              'Allow camera access in your phone settings to take a photo.',
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.[0]) onPickPhoto?.(result.assets[0]);
        },
      },
      {
        text: 'Choose from photos',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets?.[0]) onPickPhoto?.(result.assets[0]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  return (
    <View
      style={{
        height: compact ? 118 : 114,
        marginBottom: compact ? 18 : 14,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {background ? (
        <Image source={background} resizeMode="cover" style={frame} />
      ) : (
        <View style={frame}>
          <Text style={{ fontSize: 7, fontWeight: '800', textAlign: 'center', color: C.blue }}>
            PROFILE BACKGROUND{`\n`}PLACEHOLDER
          </Text>
        </View>
      )}
      <View style={{ alignItems: 'center' }}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            resizeMode="cover"
            style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: C.blue }}
          />
        ) : (
          <ImagePlaceholder size={72} profile />
        )}
        {editable && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            onPress={choose}
            style={{
              position: 'absolute',
              right: -5,
              top: -2,
              width: 29,
              height: 29,
              borderRadius: 15,
              backgroundColor: C.mint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, lineHeight: 22, color: C.white, fontWeight: '700' }}>
              +
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const ROW_ICONS = {
  'Personal info': PersonIcon,
  'Personal information': PersonIcon,
  'Password Settings': PasswordIcon,
  Password: PasswordIcon,
  Themes: ThemeIcon,
  Theme: ThemeIcon,
  'Push Notification': NotificationIcon,
  'Push Notifications': NotificationIcon,
  'Email Notifications': MailIcon,
  Availability: CheckCircleIcon,
  'ID Verification': IdCardIcon,
  'Occupation / Skills': WrenchIcon,
  Language: GlobeIcon,
  'PIN Settings': LockIcon,
  'Privacy Policy': PrivacyIcon,
  'Terms & Conditions': TermsIcon,
  Support: SupportIcon,
  'Report a problem': WarningIcon,
  Logout: LogoutIcon,
  'Log out': LogoutIcon,
};
function ProfileRow({
  label,
  target,
  onNavigate,
  toggle = false,
  onToggle,
  value = true,
  Icon: IconProp,
}) {
  const Icon = IconProp || ROW_ICONS[label] || PersonIcon;
  return (
    <View style={{ height: 51, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
      <TouchableOpacity
        accessibilityRole="button"
        disabled={toggle}
        onPress={() => onNavigate?.(target)}
        style={{ flex: 1, height: '100%', flexDirection: 'row', alignItems: 'center' }}
      >
        <Icon size={22} />
        <Text style={{ fontSize: 14, marginLeft: 12, flex: 1 }}>{label}</Text>
      </TouchableOpacity>
      {toggle ? (
        <TouchableOpacity
          accessibilityRole="switch"
          onPress={onToggle}
          style={{
            width: 42,
            height: 24,
            borderRadius: 12,
            backgroundColor: value ? C.mint : C.line,
            padding: 3,
            alignItems: value ? 'flex-end' : 'flex-start',
          }}
        >
          <View style={{ height: 18, width: 18, borderRadius: 9, backgroundColor: C.paper }} />
        </TouchableOpacity>
      ) : (
        <ChevronRight size={18} color={C.ink} />
      )}
    </View>
  );
}
/** One star: outlined when empty, half filled for a half, fully filled when earned. */
function RatingStar({ fill }) {
  const size = 16;
  const gold = '#F2C400';
  if (fill >= 0.75) return <Star size={size} color={gold} />;
  if (fill < 0.25) return <Star size={size} color={gold} variant="outline" />;
  return (
    <View style={{ width: size, height: size }}>
      <Star size={size} color={gold} variant="outline" />
      <View style={{ position: 'absolute', left: 0, top: 0, width: size / 2, overflow: 'hidden' }}>
        <Star size={size} color={gold} />
      </View>
    </View>
  );
}
function ProfileRating({ rating = { average: 0, count: 0 } }) {
  const average = Number(rating.average) || 0;
  return (
    <View
      accessibilityLabel={`${average.toFixed(1)} stars from ${rating.count || 0} reviews`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        marginTop: 7,
        marginBottom: 5,
      }}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <RatingStar key={index} fill={Math.max(0, Math.min(1, average - index))} />
      ))}
      <View
        style={{
          marginLeft: 8,
          minWidth: 48,
          paddingHorizontal: 10,
          height: 25,
          borderRadius: 13,
          backgroundColor: C.paper,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: C.ink }}>{average.toFixed(1)}</Text>
      </View>
      <Text style={{ fontSize: 10, color: C.muted, marginLeft: 3 }}>({rating.count || 0})</Text>
    </View>
  );
}
function AvailabilityBadge({ available }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        height: 26,
        borderRadius: 13,
        backgroundColor: available ? C.soft('#DDF7EC') : C.line,
        marginTop: 4,
      }}
    >
      <View
        style={{
          height: 8,
          width: 8,
          borderRadius: 4,
          backgroundColor: available ? C.mint : C.muted,
        }}
      />
      <Text style={{ fontSize: 11, fontWeight: '800', color: available ? C.mint : C.muted }}>
        {available ? 'Available' : 'Unavailable'}
      </Text>
    </View>
  );
}
function DeleteProfileLink({ onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={10}
      style={{
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginTop: 24,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <TrashIcon size={18} color={C.red} />
      <Text style={{ color: C.red, fontWeight: '800', fontSize: 13 }}>Delete Profile</Text>
    </TouchableOpacity>
  );
}
/** Green in light mode, blue in dark mode. */
function RoleSwitchButton({ title, onPress }) {
  return (
    <GradientButton
      onPress={onPress}
      style={{ height: 50, borderRadius: 25, marginTop: 18, marginHorizontal: 20 }}
    >
      <Text style={{ color: C.white, fontSize: 14, fontWeight: '800' }}>{title}</Text>
    </GradientButton>
  );
}
function ProfileFlowFinal({
  role,
  profileDetails = {},
  rating,
  onBack,
  onNavigate,
  onLogout,
  availableRoles = [],
  onBecomeRole,
  onSetting,
}) {
  const otherRole = role === 'pal' ? 'user' : 'pal';
  const hasOtherRole = availableRoles.includes(otherRole);
  return (
    <Shell back={onBack}>
      <ProfileHeader photoUrl={profileDetails.photoUrl} />
      <View style={{ alignItems: 'center', marginBottom: 23 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', marginTop: 24 }}>
          {profileDetails.name || 'Your profile'}
        </Text>
        <ProfileRating rating={rating} />
      </View>
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 3 }}>
        <ProfileRow
          Icon={PersonIcon}
          label="Personal information"
          target="profile-personal"
          onNavigate={onNavigate}
        />
        <ProfileRow
          Icon={PasswordIcon}
          label="Password"
          target="profile-password"
          onNavigate={onNavigate}
        />
        <ProfileRow Icon={ThemeIcon} label="Theme" target="profile-theme" onNavigate={onNavigate} />
        <ProfileRow
          Icon={GlobeIcon}
          label="Language"
          target="profile-language"
          onNavigate={onNavigate}
        />
        <ProfileRow
          Icon={NotificationIcon}
          label="Push Notifications"
          toggle
          value={profileDetails.pushEnabled !== false}
          onToggle={() => onSetting?.('pushEnabled', profileDetails.pushEnabled === false)}
          onNavigate={onNavigate}
        />
        <ProfileRow
          Icon={MailIcon}
          label="Email Notifications"
          toggle
          value={profileDetails.emailNotifications !== false}
          onToggle={() =>
            onSetting?.('emailNotifications', profileDetails.emailNotifications === false)
          }
          onNavigate={onNavigate}
        />
      </View>
      <View style={{ height: 18 }} />
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 3 }}>
        <ProfileRow label="Terms & Conditions" target="profile-terms" onNavigate={onNavigate} />
        <ProfileRow label="Privacy Policy" target="profile-privacy" onNavigate={onNavigate} />
        <ProfileRow label="Support" target="profile-support" onNavigate={onNavigate} />
        {role !== 'pal' && (
          <ProfileRow label="Report a problem" target="profile-report" onNavigate={onNavigate} />
        )}
        <ProfileRow label="Log out" target="profile-logout" onNavigate={() => onLogout()} />
      </View>
      <DeleteProfileLink onPress={() => onNavigate('profile-delete')} />
      <RoleSwitchButton
        title={
          hasOtherRole
            ? `Switch to ${otherRole === 'pal' ? 'Pal' : 'User'} profile`
            : `Become a ${otherRole === 'pal' ? 'Pal' : 'User'}`
        }
        onPress={() => onBecomeRole?.(otherRole)}
      />
    </Shell>
  );
}
function PersonalInformation({ onBack, onEdit, profileDetails = {}, onPickPhoto }) {
  const data = [
    ['Name', profileDetails.name || '', 'name'],
    ['Phone number', profileDetails.phone || '', 'phone'],
    ['Email', profileDetails.email || '', 'email'],
  ];
  return (
    <Shell back={onBack}>
      <Header title="Personal information" />
      <ProfileHeader
        compact
        editable
        photoUrl={profileDetails.photoUrl}
        onPickPhoto={onPickPhoto}
      />
      <View style={{ height: 27 }} />
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 3 }}>
        {data.map(([label, value, key]) => (
          <View
            key={key}
            style={{
              minHeight: key === 'phone' || key === 'email' ? 68 : 58,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {(() => {
              const Icon =
                { name: PersonIcon, phone: PhoneIcon, email: MailIcon }[key] || PersonIcon;
              return <Icon size={22} />;
            })()}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 11, color: C.muted }}>{label}</Text>
              <Text style={{ fontSize: 14, marginTop: 3 }}>{value || 'Not provided'}</Text>
              {key === 'phone' && (
                <Text style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  Phone number is not verified yet
                </Text>
              )}
              {key === 'email' && profileDetails.emailVerified && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <CheckCircle2 size={12} color={C.mint} />
                  <Text style={{ fontSize: 10, color: C.mint, marginLeft: 4 }}>Email verified</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => onEdit(key)}>
              <Text style={{ color: C.mint, fontWeight: '800', fontSize: 13 }}>Edit</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Shell>
  );
}
function ProfileEdit({ field, onBack, onSave, profileDetails = {} }) {
  const [value, setValue] = useState(profileDetails[field] || ''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setValue(profileDetails[field] || '');
  }, [field, profileDetails[field]]);
  const names = {
    name: 'Update your name',
    phone: 'Update your phone number',
    email: 'Update your email',
  };
  const save = async () => {
    if (busy) return;
    if (!value.trim()) {
      Alert.alert('Enter your details', 'This field cannot be empty.');
      return;
    }
    setBusy(true);
    try {
      await onSave?.(value.trim());
    } catch (error) {
      Alert.alert('Could not update', error?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Header title={names[field] || 'Update information'} />
      <Input
        label={
          field === 'phone' ? 'Phone number' : field === 'email' ? 'Email address' : 'Full name'
        }
        value={value}
        onChangeText={setValue}
        keyboardType={
          field === 'phone' ? 'phone-pad' : field === 'email' ? 'email-address' : 'default'
        }
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        placeholder="Enter your details"
      />
      {field === 'phone' && (
        <Text style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
          We do not verify phone numbers yet. Make sure the number is correct so Pals and Users can
          reach you about an errand.
        </Text>
      )}
      {field === 'email' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 22 }}>
          <CheckCircle2 size={18} color={C.mint} />
          <Text style={{ fontSize: 12, color: C.muted, marginLeft: 8, flex: 1 }}>
            Your current email is verified. We’ll send a confirmation link to the new address.
          </Text>
        </View>
      )}
      <Button title={busy ? 'Saving…' : 'Continue'} onPress={save} />
    </Shell>
  );
}
function ProfileTheme({ onBack, mode = 'system', onChange }) {
  return (
    <Shell back={onBack}>
      <Header title="Themes" />
      <Choice
        label="Light Mode"
        sub="Use the light app appearance"
        selected={mode === 'light'}
        onPress={() => onChange?.('light')}
      />
      <Choice
        label="Dark Mode"
        sub="Use the dark app appearance"
        selected={mode === 'dark'}
        onPress={() => onChange?.('dark')}
      />
      <Choice
        label="System default"
        sub="Follow your device appearance"
        selected={mode === 'system'}
        onPress={() => onChange?.('system')}
      />
    </Shell>
  );
}
function ContactCard({ Icon, title, detail, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        minHeight: 108,
        backgroundColor: C.paper,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={28} />
      <Text style={{ fontSize: 13, fontWeight: '800', marginTop: 8 }}>{title}</Text>
      <Text
        numberOfLines={2}
        style={{ fontSize: 10, color: C.muted, marginTop: 3, textAlign: 'center' }}
      >
        {detail}
      </Text>
    </TouchableOpacity>
  );
}
function openLink(url) {
  Linking.openURL(url).catch(() =>
    Alert.alert('Could not open', 'Your phone could not open this link.'),
  );
}
function ProfileSupportLatest({ onBack, onReport }) {
  return (
    <Shell back={onBack}>
      <Header title="Support Center" />
      <Text style={{ fontSize: 14, fontWeight: '800', marginTop: 8, marginBottom: 10 }}>
        Contact us via
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ContactCard
          Icon={ChatIcon}
          title="WhatsApp"
          detail={`+${SUPPORT_WHATSAPP}`}
          onPress={() => openLink(`https://wa.me/${SUPPORT_WHATSAPP}`)}
        />
        <ContactCard
          Icon={PhoneIcon}
          title="Phone"
          detail={SUPPORT_PHONE}
          onPress={() => openLink(`tel:${SUPPORT_PHONE}`)}
        />
        <ContactCard
          Icon={MailIcon}
          title="Email"
          detail={SUPPORT_EMAIL}
          onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
        />
      </View>
      <View style={{ backgroundColor: C.paper, borderRadius: 17, padding: 16, marginTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SupportIcon size={26} />
          <Text style={{ fontSize: 15, fontWeight: '800', marginLeft: 12, color: C.ink }}>
            We are here to help
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 18 }}>
          Send us a message about your account, an errand or a payment. Our team reads every message
          and replies to the email address you give us.
        </Text>
      </View>
      <View style={{ marginTop: 26 }}>
        <Button title="Message support" onPress={onReport} />
      </View>
    </Shell>
  );
}
function ReportProblem({ onBack, onSubmit, defaultName = '', defaultEmail = '' }) {
  const [name, setName] = useState(defaultName),
    [email, setEmail] = useState(defaultEmail),
    [issue, setIssue] = useState(''),
    [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim() || !email.trim() || !issue.trim()) {
      Alert.alert('Complete the form', 'Enter your name, email and issue.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit?.({ name, email, message: issue });
      Alert.alert('Message sent', 'Thanks. Our support team will get back to you by email.', [
        { text: 'Done', onPress: onBack },
      ]);
    } catch (error) {
      Alert.alert('Could not send', error?.message || 'Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Header title="Report a problem" />
      <Input label="Name" value={name} onChangeText={setName} placeholder="Name" />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        keyboardType="email-address"
      />
      <Input
        label="Enter issue"
        value={issue}
        onChangeText={setIssue}
        placeholder="Tell us what happened"
        multiline
      />
      <View style={{ marginTop: 40 }}>
        <Button title={busy ? 'Sending…' : 'Send'} onPress={submit} />
      </View>
    </Shell>
  );
}
function ProfilePassword({ onBack, onSave }) {
  const [current, setCurrent] = useState(''),
    [next, setNext] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false);
  const save = async () => {
    if (!current || !next || next !== confirm || next.length < 8) {
      Alert.alert(
        'Check your passwords',
        'Enter your current password, use at least 8 characters for the new password, and make sure both new passwords match.',
      );
      return;
    }
    setBusy(true);
    try {
      await onSave?.({ current, next });
      Alert.alert('Password updated', 'Your password has been changed.', [
        { text: 'Continue', onPress: onBack },
      ]);
    } catch (error) {
      Alert.alert(
        'Could not update password',
        error?.message || 'Check your current password and try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Header title="Change password" />
      <Input label="Current password" value={current} onChangeText={setCurrent} secure />
      <Input label="New password" value={next} onChangeText={setNext} secure />
      <Input label="Confirm new password" value={confirm} onChangeText={setConfirm} secure />
      <Button title={busy ? 'Updating…' : 'Continue'} onPress={save} />
    </Shell>
  );
}
function ProfilePin({ isSet, currentPin, onBack, onSave }) {
  const [current, setCurrent] = useState(''),
    [next, setNext] = useState(''),
    [busy, setBusy] = useState(false);
  const save = async () => {
    if ((isSet && (current.length !== 4 || current !== currentPin)) || next.length !== 4) {
      Alert.alert('Check your PIN', 'Enter the correct current PIN and a new 4-digit PIN.');
      return;
    }
    setBusy(true);
    try {
      await onSave(next);
    } catch (error) {
      Alert.alert('Could not save PIN', error?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Header
        title="PIN settings"
        sub={isSet ? 'Update the PIN you use for withdrawals.' : 'Set a PIN to secure withdrawals.'}
      />
      {isSet && (
        <Input
          label="Current PIN"
          value={current}
          onChangeText={(value) => setCurrent(value.replace(/\D/g, '').slice(0, 4))}
          secure
          keyboardType="numeric"
          placeholder="Enter current PIN"
        />
      )}
      <Input
        label="New PIN"
        value={next}
        onChangeText={(value) => setNext(value.replace(/\D/g, '').slice(0, 4))}
        secure
        keyboardType="numeric"
        placeholder="Enter 4-digit PIN"
      />
      <Button title={busy ? 'Saving…' : 'Continue'} onPress={save} />
    </Shell>
  );
}
function ProfileDeleteLatest({ onBack, onContinue }) {
  return (
    <Shell back={onBack}>
      <Header title="Delete Account" />
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <TrashIcon size={64} color={C.red} />
        <Text style={{ fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 24 }}>
          Are you sure you want to delete this profile?
        </Text>
      </View>
      <View style={{ backgroundColor: C.paper, borderRadius: 17, padding: 16, marginTop: 31 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', marginBottom: 12 }}>Please Note:</Text>
        <View style={{ flexDirection: 'row' }}>
          <X size={17} color={C.red} />
          <Text style={{ fontSize: 12, lineHeight: 18, flex: 1, marginLeft: 10 }}>
            Deleting your PalGo profile does not delete your linked bank account.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <CheckCircle2 size={17} color={C.red} />
          <Text style={{ fontSize: 12, lineHeight: 18, flex: 1, marginLeft: 10 }}>
            You can create another profile whenever you return to the app.
          </Text>
        </View>
      </View>
      <View style={{ marginTop: 75 }}>
        <Button title="Delete Account" onPress={onContinue} />
      </View>
    </Shell>
  );
}
function ProfileDeleteReasonLatest({ onBack, onDelete }) {
  const [selected, setSelected] = useState('I have another errand app I prefer'),
    [busy, setBusy] = useState(false);
  const reasons = [
    'I have another errand app I prefer',
    'Poor customer service',
    'Security or privacy concerns',
    'I no longer need the account',
    'I created this account by mistake',
    'High fees or charges',
    'Limited features / missing services I need',
    'Other',
  ];
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete?.(selected);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Header title="Delete Account" />
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <TrashIcon size={52} color={C.red} />
      </View>
      <Text style={{ fontSize: 14, fontWeight: '800', marginTop: 23, marginBottom: 15 }}>
        What is the reason for deleting your Profile?
      </Text>
      {reasons.map((reason) => (
        <TouchableOpacity
          key={reason}
          onPress={() => setSelected(reason)}
          style={{
            height: 39,
            borderRadius: 18,
            backgroundColor: C.paper,
            marginBottom: 9,
            paddingHorizontal: 13,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 11, flex: 1 }}>{reason}</Text>
          <View
            style={{
              height: 16,
              width: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: selected === reason ? C.selected() : C.ink,
              backgroundColor: selected === reason ? C.selected() : C.paper,
            }}
          />
        </TouchableOpacity>
      ))}
      <View style={{ marginTop: 15 }}>
        <Button title={busy ? 'Deleting…' : 'Delete Account'} onPress={submit} />
      </View>
    </Shell>
  );
}
function ProfileDeleteSuccessLatest({ onDone }) {
  return (
    <Shell>
      <View style={{ alignItems: 'center', marginTop: 142 }}>
        <CheckCircle2 size={74} color={C.mint} fill={C.mint} />
        <Text style={{ fontSize: 25, fontWeight: '800', color: C.mint, marginTop: 22 }}>
          Profile Deleted
        </Text>
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 24 }}>
          Your profile has been deleted successfully.
        </Text>
      </View>
      <View style={{ height: 142 }} />
      <Button title="Okay" onPress={onDone} />
    </Shell>
  );
}
function PalProfileLatest({
  profileDetails = {},
  rating,
  onBack,
  onNavigate,
  onLogout,
  availableRoles = [],
  onBecomeRole,
  onSetting,
  onAvailability,
}) {
  const available = profileDetails.available !== false;
  const row = (label, target, toggle = false, onToggle, value) => (
    <ProfileRow
      Icon={ROW_ICONS[label]}
      label={label}
      target={target}
      toggle={toggle}
      value={value}
      onToggle={onToggle}
      onNavigate={onNavigate}
    />
  );
  const memberDate = profileDetails.memberSince
    ? new Date(profileDetails.memberSince).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '—';
  return (
    <Shell back={onBack}>
      <ProfileHeader photoUrl={profileDetails.photoUrl} />
      <View style={{ alignItems: 'center', marginBottom: 19 }}>
        <Text style={{ fontSize: 18, fontWeight: '800' }}>
          {profileDetails.name || 'Your profile'}
        </Text>
        {!!profileDetails.email && (
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{profileDetails.email}</Text>
        )}
        <ProfileRating rating={rating} />
        <AvailabilityBadge available={available} />
        <Text style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
          Member since {memberDate}
        </Text>
      </View>
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 3 }}>
        {row('Personal info', 'profile-personal')}
        {row('ID Verification', 'profile-id')}
        {row('Occupation / Skills', 'profile-skills')}
        {row('Availability', null, true, () => onAvailability?.(!available), available)}
      </View>
      <View style={{ height: 17 }} />
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 3 }}>
        {row('Language', 'profile-language')}
        {row('Password Settings', 'profile-password')}
        {row('PIN Settings', 'profile-pin')}
        {row('Themes', 'profile-theme')}
        {row(
          'Push Notification',
          null,
          true,
          () => onSetting?.('pushEnabled', profileDetails.pushEnabled === false),
          profileDetails.pushEnabled !== false,
        )}
        {row(
          'Email Notifications',
          null,
          true,
          () => onSetting?.('emailNotifications', profileDetails.emailNotifications === false),
          profileDetails.emailNotifications !== false,
        )}
      </View>
      <View style={{ height: 17 }} />
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 3 }}>
        {row('Privacy Policy', 'profile-privacy')}
        {row('Terms & Conditions', 'profile-terms')}
        {row('Support', 'profile-support')}
        {row('Report a problem', 'profile-report')}
        <ProfileRow label="Logout" onNavigate={onLogout} />
      </View>
      <DeleteProfileLink onPress={() => onNavigate('profile-delete')} />
      <RoleSwitchButton
        title={availableRoles.includes('user') ? 'Switch to User profile' : 'Become a User'}
        onPress={() => onBecomeRole?.('user')}
      />
    </Shell>
  );
}
function PalIdVerification({ idDetails = {}, verification = {}, onBack, onSave }) {
  const [idType, setIdType] = useState(idDetails.id || '');
  const [idNumber, setIdNumber] = useState(idDetails.idNumber || '');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(!idDetails.submitted);
  const [photo, setPhoto] = useState(null);
  useEffect(() => {
    setIdType(idDetails.id || '');
    setIdNumber(idDetails.idNumber || '');
    setEditing(!idDetails.submitted);
  }, [idDetails.id, idDetails.idNumber, idDetails.submitted]);
  const choices = ['NIN', 'Driver’s license', 'International passport'];
  const addPhoto = () =>
    Alert.alert('Update ID photo', 'Choose how to add the replacement ID photo.', [
      {
        text: 'Take a photo',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              'Camera permission needed',
              'Allow camera access in your phone settings to take a photo.',
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.85,
          });
          if (!result.canceled) setPhoto(result.assets?.[0] || null);
        },
      },
      {
        text: 'Choose from gallery',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.85,
          });
          if (!result.canceled) setPhoto(result.assets?.[0] || null);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  const save = async () => {
    if (!idType) {
      Alert.alert('Choose an ID type', 'Select the type of ID you submitted.');
      return;
    }
    if (!idNumber.trim()) {
      Alert.alert(
        'Enter the ID number',
        `Add your ${idType === 'NIN' ? 'NIN' : idType === 'Driver’s license' ? 'license' : 'passport'} number.`,
      );
      return;
    }
    if (editing && !photo && !idDetails.photoUri) {
      Alert.alert('Add the ID photo', 'Choose an ID photo before saving.');
      return;
    }
    try {
      await onSave?.({ id: idType, idNumber: idNumber.trim(), photo });
    } catch (error) {
      Alert.alert('Could not update ID', error?.message || 'Please try again.');
    }
  };
  return (
    <Shell back={onBack}>
      <Header title="ID Verification" />
      {idDetails.submitted && !editing ? (
        <View style={{ backgroundColor: C.paper, borderRadius: 17, padding: 17, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ShieldCheck size={22} color={C.warning} />
            <Text style={{ fontSize: 14, fontWeight: '800', marginLeft: 9 }}>ID submitted</Text>
            <View
              style={{
                marginLeft: 'auto',
                backgroundColor: C.soft('#FFF4D6'),
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#9A6900' }}>
                {verification.status === 'verified'
                  ? 'Verified'
                  : verification.status === 'rejected'
                    ? 'Needs update'
                    : 'Under review'}
              </Text>
            </View>
          </View>
          {idDetails.photoUri ? (
            <Image
              source={{ uri: idDetails.photoUri }}
              resizeMode="cover"
              style={{
                height: 160,
                width: '100%',
                borderRadius: 12,
                marginTop: 16,
                backgroundColor: C.canvas,
              }}
            />
          ) : (
            <View
              style={{
                height: 72,
                borderRadius: 12,
                marginTop: 16,
                backgroundColor: C.canvas,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ClipboardList size={19} color={C.blue} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue, marginLeft: 8 }}>
                ID photo uploaded
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 14 }}>
            Preferred ID type: {idType || 'Submitted during signup'}
          </Text>
          <Text style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            ID number: {idNumber || 'Not saved yet — update your ID to add it'}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: verification.status === 'verified' ? C.mint : C.warning,
              marginTop: 8,
            }}
          >
            Verification status:{' '}
            {verification.status === 'verified'
              ? 'Verified'
              : verification.status === 'rejected'
                ? 'Needs update'
                : 'Under review'}
          </Text>
          <Text style={{ fontSize: 11, color: C.muted, lineHeight: 17, marginTop: 10 }}>
            Your submitted ID is awaiting review. You can replace the document or correct its
            details below.
          </Text>
          <View style={{ marginTop: 16 }}>
            <Button kind="outline" title="Update ID" onPress={() => setEditing(true)} />
          </View>
        </View>
      ) : (
        <View style={{ backgroundColor: C.paper, borderRadius: 17, padding: 17, marginTop: 10 }}>
          <Text style={s.label}>Preferred ID type</Text>
          <TouchableOpacity
            onPress={() => setOpen(true)}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: C.canvas,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 14, color: idType ? C.ink : C.muted, flex: 1 }}>
              {idType || 'Select an ID type'}
            </Text>
            <ChevronDown size={18} color={C.muted} />
          </TouchableOpacity>
          {!!idType && (
            <Input
              label={
                idType === 'NIN'
                  ? 'NIN number'
                  : idType === 'Driver’s license'
                    ? 'License number'
                    : 'Passport number'
              }
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder="Enter ID number"
              autoCapitalize="characters"
            />
          )}
          <Text style={[s.label, { marginTop: 14 }]}>Upload valid ID</Text>
          <TouchableOpacity
            onPress={addPhoto}
            style={{
              minHeight: 142,
              borderRadius: 17,
              backgroundColor: C.canvas,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 15,
            }}
          >
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                resizeMode="cover"
                style={{ width: '100%', height: 130, borderRadius: 12 }}
              />
            ) : idDetails.photoUri ? (
              <Image
                source={{ uri: idDetails.photoUri }}
                resizeMode="cover"
                style={{ width: '100%', height: 130, borderRadius: 12 }}
              />
            ) : (
              <>
                <ClipboardList size={34} color={C.blue} />
                <Text style={{ fontSize: 13, fontWeight: '800', marginTop: 12 }}>
                  Tap to upload ID photo
                </Text>
                <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 7 }}>
                  Choose from your gallery or take a photo.
                </Text>
              </>
            )}
          </TouchableOpacity>
          {photo && (
            <TouchableOpacity
              onPress={() => setPhoto(null)}
              style={{ alignSelf: 'flex-end', padding: 10 }}
            >
              <Text style={{ fontSize: 12, color: C.red, fontWeight: '700' }}>
                Remove selected photo
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 20 }} />
          <Button title="Save ID update" onPress={save} />
        </View>
      )}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: 28,
            backgroundColor: 'rgba(0,0,0,.4)',
          }}
        >
          <View style={{ backgroundColor: C.paper, borderRadius: 20, padding: 18 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 9 }}>
              Select preferred ID
            </Text>
            {choices.map((choice) => (
              <TouchableOpacity
                key={choice}
                onPress={() => {
                  setIdType(choice);
                  setIdNumber('');
                  setOpen(false);
                }}
                style={{
                  minHeight: 48,
                  justifyContent: 'center',
                  borderBottomWidth: 1,
                  borderColor: C.line,
                }}
              >
                <Text style={{ fontSize: 14 }}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Shell>
  );
}
function PalMultiSelect({
  title,
  options,
  onBack,
  onSave,
  initialSelected = [],
  initialOther = '',
}) {
  const [selected, setSelected] = useState(initialSelected),
    [other, setOther] = useState(initialOther),
    [busy, setBusy] = useState(false);
  const initialKey = JSON.stringify(initialSelected);
  useEffect(() => {
    setSelected(JSON.parse(initialKey));
    setOther(initialOther);
    // Keyed by content so a fresh empty array on every render cannot re-trigger it.
  }, [initialKey, initialOther]);
  const hasOthers = options.includes('Others') && selected.includes('Others');
  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onSave?.(selected, other);
      if (!onSave) onBack?.();
    } catch (error) {
      Alert.alert('Could not save', error?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell back={onBack}>
      <Header title={title} />
      <View style={{ backgroundColor: C.paper, borderRadius: 16, paddingVertical: 4 }}>
        {options.map((item) => {
          const on = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setSelected((v) => (on ? v.filter((x) => x !== item) : [...v, item]))}
              style={{
                minHeight: 42,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, flex: 1 }}>{item}</Text>
              <View
                style={{
                  height: 16,
                  width: 16,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: on ? C.selected() : C.blue,
                  backgroundColor: on ? C.selected() : C.paper,
                }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      {hasOthers && (
        <View style={{ marginTop: 16 }}>
          <Input
            label="Other service"
            value={other}
            onChangeText={setOther}
            placeholder="Add another service"
          />
        </View>
      )}
      <View style={{ marginTop: 30 }}>
        <Button title={busy ? 'Saving…' : 'Save'} onPress={save} />
      </View>
    </Shell>
  );
}
function ProfileTerms({ onBack, title = 'Terms & Conditions' }) {
  const sections = title === 'Privacy Policy' ? PRIVACY : TERMS;
  return (
    <Shell back={onBack}>
      <Header title={title} />
      <Text style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{LEGAL_UPDATED}</Text>
      <View style={{ backgroundColor: C.paper, borderRadius: 16, padding: 18 }}>
        {sections.map(([heading, body]) => (
          <View key={heading} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', marginBottom: 5 }}>{heading}</Text>
            <Text style={{ fontSize: 13, lineHeight: 20, color: C.muted }}>{body}</Text>
          </View>
        ))}
      </View>
    </Shell>
  );
}
function LanguageSelect({ onBack, language = 'en', onChange }) {
  return (
    <Shell back={onBack}>
      <Header title="Language" />
      <Text style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Choose your language</Text>
      {LANGUAGES.map((item) => (
        <Choice
          key={item.code}
          label={item.label}
          selected={language === item.code}
          onPress={() => onChange?.(item.code)}
        />
      ))}
    </Shell>
  );
}

export {
  ProfileHeader,
  ProfileRow,
  ProfileRating,
  ProfileFlowFinal,
  PersonalInformation,
  ProfileEdit,
  ProfileTheme,
  ProfileSupportLatest,
  ReportProblem,
  ProfilePassword,
  ProfilePin,
  ProfileDeleteLatest,
  ProfileDeleteReasonLatest,
  ProfileDeleteSuccessLatest,
  PalProfileLatest,
  PalIdVerification,
  PalMultiSelect,
  ProfileTerms,
  LanguageSelect,
};
