import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthButton } from '../../components/auth/AuthButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { api } from '../../utils/api';

const MAX_BIO_LENGTH = 150;

export default function SignupBioScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string | undefined = route.params?.email;
  const password: string | undefined = route.params?.password;
  const name: string | undefined = route.params?.name;

  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (bio.trim().length > 0) {
        await api.auth.updateProfile({ bio: bio.trim() });
      }
    } catch (err) {
      // Non-blocking — proceed even if update fails
      console.warn('[SIGNUP_BIO] profile update failed:', err);
    } finally {
      setLoading(false);
    }
    navigation.navigate('AuthSignupProfilePic', { email, password, name, bio: bio.trim() || undefined });
  };

  const handleSkip = () => {
    navigation.navigate('AuthSignupProfilePic', { email, password, name });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={SPACING.authBreathingRoom}
    >
      <View style={styles.inner}>
        {/* Top row: back + skip */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip bio"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.header}>Tell us about yourself</Text>

        <TextInput
          value={bio}
          onChangeText={(text) => {
            if (text.length <= MAX_BIO_LENGTH) setBio(text);
          }}
          placeholder="A short bio or quote..."
          placeholderTextColor={COLORS.placeholder}
          style={styles.input}
          multiline
          autoFocus
          selectionColor={COLORS.brandYellow}
          maxLength={MAX_BIO_LENGTH}
        />

        <Text style={styles.counter}>
          {bio.length}/{MAX_BIO_LENGTH}
        </Text>

        <View style={styles.spacer} />

        <AuthButton
          onPress={handleContinue}
          label="Continue"
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  skipText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  header: {
    ...TYPOGRAPHY.authHeader,
    color: COLORS.brandYellow,
    marginBottom: SPACING.lg,
  },
  input: {
    ...TYPOGRAPHY.inputLarge,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.transparent,
    borderWidth: 0,
    padding: 0,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    textAlign: 'right',
  },
  spacer: {
    flex: 1,
  },
});
