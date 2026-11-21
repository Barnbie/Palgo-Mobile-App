import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { GradientButton } from '../../components/GradientButton';
import { PAL_SKILL_OPTIONS, parseList } from '../../config/skills';
import { getCurrentPlace } from '../../lib/currentLocation';
import { PotIcon } from '../../components/icons';
import { Text } from '../../components/ThemedText';
import {
  Bike,
  ChevronLeft,
  ClipboardPenLine,
  Eye,
  EyeOff,
  ImagePlus,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Package,
  ShoppingBasket,
  Sparkles,
  Star,
  Trash2,
  Wrench,
  X,
} from '../../components/glyphs';
import * as Shared from '../../AppComponents';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { colors as C } from '../../theme';
import { onboardingSlideImages, palgoBackgrounds } from '../../assets';
import {
  CameraIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  SuccessBadge,
} from '../../components/icons';
import { RaisedField, RaisedTextInput } from '../../components/Input3D';

const {
  Logo,
  s,
  a,

  Button,
  Header,

  Shell,
  OnboardingFlow,
  Onboarding,
  Entry,
  RolePicker,
  SignUp,

  Input,

  ImagePlaceholder,
} = Shared;

function AuthBackground({ variant, children }) {
  const source = palgoBackgrounds[variant];
  const content = (
    <>
      {!source && (
        <View pointerEvents="none" style={a.backgroundPlaceholder}>
          <Text style={a.backgroundPlaceholderText}>
            {variant === 'onboarding'
              ? 'ONBOARDING BACKGROUND IMAGE'
              : 'AUTHENTICATION BACKGROUND IMAGE'}
          </Text>
          <Text style={a.placeholderNote}>Set this in src/assets.js</Text>
        </View>
      )}
      {children}
    </>
  );
  return source ? (
    <ImageBackground source={source} resizeMode="cover" style={a.authCanvas}>
      {content}
    </ImageBackground>
  ) : (
    <View style={a.authCanvas}>{content}</View>
  );
}
function Splash({ onStart }) {
  useEffect(() => {
    const timer = setTimeout(onStart, 2200);
    return () => clearTimeout(timer);
  }, [onStart]);
  return (
    <View style={a.splash}>
      <Logo variant="splash" style={{ height: 70, width: 195 }} />
    </View>
  );
}
function AuthInput({ Icon, label, value, onChangeText, secure, raised = false }) {
  const [show, setShow] = useState(false);
  if (raised) {
    const Leading = secure ? LockIcon : MailIcon;
    const EyeShape = show ? EyeIcon : EyeOffIcon;
    return (
      <RaisedField glass>
        <Leading size={20} color="#4A5563" />
        <RaisedTextInput
          glass
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !show}
          placeholder={label}
          autoCapitalize="none"
          style={{ marginLeft: 8 }}
        />
        {secure && (
          <TouchableOpacity
            accessibilityLabel="Show or hide password"
            onPress={() => setShow(!show)}
          >
            <EyeShape size={20} color="#4A5563" />
          </TouchableOpacity>
        )}
      </RaisedField>
    );
  }
  return (
    <View style={a.authField}>
      <Icon size={17} color={C.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure && !show}
        placeholder={label}
        placeholderTextColor="#9AA4BC"
        style={a.authInput}
      />
      {secure && (
        <TouchableOpacity onPress={() => setShow(!show)}>
          {show ? <EyeOff size={17} color={C.muted} /> : <Eye size={17} color={C.muted} />}
        </TouchableOpacity>
      )}
    </View>
  );
}
function Login({ role, onBack, onLogin, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [rememberMe, setRememberMe] = useState(true);
  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Enter your login details', 'Add your email address and password to continue.');
      return;
    }
    setBusy(true);
    try {
      await onLogin({ role: role || 'user', email, password, rememberMe });
    } catch (error) {
      Alert.alert('Login failed', error?.message || 'Please check your details and try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthBackground variant="authentication">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 166 }}>
          <TouchableOpacity onPress={onBack} style={[a.authBack, { top: 70 }]}>
            <ChevronLeft size={18} color={C.ink} />
          </TouchableOpacity>
          <View style={a.authHead}>
            <Text style={a.authTitle}>Login</Text>
            <Text style={a.authCopy}>Enter your email and password to access your account.</Text>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 50 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
          >
            <AuthInput
              raised
              Icon={Mail}
              label="Email Address"
              value={email}
              onChangeText={setEmail}
            />
            <AuthInput
              raised
              Icon={LockKeyhole}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secure
            />
            <View style={a.remember}>
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
                onPress={() => setRememberMe((value) => !value)}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <View
                  style={[
                    a.checkBox,
                    rememberMe && {
                      backgroundColor: C.mint,
                      borderColor: C.mint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  {rememberMe && (
                    <Text
                      style={{ fontSize: 10, lineHeight: 12, color: C.white, fontWeight: '800' }}
                    >
                      ✓
                    </Text>
                  )}
                </View>
                <Text style={a.termsText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert('Forgot password', 'Password recovery will be available soon.')
                }
              >
                <Text style={a.forgot}>Forgot Password</Text>
              </TouchableOpacity>
            </View>
            <GradientButton
              tone="blue"
              disabled={busy}
              style={[a.pillPrimary, { height: 40, borderRadius: 20, opacity: busy ? 0.65 : 1 }]}
              onPress={submit}
            >
              <Text style={a.pillPrimaryText}>{busy ? 'Logging in…' : 'Login'}</Text>
            </GradientButton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}
function CreateCategoryFinal({ form, setForm, onBack, onContinue }) {
  const choices = [
    ['Grocery', ShoppingBasket],
    ['Pickup', Package],
    ['Delivery', Bike],
    ['General errand', ClipboardPenLine],
    ['Cleaning', Sparkles],
    ['Repairs', Wrench],
    ['Styling', Star],
    ['Cooking', PotIcon],
    ['Others', MoreHorizontal],
  ];
  return (
    <Shell back={onBack}>
      <Header title="What do you need done?" sub="Choose the type of errand or service." />
      <View style={s.grid}>
        {choices.map(([name, Icon]) => {
          const selected = form.category === name;
          return (
            <TouchableOpacity
              key={name}
              onPress={() => setForm({ ...form, category: name })}
              style={{
                width: '48.5%',
                height: 110,
                backgroundColor: selected ? C.selected() : C.paper,
                borderRadius: 18,
                padding: 15,
                marginBottom: 12,
                justifyContent: 'space-between',
                shadowColor: '#7180A5',
                shadowOpacity: 0.18,
                shadowRadius: 9,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <Icon size={26} color={selected ? C.white : C.blue} strokeWidth={2.3} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: selected ? C.white : C.ink }}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Button title="Continue" onPress={onContinue} />
    </Shell>
  );
}
function CreateErrandFormFinal({ form, setForm, onBack, onSubmit }) {
  const [locating, setLocating] = useState(false);
  const valid =
    !!form.title?.trim() &&
    !!form.description?.trim() &&
    !!form.location?.trim() &&
    Number(form.fee) >= 2000;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 52 : 0}
    >
      <Shell back={onBack}>
        <Header
          title="Tell us about your errand."
          sub="Add the details so a Pal can understand and respond."
        />
        <Input
          label="Errand name *"
          placeholder="e.g. Car wash at my home"
          value={form.title}
          onChangeText={(title) => setForm({ ...form, title })}
        />
        <Input
          label="Add details *"
          placeholder="Tell your Pal what you need"
          value={form.description}
          onChangeText={(description) => setForm({ ...form, description })}
          multiline
        />
        <Input
          label="Your location *"
          placeholder="Street, area, city and state, or tap Use current location"
          value={form.location}
          onChangeText={(location) => setForm({ ...form, location, area: '', state: '' })}
        />
        <Button
          kind="outline"
          small
          title={locating ? 'Finding you…' : 'Use current location'}
          onPress={async () => {
            if (locating) return;
            setLocating(true);
            try {
              const place = await getCurrentPlace();
              setForm({
                ...form,
                location: place.location || form.location,
                area: place.area,
                state: place.state,
              });
            } catch (error) {
              Alert.alert('Could not get your location', error?.message || 'Please try again.');
            } finally {
              setLocating(false);
            }
          }}
        />
        <View style={{ height: 13 }} />
        <Input
          label="Choose time (optional)"
          placeholder="e.g. Today, 12:30 PM"
          value={form.schedule === 'Now' ? '' : form.schedule}
          onChangeText={(schedule) => setForm({ ...form, schedule })}
        />
        <Input
          label="Estimated errand time (optional)"
          placeholder="e.g. 30 minutes"
          value={form.estimatedTime || ''}
          onChangeText={(estimatedTime) => setForm({ ...form, estimatedTime })}
        />
        <Input
          label="Errand budget (minimum ₦2,000) *"
          placeholder="e.g. 5,000"
          keyboardType="numeric"
          value={String(form.fee || '')}
          onChangeText={(fee) => setForm({ ...form, fee: fee.replace(/[^0-9]/g, '') })}
        />
        <Input
          label="Special notes (optional)"
          placeholder="Any extra instructions"
          multiline
          value={form.notes || ''}
          onChangeText={(notes) => setForm({ ...form, notes })}
        />
        <View style={{ height: 8 }} />
        <Button
          title="Proceed"
          onPress={
            valid
              ? onSubmit
              : () =>
                  Alert.alert(
                    'Complete the required details',
                    'Add the errand name, details, location and a budget of at least ₦2,000.',
                  )
          }
        />
      </Shell>
    </KeyboardAvoidingView>
  );
}
function FlowField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  onPress,
  secure = false,
  showSecureText = false,
  onToggleSecure,
  keyboardType,
  autoCapitalize,
  glass = false,
}) {
  const box = (
    <RaisedField glass={glass} multiline={multiline} style={{ marginBottom: 0 }}>
      <RaisedTextInput
        glass={glass}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || label}
        multiline={multiline}
        secureTextEntry={secure && !showSecureText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        autoCorrect={false}
      />
      {secure && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={showSecureText ? 'Hide password' : 'Show password'}
          onPress={onToggleSecure}
          hitSlop={10}
          style={{ padding: 8, marginRight: -8 }}
        >
          {showSecureText ? (
            <EyeOffIcon size={20} color={glass ? '#4A5563' : C.muted} />
          ) : (
            <Eye size={19} color={C.muted} />
          )}
        </TouchableOpacity>
      )}
    </RaisedField>
  );
  return (
    <View style={{ width: '100%', marginBottom: 15 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 7 }}>{label}</Text>
      {onPress ? <TouchableOpacity onPress={onPress}>{box}</TouchableOpacity> : box}
    </View>
  );
}
function RegistrationFlow({ role, onBack, onContinue, onLogin, initialValues = {} }) {
  const pal = role === 'pal';
  const [birth, setBirth] = useState(initialValues.birth || ''),
    [gender, setGender] = useState(initialValues.gender || ''),
    [calendar, setCalendar] = useState(false),
    [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [values, setValues] = useState({
    name: initialValues.name || '',
    email: initialValues.email || '',
    phone: initialValues.phone || '',
    password: initialValues.password || '',
    confirmPassword: initialValues.confirmPassword || '',
  });
  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }));
  const emailIsValid = /^\S+@\S+\.\S+$/.test(values.email.trim());
  const phoneDigits = values.phone.replace(/\D/g, '');
  const phoneIsValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;
  const ready =
    !!values.name.trim() &&
    emailIsValid &&
    !!values.password &&
    values.password === values.confirmPassword &&
    acceptedTerms &&
    phoneIsValid &&
    (!pal || (!!birth && !!gender));
  const submit = async () => {
    const name = values.name.trim(),
      email = values.email.trim();
    if (
      !acceptedTerms ||
      !name ||
      !email ||
      !values.password ||
      !values.confirmPassword ||
      values.password !== values.confirmPassword ||
      !emailIsValid ||
      !phoneIsValid
    )
      return;
    setLoading(true);
    try {
      await onContinue({
        name,
        email,
        password: values.password,
        phone: values.phone,
        birth,
        gender,
      });
    } catch (error) {
      Alert.alert('Sign-up failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const dateValue = birth ? new Date(`${birth}T12:00:00`) : new Date(2000, 0, 1);
  const dateText = birth
    ? dateValue.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const openBirthDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate)
            setBirth(
              `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
            );
        },
      });
      return;
    }
    setCalendar(true);
  };
  return (
    <AuthBackground variant="authentication">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 166, paddingBottom: 12 }}>
          <TouchableOpacity onPress={onBack} style={[a.authBack, { top: 70 }]}>
            <ChevronLeft size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={a.authTitle}>Create Account</Text>
          <Text style={[a.authCopy, { textAlign: 'left', marginBottom: 25 }]}>
            Create a new account to get started and enjoy seamless access to our features.
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 38 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
          >
            <FlowField
              glass
              label="Full name"
              value={values.name}
              onChange={(v) => set('name', v)}
            />
            <FlowField
              glass
              label="Email"
              value={values.email}
              onChange={(v) => set('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FlowField
              glass
              label="Phone number"
              value={values.phone}
              onChange={(v) => set('phone', v)}
              keyboardType="phone-pad"
            />
            {pal && (
              <>
                <View style={{ width: '100%', marginBottom: 15 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 7 }}>
                    Date of birth
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Choose date of birth"
                    onPress={openBirthDatePicker}
                    activeOpacity={0.75}
                  >
                    <RaisedField glass style={{ marginBottom: 0 }}>
                      <Text style={{ fontSize: 14, color: dateText ? '#16202E' : '#5F6B7A' }}>
                        {dateText || 'Select date of birth'}
                      </Text>
                    </RaisedField>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 7 }}>Gender</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
                  {['Male', 'Female'].map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => setGender(item)}
                      style={{
                        height: 40,
                        flex: 1,
                        borderRadius: 20,
                        backgroundColor: gender === item ? C.selected() : C.paper,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: gender === item ? C.white : C.ink,
                          fontWeight: '700',
                        }}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <FlowField
              glass
              label="Password"
              value={values.password}
              onChange={(v) => set('password', v)}
              placeholder="Create password"
              secure
              autoCapitalize="none"
              showSecureText={showPassword}
              onToggleSecure={() => setShowPassword((v) => !v)}
            />
            <FlowField
              glass
              label="Confirm password"
              value={values.confirmPassword}
              onChange={(v) => set('confirmPassword', v)}
              placeholder="Confirm password"
              secure
              autoCapitalize="none"
              showSecureText={showConfirmPassword}
              onToggleSecure={() => setShowConfirmPassword((v) => !v)}
            />
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptedTerms }}
              onPress={() => setAcceptedTerms((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 9,
                marginVertical: 7,
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  height: 18,
                  width: 18,
                  borderWidth: 1.5,
                  borderColor: acceptedTerms ? C.mint : C.muted,
                  borderRadius: 4,
                  backgroundColor: acceptedTerms ? C.mint : C.paper,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {acceptedTerms && (
                  <Text style={{ fontSize: 13, fontWeight: '900', color: C.white, lineHeight: 16 }}>
                    ✓
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 11, flex: 1, color: C.muted, lineHeight: 16 }}>
                I agree to the Terms &amp; Conditions and Privacy Policy
              </Text>
            </TouchableOpacity>
            <GradientButton
              tone="blue"
              disabled={!ready || loading}
              style={[
                a.pillPrimary,
                {
                  height: 40,
                  borderRadius: 20,
                  marginTop: 15,
                  opacity: ready && !loading ? 1 : 0.45,
                },
              ]}
              onPress={submit}
            >
              <Text style={a.pillPrimaryText}>{loading ? 'Creating account…' : 'Sign Up'}</Text>
            </GradientButton>
            <TouchableOpacity onPress={onLogin}>
              <Text style={a.authLink}>
                Have an account? <Text style={a.linkText}>Sign In Here</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        <Modal
          transparent
          visible={calendar && Platform.OS === 'ios'}
          animationType="fade"
          onRequestClose={() => setCalendar(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,.35)',
            }}
          >
            <View
              style={{
                backgroundColor: C.paper,
                borderRadius: 18,
                padding: 16,
                marginHorizontal: 24,
                alignItems: 'center',
              }}
            >
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(_, selectedDate) => {
                  if (selectedDate)
                    setBirth(
                      `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
                    );
                }}
              />
              <TouchableOpacity onPress={() => setCalendar(false)} style={{ padding: 12 }}>
                <Text style={{ color: C.blue, fontWeight: '800' }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

function UserEmailConfirmation({ email, onBack, onVerify, onResend }) {
  const [busy, setBusy] = useState(false),
    [token, setToken] = useState(''),
    [focused, setFocused] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const cellSize = Math.min(48, Math.max(30, Math.floor((screenWidth - 90) / 6)));
  const activeIndex = Math.min(token.length, 5);
  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      if (successMessage) Alert.alert('Email confirmation', successMessage);
    } catch (error) {
      Alert.alert('Email confirmation', error?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthBackground variant="authentication">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <View style={{ flex: 1, paddingHorizontal: 30, paddingTop: 170, paddingBottom: 16 }}>
          <TouchableOpacity onPress={onBack} style={a.authBack}>
            <ChevronLeft size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={a.authTitle}>Verify your email</Text>
          <Text style={[a.authCopy, { marginBottom: 24 }]}>
            Enter the 6-digit code we sent to {email}.
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
          >
            <View
              style={{ width: '100%', height: cellSize, marginBottom: 20, position: 'relative' }}
            >
              <View
                pointerEvents="none"
                style={{
                  width: '100%',
                  height: cellSize,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {Array.from({ length: 6 }, (_, index) => (
                  <View
                    key={index}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: cellSize / 2,
                      borderWidth: 2,
                      borderColor: focused && index === activeIndex ? C.blue : C.line,
                      backgroundColor: C.paper,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>
                      {token[index] || ''}
                    </Text>
                  </View>
                ))}
              </View>
              <TextInput
                value={token}
                onChangeText={(value) => setToken(value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                accessibilityLabel="Six-digit email verification code"
                caretHidden
                selectionColor="transparent"
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  opacity: 0.02,
                  color: 'transparent',
                  backgroundColor: 'transparent',
                  fontSize: 18,
                }}
              />
            </View>
            <GradientButton
              tone="blue"
              disabled={busy || token.length !== 6}
              style={[
                a.pillPrimary,
                { height: 44, borderRadius: 22, opacity: busy || token.length !== 6 ? 0.45 : 1 },
              ]}
              onPress={() => run(() => onVerify(token))}
            >
              <Text style={a.pillPrimaryText}>{busy ? 'Verifying…' : 'Verify email'}</Text>
            </GradientButton>
            <TouchableOpacity
              disabled={busy}
              style={{ marginTop: 20, padding: 10 }}
              onPress={() => run(onResend, 'A new verification code has been sent.')}
            >
              <Text style={{ color: C.blue, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>
                Resend code
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}
function UserEmailVerified({ onContinue }) {
  return (
    <AuthBackground variant="authentication">
      <View style={[a.authScreen, { flex: 1, justifyContent: 'center', paddingTop: 70 }]}>
        <SuccessBadge size={92} />
        <Text style={[a.authTitle, { marginTop: 22 }]}>Email verified</Text>
        <Text style={[a.authCopy, { marginBottom: 28 }]}>
          Your email address is confirmed. Your account is ready.
        </Text>
        <GradientButton
          tone="blue"
          style={[a.pillPrimary, { height: 44, borderRadius: 22 }]}
          onPress={onContinue}
        >
          <Text style={a.pillPrimaryText}>Continue</Text>
        </GradientButton>
      </View>
    </AuthBackground>
  );
}
function PalVerification({ onBack, onNext, initialValue = {} }) {
  const [id, setId] = useState(initialValue.id || '');
  const [idNumber, setIdNumber] = useState(initialValue.idNumber || '');
  const [address, setAddress] = useState(initialValue.address || '');
  const [city, setCity] = useState(initialValue.city || '');
  const [state, setState] = useState(initialValue.state || '');
  const [profilePhoto, setProfilePhoto] = useState(initialValue.profilePhoto || null);
  const [idPhoto, setIdPhoto] = useState(initialValue.idPhoto || null);
  const [uploading, setUploading] = useState('');
  const idNumberLabel =
    id === 'NIN'
      ? 'NIN number'
      : id === 'Driver’s license'
        ? 'License number'
        : id === 'International passport'
          ? 'Passport number'
          : '';
  const choosePhoto = async (setPhoto) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) setPhoto(result.assets[0]);
  };
  const takePhoto = async (setPhoto) => {
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
    if (!result.canceled && result.assets?.[0]) setPhoto(result.assets[0]);
  };
  const selectPhoto = (setter) =>
    Alert.alert('Add a photo', 'Choose how you want to add this photo.', [
      { text: 'Take a photo', onPress: () => takePhoto(setter) },
      { text: 'Choose from gallery', onPress: () => choosePhoto(setter) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  const PhotoUpload = ({ title, photo, onPick, onClear, profile = false }) => (
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      {photo ? (
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: photo.uri }}
            resizeMode="cover"
            style={{
              height: profile ? 94 : 150,
              width: profile ? 94 : '100%',
              aspectRatio: profile ? 1 : 1.6,
              borderRadius: profile ? 47 : 16,
              backgroundColor: C.paper,
            }}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Clear ${title}`}
            onPress={onClear}
            style={{
              position: 'absolute',
              right: -8,
              top: -8,
              height: 34,
              width: 34,
              borderRadius: 17,
              backgroundColor: C.paper,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 3,
            }}
          >
            <X size={18} color={C.red} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onPick}
          activeOpacity={0.75}
          style={{
            width: profile ? 170 : '100%',
            minHeight: profile ? 124 : 138,
            borderRadius: profile ? 18 : 18,
            backgroundColor: C.paper,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            borderWidth: 1,
            borderColor: C.line,
            borderStyle: 'dashed',
          }}
        >
          {profile ? <ImagePlaceholder size={72} profile /> : <CameraIcon size={38} />}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 }}>
            <ImagePlus size={17} color={C.blue} />
            <Text style={{ fontSize: 13, fontWeight: '800', color: C.blue }}>{title}</Text>
          </View>
          {!profile && (
            <Text style={{ fontSize: 10, color: C.muted, marginTop: 5 }}>
              Tap to choose from camera or gallery
            </Text>
          )}
        </TouchableOpacity>
      )}
      {photo && (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: C.mint }}>Upload complete</Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 10, color: C.muted, marginTop: 3, maxWidth: 260 }}
          >
            {photo.fileName || 'Photo selected'}
          </Text>
          <TouchableOpacity
            onPress={onClear}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }}
          >
            <Trash2 size={15} color={C.red} />
            <Text style={{ fontSize: 12, color: C.red, fontWeight: '700' }}>Clear upload</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  const continueVerification = () => {
    if (
      !profilePhoto ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !id ||
      !idNumber.trim() ||
      !idPhoto
    ) {
      Alert.alert(
        'Complete your verification details',
        'Add your profile photo, address, city, state, ID type and number, and a photo of your valid ID.',
      );
      return;
    }
    onNext?.({ id, idNumber, address, city, state, profilePhoto, idPhoto });
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <Shell back={onBack} scroll={false}>
        <View style={{ flex: 1 }}>
          <Header title="Verification process" sub="Complete your profile and ID verification." />
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
          >
            <PhotoUpload
              title={uploading === 'profile' ? 'Uploading…' : 'Upload profile image'}
              photo={profilePhoto}
              onPick={() => {
                setUploading('profile');
                selectPhoto(setProfilePhoto);
                setUploading('');
              }}
              onClear={() => setProfilePhoto(null)}
              profile
            />
            <FlowField
              label="Full address"
              value={address}
              onChange={setAddress}
              placeholder="House number, street, estate / area"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FlowField label="City" value={city} onChange={setCity} placeholder="Enter city" />
              </View>
              <View style={{ flex: 1 }}>
                <FlowField
                  label="State"
                  value={state}
                  onChange={setState}
                  placeholder="Enter state"
                />
              </View>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 7 }}>
              Preferred ID type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {['NIN', 'Driver’s license', 'International passport'].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setId(item);
                    setIdNumber('');
                  }}
                  style={{
                    height: 40,
                    borderRadius: 20,
                    paddingHorizontal: 13,
                    backgroundColor: id === item ? C.selected() : C.paper,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, color: id === item ? C.white : C.ink }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {!!id && (
              <FlowField
                label={idNumberLabel}
                value={idNumber}
                onChange={setIdNumber}
                placeholder={`Enter ${idNumberLabel.toLowerCase()}`}
                autoCapitalize="characters"
              />
            )}
            <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 7 }}>
              Upload valid ID
            </Text>
            <PhotoUpload
              title={uploading === 'id' ? 'Uploading…' : 'Tap to upload ID photo'}
              photo={idPhoto}
              onPick={() => {
                setUploading('id');
                selectPhoto(setIdPhoto);
                setUploading('');
              }}
              onClear={() => setIdPhoto(null)}
            />
            <View style={{ height: 22 }} />
            <Button title="Next" onPress={continueVerification} />
          </ScrollView>
        </View>
      </Shell>
    </KeyboardAvoidingView>
  );
}
function PalOccupation({ onBack, onNext, initialValue = {} }) {
  const [occupation, setOccupation] = useState(initialValue.occupation || '');
  const [experience, setExperience] = useState(initialValue.experience || '');
  const [otherServices, setOtherServices] = useState(initialValue.otherServices || '');
  const [selected, setSelected] = useState(initialValue.selected || []);
  const [otherService, setOtherService] = useState(initialValue.otherService || '');
  const [about, setAbout] = useState(initialValue.about || '');
  const [areas, setAreas] = useState((initialValue.serviceAreas || []).join(', '));
  const services = PAL_SKILL_OPTIONS;
  const toggle = (item) =>
    setSelected((value) =>
      value.includes(item) ? value.filter((x) => x !== item) : [...value, item],
    );
  const continueSetup = () => {
    if (selected.length === 0 || !about.trim()) {
      Alert.alert(
        'Complete your work profile',
        'Choose at least one errand you want to do, and write a short About me.',
      );
      return;
    }
    onNext?.({
      occupation,
      experience,
      otherServices,
      selected,
      otherService,
      about,
      serviceAreas: parseList(areas),
    });
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
    >
      <Shell back={onBack} scroll={false}>
        <View style={{ flex: 1 }}>
          <Header
            title="Occupation & experience"
            sub="Tell us about the services you can provide."
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
          >
            <FlowField
              label="Occupation / skill set (optional)"
              value={occupation}
              onChange={setOccupation}
              placeholder="e.g. Errand shopper, driver, delivery"
            />
            <FlowField
              label="Years of experience"
              value={experience}
              onChange={setExperience}
              placeholder="e.g. 2 years"
              keyboardType="number-pad"
            />
            <FlowField
              label="Other preferred services (optional)"
              value={otherServices}
              onChange={setOtherServices}
              placeholder="Add any other services you offer"
            />
            <Text style={{ fontSize: 13, fontWeight: '700', marginBottom: 9 }}>
              Preferred service type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {services.map((item) => (
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected.includes(item) }}
                  key={item}
                  onPress={() => toggle(item)}
                  style={{
                    height: 34,
                    borderRadius: 17,
                    paddingHorizontal: 11,
                    backgroundColor: selected.includes(item) ? C.mint : C.paper,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, color: selected.includes(item) ? C.white : C.ink }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selected.includes('Others') && (
              <FlowField
                label="Other service"
                value={otherService}
                onChange={setOtherService}
                placeholder="Enter other service"
              />
            )}
            <FlowField
              label="Areas you work in"
              value={areas}
              onChange={setAreas}
              placeholder="e.g. Amuwo Odofin, Festac"
            />
            <FlowField
              label={`About me (${about.length}/1,000) *`}
              value={about}
              onChange={(value) => setAbout(value.slice(0, 1000))}
              multiline
              placeholder="Tell users about your experience"
            />
            <Button title="Next" onPress={continueSetup} />
          </ScrollView>
        </View>
      </Shell>
    </KeyboardAvoidingView>
  );
}
function OnboardingFlowFinal({ page, onNext, onBack, onChoose }) {
  const { width: screenWidth } = useWindowDimensions();
  const wide = screenWidth >= 600;
  const titles = [
    'Payments Are Safe.',
    'All Runners Are Verified.',
    'All Runners Are Tracked In Real-Time.',
  ];
  const illustration = onboardingSlideImages[page - 1];
  const back = (
    <TouchableOpacity
      style={{
        paddingTop: 12,
        paddingBottom: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
      }}
      onPress={() => onBack(page)}
    >
      <ChevronLeft size={16} color={C.white} />
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.white }}>Back</Text>
    </TouchableOpacity>
  );
  const lightButton = [
    a.pillPrimary,
    { backgroundColor: C.canvas, borderColor: C.blue, shadowColor: '#1746BC' },
  ];
  const lightButtonText = [a.pillPrimaryText, { color: C.blue }];
  return (
    <AuthBackground variant="onboarding">
      <View style={[a.onboardContent, { flex: 1, paddingTop: wide ? 120 : 70 }]}>
        <Logo />
        <View style={[a.onboardMiddle, { flex: 1, justifyContent: 'center', paddingBottom: 150 }]}>
          <View
            style={[
              a.imagePlaceholder,
              { height: 247, width: 247, marginTop: 0, marginBottom: 43 },
            ]}
          >
            {illustration ? (
              <Image source={illustration} resizeMode="contain" style={a.onboardImage} />
            ) : (
              <Text style={a.placeholderLabel}>ONBOARDING IMAGE</Text>
            )}
          </View>
          <Text style={a.onboardTitle}>{titles[page - 1]}</Text>
          <View style={[a.dots, { marginTop: 43 }]}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[a.dot, n === page && a.dotOn]} />
            ))}
          </View>
        </View>
      </View>
      <View style={a.onboardFooter}>
        {page < 3 ? (
          <>
            <TouchableOpacity style={lightButton} onPress={() => onNext(page)}>
              <Text style={lightButtonText}>Next</Text>
            </TouchableOpacity>
            {page > 1 && back}
          </>
        ) : (
          <>
            <View style={a.entryButtons}>
              <TouchableOpacity
                style={[lightButton, a.pillOnboardChoice]}
                onPress={() => onChoose('signup')}
              >
                <Text style={lightButtonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[lightButton, a.pillOnboardChoice]}
                onPress={() => onChoose('login')}
              >
                <Text style={lightButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
            {back}
          </>
        )}
      </View>
    </AuthBackground>
  );
}
function RolePickerFinal({ onPick, onDismiss }) {
  const { width: screenWidth } = useWindowDimensions();
  const wide = screenWidth >= 600;
  const illustration = onboardingSlideImages[2];
  return (
    <AuthBackground variant="onboarding">
      <View style={[a.onboardContent, { flex: 1, paddingTop: wide ? 120 : 70 }]}>
        <Logo />
        <View style={[a.onboardMiddle, { flex: 1, justifyContent: 'center', paddingBottom: 150 }]}>
          <View
            style={[
              a.imagePlaceholder,
              { height: 247, width: 247, marginTop: 0, marginBottom: 43 },
            ]}
          >
            {illustration ? (
              <Image source={illustration} resizeMode="contain" style={a.onboardImage} />
            ) : (
              <Text style={a.placeholderLabel}>ONBOARDING IMAGE</Text>
            )}
          </View>
          <Text style={a.onboardTitle}>All Runners Are Tracked In Real-Time.</Text>
          <View style={[a.dots, { marginTop: 43 }]}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[a.dot, n === 3 && a.dotOn]} />
            ))}
          </View>
        </View>
      </View>
      <View style={a.dimLayer} />
      <View style={a.roleSheet}>
        <TouchableOpacity onPress={onDismiss} style={a.close}>
          <X size={17} color={C.muted} />
        </TouchableOpacity>
        <GradientButton tone="blue" style={a.pillPrimary} onPress={() => onPick('user')}>
          <Text style={a.pillPrimaryText}>User</Text>
        </GradientButton>
        <GradientButton
          tone="blue"
          style={[a.pillPrimary, { marginTop: 16 }]}
          onPress={() => onPick('pal')}
        >
          <Text style={a.pillPrimaryText}>Pal</Text>
        </GradientButton>
      </View>
    </AuthBackground>
  );
}

export {
  AuthBackground,
  Splash,
  AuthInput,
  Login,
  CreateCategoryFinal,
  CreateErrandFormFinal,
  FlowField,
  RegistrationFlow,
  UserEmailConfirmation,
  UserEmailVerified,
  PalVerification,
  PalOccupation,
  OnboardingFlowFinal,
  RolePickerFinal,
  OnboardingFlow,
  Onboarding,
  Entry,
  RolePicker,
  SignUp,
};
