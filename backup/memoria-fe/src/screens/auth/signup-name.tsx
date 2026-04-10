import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { useAuthStore } from '../../stores/authStore';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const EMAIL_VERIFICATION_HINT = 'Please check your email and confirm your account';

export default function SignupNameScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string | undefined = route.params?.email;
  const password: string | undefined = route.params?.password;
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationRequired, setEmailVerificationRequired] =
    useState(false);

  const isNameFilled = name.trim().length > 0;

  const handleContinue = async () => {
    if (!isNameFilled || !email || !password) return;

    console.log('[SIGNUP] Name screen → calling signUp', { email, name: name.trim() });
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, name.trim());
      console.log('[SIGNUP] signUp succeeded — navigating to bio screen');
      // Navigate to bio onboarding step instead of letting root layout redirect
      navigation.navigate('AuthSignupBio', { email, password, name: name.trim() });
    } catch (err: unknown) {
      let message =
        err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      if (message.toLowerCase().startsWith('typeerror:')) {
        message = message.replace(/^typeerror:\s*/i, '').trim();
      }

      console.log('[SIGNUP] signUp error:', message);
      if (message.includes(EMAIL_VERIFICATION_HINT)) {
        console.log('[SIGNUP] Email verification required — showing verification screen');
        setEmailVerificationRequired(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailVerificationRequired) {
    return (
      <View style={styles.container}>
        <View style={styles.verificationInner}>
          <Ionicons
            name="mail-outline"
            size={64}
            color={COLORS.brandYellow}
            style={styles.mailIcon}
          />
          <Text style={styles.verificationTitle}>Check your email</Text>
          <Text style={styles.verificationMessage}>
            Check your email to verify your account.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AuthLoginEmail')}
            style={styles.loginLink}
            accessibilityRole="button"
            accessibilityLabel="Go to login"
          >
            <Text style={styles.loginLinkText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={SPACING.authBreathingRoom}
    >
      <View style={styles.inner}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.header}>What's your name?</Text>

        <AuthInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          autoFocus
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <View style={styles.spacer} />

        <AuthButton
          onPress={handleContinue}
          label="Continue"
          disabled={!isNameFilled}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  backButton: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  header: {
    ...TYPOGRAPHY.authHeader,
    color: COLORS.brandYellow,
    marginBottom: SPACING.lg,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: SPACING.sm,
  },
  spacer: {
    flex: 1,
  },
  // Email verification state
  verificationInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  mailIcon: {
    marginBottom: SPACING.lg,
  },
  verificationTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  verificationMessage: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  loginLink: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  loginLinkText: {
    ...TYPOGRAPHY.button,
    color: COLORS.brandYellow,
  },
});
