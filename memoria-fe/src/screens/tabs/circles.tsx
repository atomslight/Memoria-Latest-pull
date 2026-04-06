import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCircles } from '../../hooks/useCircles';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { BORDER_RADIUS, SHADOWS } from '../../constants/shadows';
import type { CircleListItem } from '../../types/circle';

export default function CirclesScreen() {
  const navigation = useNavigation<any>();
  const { data: circles, isLoading, refetch, isRefetching } = useCircles();

  const renderItem = useCallback(
    ({ item }: { item: CircleListItem }) => (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => navigation.navigate('CircleDetails', { id: item.id })}
        accessibilityRole="button"
        accessibilityLabel={`Open circle ${item.name}`}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item as any).emoji || '🔵'}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.circleName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.circleDesc} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.meta}>
            <Ionicons name="people-outline" size={13} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>
              {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          {item.myRole === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </View>
      </Pressable>
    ),
    [navigation]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brandYellow} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Circles</Text>
          <Text style={styles.subtitle}>Share moments privately</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CircleCreate')}
          accessibilityRole="button"
          accessibilityLabel="Create new circle"
        >
          <Ionicons name="add" size={22} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={circles ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          (circles ?? []).length === 0 ? styles.emptyContainer : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.brandYellow}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={40} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No circles yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a circle to share photos privately with friends and family.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('CircleCreate')}
              accessibilityRole="button"
            >
              <Text style={styles.emptyBtnText}>Create your first circle</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  cardPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.brandYellow,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  circleName: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  circleDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  cardRight: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  adminBadge: {
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 0.3,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  emptyBtn: {
    height: SPACING.buttonHeight,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.brandYellow,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },
});
