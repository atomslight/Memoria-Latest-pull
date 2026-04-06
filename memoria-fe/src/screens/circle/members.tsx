import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCircle } from '../../hooks/useCircles';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import type { CircleMemberInfo } from '../../types/circle';

function memberDisplayLabel(m: {
  name?: string | null;
  email?: string | null;
}): string {
  const name = m.name?.trim();
  const email = (m.email ?? '').toString().trim();
  return name || email || 'Member';
}

function memberInitial(m: {
  name?: string | null;
  email?: string | null;
}): string {
  return memberDisplayLabel(m).charAt(0).toUpperCase();
}

export default function CircleMembersScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string = route.params?.id;
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: circle, isLoading } = useCircle(id);

  const isAdmin = circle?.myRole === 'admin';

  const renderMember = ({ item }: { item: CircleMemberInfo }) => {
    const isSelf = item.userId === currentUserId;
    const isCreator = item.userId === circle?.createdBy;
    const role = isCreator ? 'Creator' : item.role === 'admin' ? 'Admin' : 'Member';

    return (
      <View style={styles.memberRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{memberInitial(item)}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {memberDisplayLabel(item)}
            {isSelf ? <Text style={styles.youLabel}> (you)</Text> : null}
          </Text>
          {item.name ? <Text style={styles.memberEmail}>{item.email}</Text> : null}
        </View>
        <View style={styles.memberRight}>
          <View style={[styles.roleBadge, isCreator && styles.roleBadgeCreator]}>
            <Text style={[styles.roleBadgeText, isCreator && styles.roleBadgeTextCreator]}>
              {role}
            </Text>
          </View>
          {isAdmin && !isCreator && !isSelf && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Remove', `Remove ${memberDisplayLabel(item)}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => {} },
                ])
              }
              style={styles.removeBtn}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${memberDisplayLabel(item)}`}
            >
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={circle?.members ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    ...(TYPOGRAPHY.h4 as object),
    color: COLORS.white,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xs,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...(TYPOGRAPHY.body2 as object),
    color: COLORS.white,
    fontWeight: '500',
  },
  youLabel: {
    color: COLORS.textTertiary,
    fontWeight: '400',
  },
  memberEmail: {
    ...(TYPOGRAPHY.caption as object),
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  roleBadge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeCreator: {
    backgroundColor: COLORS.brandYellow + '22',
  },
  roleBadgeText: {
    ...(TYPOGRAPHY.caption as object),
    color: COLORS.textSecondary,
  },
  roleBadgeTextCreator: {
    color: COLORS.brandYellow,
    fontWeight: '600',
  },
  removeBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.error + '55',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
  },
  empty: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyText: {
    ...(TYPOGRAPHY.body2 as object),
    color: COLORS.textTertiary,
  },
});
