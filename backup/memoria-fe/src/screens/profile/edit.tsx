import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/shadows';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../utils/api';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const userWithBio = user as (typeof user & { bio?: string; profilePicUrl?: string }) | null;

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(userWithBio?.bio ?? '');
  const [profilePicUrl, setProfilePicUrl] = useState(userWithBio?.profilePicUrl ?? '');
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });
    const asset = result.assets?.[0];
    if (asset?.uri) setProfilePicUrl(asset.uri);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.auth.updateProfile({ name, bio });
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.brandYellow} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
          {profilePicUrl ? (
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            <View style={styles.avatarImagePlaceholder}>
              <Ionicons name="person" size={36} color={COLORS.background} />
            </View>
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={36} color={COLORS.background} />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color={COLORS.background} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Fields */}
      <View style={styles.fields}>
        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.inputPlaceholder}
            selectionColor={COLORS.brandYellow}
          />
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, 150))}
            placeholder="Tell us about yourself"
            placeholderTextColor={COLORS.inputPlaceholder}
            selectionColor={COLORS.brandYellow}
            multiline
            maxLength={150}
          />
          <Text style={styles.charCounter}>{bio.length}/150</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: SPACING.xs,
    minWidth: 48,
    alignItems: 'flex-end',
  },
  saveText: {
    ...TYPOGRAPHY.button,
    color: COLORS.brandYellow,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    position: 'relative',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  fields: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  fieldLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.lg,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm + 4,
  },
  charCounter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'right',
  },
});
