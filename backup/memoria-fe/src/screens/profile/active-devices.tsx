import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/shadows';

interface Session {
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

const MOCK_SESSIONS: Session[] = [
  { device: 'iPhone 15 Pro', location: 'Mumbai, India', lastActive: 'This device', isCurrent: true },
  { device: 'MacBook Pro', location: 'Mumbai, India', lastActive: '2 hours ago', isCurrent: false },
  { device: 'iPad Air', location: 'Delhi, India', lastActive: '3 days ago', isCurrent: false },
];

export default function ActiveDevicesScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Devices</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_SESSIONS.map((session, index) => (
          <View key={index} style={styles.row}>
            <View style={styles.deviceIcon}>
              <Ionicons
                name={session.device.includes('MacBook') ? 'laptop-outline' : session.device.includes('iPad') ? 'tablet-portrait-outline' : 'phone-portrait-outline'}
                size={22}
                color={COLORS.textSecondary}
              />
            </View>

            <View style={styles.rowContent}>
              <Text style={styles.deviceName}>{session.device}</Text>
              <Text style={styles.location}>{session.location}</Text>
            </View>

            {session.isCurrent ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>This device</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.signOutButton}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
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
  headerRight: {
    width: 32,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  deviceIcon: {
    width: 36,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  deviceName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
  },
  location: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  currentBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  currentBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
  },
  signOutButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  signOutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: '600',
  },
});
