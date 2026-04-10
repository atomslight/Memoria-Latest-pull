import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  useCircle,
  useCirclePhotos,
  useAddMember,
  useRemoveMember,
  useDeleteCircle,
  useSearchUsers,
} from '../../hooks/useCircles';
import { useAuthStore } from '../../stores/authStore';
import { ShareToCircleModal } from '../../components/circles/ShareToCircleModal';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { BORDER_RADIUS, SHADOWS } from '../../constants/shadows';
import type { CirclePhotoItem, CircleMemberInfo } from '../../types/circle';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.xs * 2) / 3;

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

export default function CircleDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string = route.params?.id;
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: circle, isLoading, refetch, isRefetching } = useCircle(id);
  const { data: photosData } = useCirclePhotos(id);
  const { mutate: addMember, isPending: isAddingMember } = useAddMember();
  const { mutate: removeMember } = useRemoveMember();
  const { mutate: deleteCircle, isPending: isDeleting } = useDeleteCircle();

  const [showAddMember, setShowAddMember] = useState(false);
  const [showSharePhotos, setShowSharePhotos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults } = useSearchUsers(searchQuery);

  const isAdmin = circle?.myRole === 'admin';
  const isCreator = circle?.createdBy === currentUserId;

  const handleAddMember = useCallback(
    (userId: string) => {
      addMember(
        { circleId: id, userId },
        {
          onSuccess: () => {
            setShowAddMember(false);
            setSearchQuery('');
          },
          onError: (err) => Alert.alert('Error', err.message),
        }
      );
    },
    [id, addMember]
  );

  const handleRemoveMember = useCallback(
    (member: CircleMemberInfo) => {
      const isSelf = member.userId === currentUserId;
      Alert.alert(
        isSelf ? 'Leave Circle' : 'Remove Member',
        isSelf
          ? 'Are you sure you want to leave this circle?'
          : `Remove ${memberDisplayLabel(member)} from this circle?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isSelf ? 'Leave' : 'Remove',
            style: 'destructive',
            onPress: () =>
              removeMember(
                { circleId: id, userId: member.userId },
                {
                  onSuccess: () => {
                    if (isSelf) navigation.goBack();
                  },
                  onError: (err) => Alert.alert('Error', err.message),
                }
              ),
          },
        ]
      );
    },
    [id, currentUserId, removeMember, navigation]
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Circle',
      'This will permanently delete the circle. Your photos will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteCircle(id, {
              onSuccess: () => navigation.goBack(),
              onError: (err) => Alert.alert('Error', err.message),
            }),
        },
      ]
    );
  }, [id, deleteCircle, navigation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brandYellow} />
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Circle not found</Text>
      </View>
    );
  }

  const photos = photosData?.photos ?? [];
  const totalPhotos = photosData?.pagination.total ?? 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {circle.name}
        </Text>

        {isCreator ? (
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => Alert.alert('Edit Circle', 'Edit coming soon')}
                style={styles.headerAction}
                accessibilityRole="button"
                accessibilityLabel="Edit circle"
              >
                <Ionicons name="pencil-outline" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              style={styles.headerAction}
              accessibilityRole="button"
              accessibilityLabel="Delete circle"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerAction} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.brandYellow}
          />
        }
      >
        {/* Circle info card */}
        <View style={styles.infoCard}>
          <View style={styles.circleAvatar}>
            <Text style={styles.circleAvatarText}>
              {(circle as any).emoji || '🔵'}
            </Text>
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.circleName}>{circle.name}</Text>
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{totalPhotos} photos</Text>
            </View>
            {circle.description ? (
              <Text style={styles.circleDesc}>{circle.description}</Text>
            ) : null}
            <View style={styles.infoMeta}>
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={13} color={COLORS.textTertiary} />
                <Text style={styles.metaChipText}>
                  {circle.members.length} {circle.members.length === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <View style={[styles.metaChip, styles.roleChip]}>
                <Text style={styles.roleChipText}>{circle.myRole}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Photos section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.sectionHeaderRight}>
              <Text style={styles.sectionCount}>{totalPhotos}</Text>
              <TouchableOpacity
                style={styles.sharePhotosBtn}
                onPress={() => setShowSharePhotos(true)}
                accessibilityRole="button"
                accessibilityLabel="Share photos to this circle"
              >
                <Ionicons name="add-circle-outline" size={15} color={COLORS.black} />
                <Text style={styles.sharePhotosBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {photos.length === 0 ? (
            <Pressable
              style={styles.emptySection}
              onPress={() => setShowSharePhotos(true)}
              accessibilityRole="button"
              accessibilityLabel="Share photos to this circle"
            >
              <View style={styles.emptySectionIconWrap}>
                <Ionicons name="images-outline" size={28} color={COLORS.textTertiary} />
              </View>
              <Text style={styles.emptySectionText}>No photos shared yet</Text>
              <Text style={styles.emptySectionHint}>Tap to share your memories</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.photoGrid}>
                {photos.map((photo: CirclePhotoItem) => (
                  <View key={photo.id} style={styles.photoWrap}>
                    <Image
                      source={{ uri: photo.thumbnailUrl }}
                      style={styles.photo}
                      accessibilityLabel={photo.caption || 'Circle photo'}
                    />
                    {photo.caption ? (
                      <View style={styles.photoCaptionOverlay}>
                        <Text style={styles.photoCaption} numberOfLines={2}>
                          {photo.caption}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Members section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <View style={styles.sectionHeaderRight}>
              <Text style={styles.sectionCount}>{circle.members.length}</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addMemberBtn}
                  onPress={() => setShowAddMember(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add member"
                >
                  <Ionicons name="person-add-outline" size={16} color={COLORS.black} />
                  <Text style={styles.addMemberBtnText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberAvatarRow}>
            {circle.members.map((member: CircleMemberInfo) => {
              const initial = memberInitial(member);

              return (
                <TouchableOpacity
                  key={member.id}
                  onPress={() => navigation.navigate('CircleMembers', { id })}
                >
                  <View style={styles.memberAvatarSmall}>
                    <Text style={styles.memberAvatarSmallText}>
                      {initial}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={() => navigation.navigate('CircleMembers', { id })}>
            <Text style={styles.membersTapHint}>{circle.members.length} members · Tap to manage</Text>
          </TouchableOpacity>

          <View style={styles.memberList}>
            {circle.members.map((member: CircleMemberInfo) => {
              const isSelf = member.userId === currentUserId;
              const isCircleCreator = member.userId === circle.createdBy;
              const canRemove = (isAdmin || isSelf) && !isCircleCreator;
              const displayLabel = memberDisplayLabel(member);

              return (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {memberInitial(member)}
                    </Text>
                  </View>

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {displayLabel}
                      {isSelf ? <Text style={styles.youLabel}> (you)</Text> : null}
                    </Text>
                    {member.name?.trim() ? (
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    ) : null}
                  </View>

                  <View style={styles.memberRight}>
                    {isCircleCreator ? (
                      <View style={styles.creatorBadge}>
                        <Text style={styles.creatorBadgeText}>Creator</Text>
                      </View>
                    ) : member.role === 'admin' ? (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    ) : null}

                    {canRemove && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(member)}
                        style={styles.removeBtn}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isSelf ? 'Leave circle' : `Remove ${displayLabel}`
                        }
                      >
                        <Text style={styles.removeBtnText}>
                          {isSelf ? 'Leave' : 'Remove'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Share Photos Modal */}
      {circle && (
        <ShareToCircleModal
          visible={showSharePhotos}
          circleId={id}
          circleName={circle.name}
          onClose={() => setShowSharePhotos(false)}
          onShared={(count) => {
            refetch();
            Alert.alert(
              'Shared',
              `${count} photo${count !== 1 ? 's' : ''} shared to ${circle.name}.`
            );
          }}
        />
      )}

      {/* Add Member Modal */}
      <Modal
        visible={showAddMember}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowAddMember(false); setSearchQuery(''); }}
      >
        <View style={styles.modal}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => { setShowAddMember(false); setSearchQuery(''); }}
              style={styles.modalClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Member</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Search input */}
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or email"
              placeholderTextColor={COLORS.inputPlaceholder}
              autoFocus
              selectionColor={COLORS.brandYellow}
              accessibilityLabel="Search users"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={searchResults ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.searchResults}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.userRow, pressed && { opacity: 0.7 }]}
                onPress={() => handleAddMember(item.id)}
                disabled={isAddingMember}
                accessibilityRole="button"
                accessibilityLabel={`Add ${memberDisplayLabel(item)}`}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {memberInitial(item)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{memberDisplayLabel(item)}</Text>
                  {item.name?.trim() ? (
                    <Text style={styles.userEmail}>{item.email}</Text>
                  ) : null}
                </View>
                {isAddingMember ? (
                  <ActivityIndicator size="small" color={COLORS.brandYellow} />
                ) : (
                  <View style={styles.addBtn}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </View>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              searchQuery.trim().length > 0 ? (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>No users found</Text>
                </View>
              ) : (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>
                    Type a name or email to search
                  </Text>
                </View>
              )
            }
          />
        </View>
      </Modal>
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
  errorText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  circleAvatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  circleAvatarText: {
    fontSize: 28,
    color: COLORS.brandYellow,
  },
  infoBody: {
    flex: 1,
    gap: 4,
  },
  circleName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  circleDesc: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  metaChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  roleChip: {
    backgroundColor: COLORS.brandYellow + '22',
  },
  roleChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.brandYellow,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Photo badge
  photoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  photoBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textSecondary,
  },
  sectionCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  addMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },

  // Photos
  emptySection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.xs,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptySectionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  emptySectionText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySectionHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  sharePhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
  },
  sharePhotosBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xs,
  },
  photoWrap: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: COLORS.surface,
  },
  photoCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  photoCaption: {
    fontSize: 9,
    color: COLORS.white,
    lineHeight: 12,
  },

  // Members
  memberList: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  youLabel: {
    color: COLORS.textTertiary,
    fontWeight: '400',
  },
  memberEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  memberRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  creatorBadge: {
    backgroundColor: COLORS.brandYellow + '22',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brandYellow,
  },
  adminBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
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

  // Add Member Modal
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalClose: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  modalTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    padding: 0,
  },
  searchResults: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.xs,
  },
  searchEmpty: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  searchEmptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  addBtn: {
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },

  // Member avatar row
  memberAvatarRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  memberAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  membersTapHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});
