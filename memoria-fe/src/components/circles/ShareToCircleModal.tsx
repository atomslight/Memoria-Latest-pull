import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchMemoriesPickerPageRequest,
  resetMemoriesPicker,
} from '../../redux/reducers/memoriesPicker';
import {
  fetchMemoryEmbeddingSearchRequest,
  clearMemoryEmbeddingSearch,
} from '../../redux/reducers/memoryEmbeddingSearch';
import {
  clearBulkShareResult,
} from '../../redux/reducers/circlesMutations';
import { triggerSharePhotosToCircle } from '../../redux/actions/circlesTriggers';
import type { MemoriesResponse } from '../../utils/api';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { BORDER_RADIUS, SHADOWS } from '../../constants/shadows';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - SPACING.md * 2 - 4) / 3;

interface Memory {
  id: string;
  thumbnailSmall: string;
  thumbnailMedium: string;
  caption: string | null;
  capturedAt: string;
}

interface Props {
  visible: boolean;
  circleId: string;
  circleName: string;
  onClose: () => void;
  onShared: (count: number) => void;
}

// ─── Checkmark overlay ───────────────────────────────────────────────────────

function SelectionOverlay({ selected, index }: { selected: boolean; index: number }) {
  const scale = useRef(new Animated.Value(selected ? 1 : 0.5)).current;
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: selected ? 1 : 0.5,
        useNativeDriver: true,
        damping: 14,
        stiffness: 200,
      }),
      Animated.timing(opacity, {
        toValue: selected ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected]);

  return (
    <>
      {/* Dim overlay when selected */}
      {selected && <View style={styles.photoDim} />}

      {/* Circle badge top-right */}
      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <Ionicons name="checkmark" size={14} color={COLORS.black} />
        </Animated.View>
      </View>

      {/* Selection order number */}
      {selected && (
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{index + 1}</Text>
        </View>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShareToCircleModal({ visible, circleId, circleName, onClose, onShared }: Props) {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const shareSessionRef = useRef(false);

  const { pages, isLoading: pickerLoading, isFetchingMore: pickerFetchingMore } =
    useAppSelector((s) => s.memoriesPicker);
  const { results: searchResults, isLoading: isSearchFetching } = useAppSelector(
    (s) => s.memoryEmbeddingSearch,
  );
  const bulkShare = useAppSelector((s) => s.circlesMutations.bulkShare);

  useEffect(() => {
    if (visible) {
      dispatch(resetMemoriesPicker());
      dispatch(clearMemoryEmbeddingSearch());
      dispatch(clearBulkShareResult());
      dispatch(fetchMemoriesPickerPageRequest({ page: 1, reset: true }));
    }
  }, [visible, dispatch]);

  useEffect(() => {
    if (!visible) return;
    const q = searchQuery.trim();
    if (q.length > 1) {
      dispatch(fetchMemoryEmbeddingSearchRequest({ query: searchQuery }));
    } else {
      dispatch(clearMemoryEmbeddingSearch());
    }
  }, [visible, searchQuery, dispatch]);

  useEffect(() => {
    if (!bulkShare || !shareSessionRef.current) return;
    shareSessionRef.current = false;
    setIsSharing(false);
    if (bulkShare.errors.length > 0 && bulkShare.successCount === 0) {
      Alert.alert('Share failed', bulkShare.errors[0]);
    } else {
      onShared(bulkShare.successCount);
      onClose();
    }
    dispatch(clearBulkShareResult());
  }, [bulkShare, dispatch, onClose, onShared]);

  const allMemories: Memory[] = pages.flatMap((p) => p.memories) ?? [];
  const hasNextPage =
    pages.length > 0 &&
    (pages[pages.length - 1] as MemoriesResponse).pagination.hasMore;

  const fetchNextPage = useCallback(() => {
    if (!hasNextPage || pickerFetchingMore || pages.length === 0) return;
    const last = pages[pages.length - 1] as MemoriesResponse;
    dispatch(fetchMemoriesPickerPageRequest({ page: last.pagination.page + 1 }));
  }, [dispatch, hasNextPage, pickerFetchingMore, pages]);

  const isLoadingMemories = pickerLoading && pages.length === 0;
  const isFetchingNextPage = pickerFetchingMore;

  const displayMemories: Memory[] =
    searchQuery.trim().length > 1 ? (searchResults as Memory[]) : allMemories;

  // Slide-in animation
  useEffect(() => {
    if (visible) {
      setSelected(new Set());
      setSearchQuery('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 20) {
          Alert.alert('Limit reached', 'You can share up to 20 photos at once.');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedArray = Array.from(selected);

  const handleShare = () => {
    if (selectedArray.length === 0) return;
    shareSessionRef.current = true;
    setIsSharing(true);
    dispatch(clearBulkShareResult());
    dispatch(
      triggerSharePhotosToCircle({
        circleId,
        photoIds: selectedArray,
      }),
    );
  };

  const renderPhoto = useCallback(
    ({ item, index }: { item: Memory; index: number }) => {
      const isSelected = selected.has(item.id);
      const selectionIndex = selectedArray.indexOf(item.id);

      return (
        <Pressable
          style={styles.photoCell}
          onPress={() => toggleSelect(item.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={item.caption || `Photo ${index + 1}`}
        >
          <Image
            source={{ uri: item.thumbnailSmall || item.thumbnailMedium }}
            style={styles.photo}
          />
          <SelectionOverlay selected={isSelected} index={selectionIndex} />
        </Pressable>
      );
    },
    [selected, selectedArray, toggleSelect]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Share to Circle</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {circleName}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.shareBtn,
                selectedArray.length === 0 && styles.shareBtnDisabled,
              ]}
              onPress={handleShare}
              disabled={selectedArray.length === 0 || isSharing}
              accessibilityRole="button"
              accessibilityLabel={`Share ${selectedArray.length} photos`}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={COLORS.black} />
              ) : (
                <Text
                  style={[
                    styles.shareBtnText,
                    selectedArray.length === 0 && styles.shareBtnTextDisabled,
                  ]}
                >
                  Share{selectedArray.length > 0 ? ` (${selectedArray.length})` : ''}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar — powered by visual embeddings */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons
                name={isSearchFetching ? 'sync-outline' : 'search-outline'}
                size={16}
                color={COLORS.textTertiary}
              />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search memories with AI..."
                placeholderTextColor={COLORS.inputPlaceholder}
                selectionColor={COLORS.brandYellow}
                returnKeyType="search"
                accessibilityLabel="Search memories"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            {searchQuery.trim().length > 1 && (
              <View style={styles.aiTag}>
                <Ionicons name="sparkles" size={11} color={COLORS.brandYellow} />
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            )}
          </View>

          {/* Selection summary bar */}
          {selectedArray.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionBarText}>
                {selectedArray.length} photo{selectedArray.length !== 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity onPress={() => setSelected(new Set())}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Grid */}
          {isLoadingMemories ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={COLORS.brandYellow} />
              <Text style={styles.loadingText}>Loading your memories...</Text>
            </View>
          ) : displayMemories.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="images-outline" size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>
                {searchQuery.trim().length > 1
                  ? 'No memories match your search'
                  : 'No memories to share'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayMemories}
              renderItem={renderPhoto}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage && !searchQuery) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={COLORS.brandYellow} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.88,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  shareBtn: {
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 72,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  shareBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.black,
  },
  shareBtnTextDisabled: {
    color: COLORS.textTertiary,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
    padding: 0,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.brandYellow + '22',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.brandYellow + '44',
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.brandYellow,
  },

  // Selection bar
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.brandYellow + '18',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brandYellow + '33',
  },
  selectionBarText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.brandYellow,
    fontWeight: '600',
  },
  clearText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Grid
  grid: {
    padding: SPACING.xs,
    paddingBottom: SPACING.xxl,
  },
  gridRow: {
    gap: 2,
    marginBottom: 2,
  },
  photoCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    position: 'relative',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  checkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: COLORS.brandYellow,
    borderColor: COLORS.brandYellow,
  },
  orderBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: COLORS.brandYellow,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.black,
  },

  // States
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
});
