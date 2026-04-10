import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchSettingsStatsRequest } from '../../redux/reducers/settingsStats';
import { fetchActivityRequest } from '../../redux/reducers/activity';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import type { AppTheme } from '../../theme/ThemeContext';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { ActivityHeatmap } from '../../components/home/ActivityHeatmap';

function createSettingsStyles(c: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: SPACING.lg },

    avatarSection: {
      alignItems: 'center',
      paddingVertical: SPACING.lg,
      marginBottom: SPACING.md,
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: SPACING.md,
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: c.brandYellow,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.brandYellow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.brandYellow,
    },
    editBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.brandYellow,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.background,
    },
    profileName: {
      ...TYPOGRAPHY.h3,
      color: c.textPrimary,
      textAlign: 'center',
    },
    profileBio: {
      ...TYPOGRAPHY.body2,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: SPACING.xs,
      paddingHorizontal: SPACING.xl,
    },
    profileBioPlaceholder: {
      ...TYPOGRAPHY.body2,
      color: c.textTertiary,
      textAlign: 'center',
      marginTop: SPACING.xs,
      fontStyle: 'italic',
    },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { ...TYPOGRAPHY.h3, color: c.brandYellow },
    statLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      backgroundColor: c.border,
      marginVertical: SPACING.xs,
    },

    quickGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
    },
    quickIconCell: {
      flex: 1,
      alignItems: 'center',
      gap: SPACING.xs,
    },
    quickIconBox: {
      width: 48,
      height: 48,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickIconLabel: {
      ...TYPOGRAPHY.caption,
      color: c.textSecondary,
      textAlign: 'center',
      fontSize: 10,
    },

    sectionTitle: {
      ...TYPOGRAPHY.overline,
      color: c.textTertiary,
      marginBottom: SPACING.sm,
      marginTop: SPACING.sm,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.md,
    },
    divider: { height: 1, backgroundColor: c.border, marginLeft: 52 },

    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    settingsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    settingsRowLabel: { ...TYPOGRAPHY.body1, color: c.textPrimary },
    settingsRowValue: { ...TYPOGRAPHY.body2, color: c.textSecondary },

    heatmapSkeleton: {
      height: 80,
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: c.surface,
      margin: SPACING.md,
    },
    heatmapPlaceholder: {
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      margin: SPACING.md,
    },
    heatmapPlaceholderText: {
      ...TYPOGRAPHY.body2,
      color: c.textTertiary,
      fontStyle: 'italic',
    },
  });
}

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const c = useAppTheme();
  const styles = useMemo(() => createSettingsStyles(c), [c]);

  const extUser = user as (typeof user & { bio?: string; profilePicUrl?: string }) | null;

  const totalMemories = useAppSelector(
    (s) => s.settingsStats.totalMemories ?? 0,
  );
  const activityData = useAppSelector((s) => s.activity.data);
  const activityLoading = useAppSelector((s) => s.activity.isLoading);

  useEffect(() => {
    dispatch(fetchSettingsStatsRequest());
    dispatch(fetchActivityRequest());
  }, [dispatch]);

  function SettingsRow({
    icon,
    label,
    value,
    onPress,
    color,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    color?: string;
  }) {
    return (
      <TouchableOpacity
        style={styles.settingsRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.settingsRowLeft}>
          <Ionicons name={icon as any} size={20} color={color || c.textSecondary} />
          <Text style={[styles.settingsRowLabel, color ? { color } : null]}>{label}</Text>
        </View>
        {value ? (
          <Text style={styles.settingsRowValue}>{value}</Text>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />
        ) : null}
      </TouchableOpacity>
    );
  }

  function QuickIcon({
    icon,
    label,
    onPress,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity style={styles.quickIconCell} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.quickIconBox}>
          <Ionicons name={icon as any} size={24} color={c.textSecondary} />
        </View>
        <Text style={styles.quickIconLabel}>{label}</Text>
      </TouchableOpacity>
    );
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await useAuthStore.getState().signOut();
          } catch (err) {
            await useAuthStore.getState().clearAuth();
          }
        },
      },
    ]);
  };

  const handleTheme = () =>
    Alert.alert('Theme', 'Choose appearance', [
      { text: 'System', onPress: () => setThemeMode('system') },
      { text: 'Light', onPress: () => setThemeMode('light') },
      { text: 'Dark', onPress: () => setThemeMode('dark') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  const handleClusters = () => Alert.alert('Coming Soon', 'Cluster management is coming soon.');
  const handleLanguage = () => navigation.navigate('ProfileLanguage');
  const handleSmartPlaces = () => navigation.navigate('ProfileSmartPlaces');
  const handleFaces = () => navigation.navigate('ProfileFaceTagging');

  const navigateToEdit = () => navigation.navigate('ProfileEdit');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.avatarSection} onPress={navigateToEdit} activeOpacity={0.8}>
          <View style={styles.avatarWrapper}>
            {extUser?.profilePicUrl ? (
              <Image source={{ uri: extUser.profilePicUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color={c.black} />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={16} color={c.black} />
            </View>
          </View>

          <Text style={styles.profileName}>{extUser?.name || 'User'}</Text>
          {extUser?.bio ? (
            <Text style={styles.profileBio}>{extUser.bio}</Text>
          ) : (
            <Text style={styles.profileBioPlaceholder}>Tap to add a bio</Text>
          )}
        </TouchableOpacity>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalMemories}</Text>
            <Text style={styles.statLabel}>Memories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Threads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>MVP</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        <View style={styles.quickGrid}>
          <QuickIcon
            icon="moon-outline"
            label={`Theme (${themeMode})`}
            onPress={handleTheme}
          />
          <QuickIcon icon="location-outline" label="Smart Places" onPress={handleSmartPlaces} />
          <QuickIcon icon="globe-outline" label="Language" onPress={handleLanguage} />
          <QuickIcon icon="grid-outline" label="Clusters" onPress={handleClusters} />
          <QuickIcon icon="person-outline" label="Faces" onPress={handleFaces} />
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingsRow icon="create-outline" label="Edit Profile" onPress={navigateToEdit} />
          <View style={styles.divider} />
          <SettingsRow icon="notifications-outline" label="Notifications" />
          <View style={styles.divider} />
          <SettingsRow icon="bar-chart-outline" label="Data Usage" />
          <View style={styles.divider} />
          <SettingsRow
            icon="phone-portrait-outline"
            label="Active Devices"
            onPress={() => navigation.navigate('ProfileActiveDevices')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
            color={c.error}
          />
        </View>

        <Text style={styles.sectionTitle}>Memory Activity</Text>
        <View style={styles.card}>
          {activityLoading ? (
            <View style={styles.heatmapSkeleton} />
          ) : (
            <ActivityHeatmap data={activityData?.data ?? []} />
          )}
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
