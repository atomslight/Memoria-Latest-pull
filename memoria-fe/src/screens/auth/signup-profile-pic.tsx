import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { AuthButton } from '../../components/auth/AuthButton';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { api } from '../../utils/api';

const AVATAR_SIZE = 120;

export default function SignupProfilePicScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string | undefined = route.params?.email;
  const password: string | undefined = route.params?.password;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    const asset = result.assets?.[0];
    if (asset?.uri) setImageUri(asset.uri);
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() ?? 'avatar.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

        formData.append('avatar', {
          uri: imageUri,
          name: filename,
          type: mimeType,
        } as unknown as Blob);

        const { profilePicUrl } = await api.auth.uploadAvatar(formData);
        if (profilePicUrl) {
          await api.auth.updateProfile({ profilePicUrl });
        }
      }
    } catch (err) {
      // Non-blocking — proceed even if upload fails
      console.warn('[SIGNUP_PIC] avatar upload failed:', err);
    } finally {
      setLoading(false);
    }
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const handleSkip = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
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
            accessibilityLabel="Skip profile photo"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.header}>Add a profile photo</Text>

        {/* Avatar picker */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={handlePickImage}
            style={styles.avatarWrapper}
            accessibilityRole="button"
            accessibilityLabel="Select profile photo"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={COLORS.textTertiary} />
              </View>
            )}

            {/* Camera icon overlay */}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={18} color={COLORS.black} />
            </View>
          </TouchableOpacity>

          <Text style={styles.tapHint}>Tap to choose a photo</Text>
        </View>

        <View style={styles.spacer} />

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="small" color={COLORS.brandYellow} />
          </View>
        ) : (
          <AuthButton
            onPress={handleContinue}
            label="Continue"
            loading={loading}
          />
        )}
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
    marginBottom: SPACING.xxl,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
  },
  spacer: {
    flex: 1,
  },
  loadingWrapper: {
    height: SPACING.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
