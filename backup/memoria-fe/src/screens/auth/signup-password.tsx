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
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

export default function SignupPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string | undefined = route.params?.email;

  const [password, setPassword] = useState('');

  const isPasswordFilled = password.length > 0;

  const handleContinue = () => {
    if (!isPasswordFilled || !email) return;

    console.log('[SIGNUP] Password screen → continuing with email:', email);
    navigation.navigate('AuthSignupName', { email, password });
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

        <Text style={styles.header}>Create a password</Text>

        <AuthInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoFocus
        />

        <View style={styles.spacer} />

        <AuthButton
          onPress={handleContinue}
          label="Continue"
          disabled={!isPasswordFilled}
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
