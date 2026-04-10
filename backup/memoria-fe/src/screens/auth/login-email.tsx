import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginEmailScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');

  const isValidEmail = EMAIL_REGEX.test(email);

  const handleContinue = () => {
    if (isValidEmail) {
      console.log('[LOGIN] Email screen → continuing with:', email);
      navigation.navigate('AuthLoginPassword', { email });
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

        <Text style={styles.header}>What's your email id?</Text>

        <AuthInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoFocus
        />

        <View style={styles.spacer} />

        <AuthButton
          onPress={handleContinue}
          label="Continue"
          disabled={!isValidEmail}
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
  spacer: {
    flex: 1,
  },
});
