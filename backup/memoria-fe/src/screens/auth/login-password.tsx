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

export default function LoginPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string | undefined = route.params?.email;
  const signIn = useAuthStore((s) => s.signIn);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPasswordFilled = password.length > 0;

  const handleContinue = async () => {
    if (!isPasswordFilled || !email) return;

    console.log('[LOGIN] Password screen → calling signIn', { email });
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      console.log('[LOGIN] signIn succeeded — should auto-redirect');
    } catch (err: unknown) {
      let message =
        err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      if (message.toLowerCase().startsWith('typeerror:')) {
        message = message.replace(/^typeerror:\s*/i, '').trim();
      }
      console.log('[LOGIN] signIn error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

        <Text style={styles.header}>Enter the password</Text>

        <AuthInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoFocus
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <View style={styles.spacer} />

        <AuthButton
          onPress={handleContinue}
          label="Continue"
          disabled={!isPasswordFilled}
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
});
