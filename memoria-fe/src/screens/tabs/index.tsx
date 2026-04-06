import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  fetchMemoriesTimelinePageRequest,
} from '../../redux/reducers/memoriesTimeline';
import type { MemoriesResponse } from '../../utils/api';
import { groupMemoriesByDate, type TimelineSection } from '../../utils/timeline';
import {
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  LoadingFooter,
} from '../../components/timeline';
import { ImageViewer } from '../../components/ImageViewer';
import { ViewToggle, GridView, ThreadedView, GitCommitView } from '../../components/home';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import type { Memory } from '../../types/memory';

export default function TimelineScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedMemoryIndex, setSelectedMemoryIndex] = useState(0);
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { viewMode, setViewMode } = usePreferencesStore();

  const isFocused = useIsFocused();
  const { pages, isLoading, isFetchingMore, error } = useAppSelector(
    (s) => s.memoriesTimeline,
  );

  useEffect(() => {
    if (isFocused) {
      dispatch(fetchMemoriesTimelinePageRequest({ page: 1, reset: true }));
    }
  }, [isFocused, dispatch]);

  const sections = useMemo(() => {
    const allMemories = pages.flatMap((page) => page.memories) || [];
    return groupMemoriesByDate(allMemories);
  }, [pages]);

  const allMemories = useMemo(() => {
    return pages.flatMap((page) => page.memories) || [];
  }, [pages]);

  const totalCount = pages[0]?.pagination?.total || 0;

  const hasNextPage =
    pages.length > 0 &&
    (pages[pages.length - 1] as MemoriesResponse).pagination.hasMore;

  const fetchNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingMore || pages.length === 0) return;
    const last = pages[pages.length - 1] as MemoriesResponse;
    dispatch(
      fetchMemoriesTimelinePageRequest({ page: last.pagination.page + 1 }),
    );
  }, [dispatch, hasNextPage, isFetchingMore, pages]);

  const refetch = useCallback(() => {
    dispatch(fetchMemoriesTimelinePageRequest({ page: 1, reset: true }));
  }, [dispatch]);

  const handleMemoryPress = (memory: Memory) => {
    const index = allMemories.findIndex((m) => m.id === memory.id);
    if (index !== -1) {
      setSelectedMemoryIndex(index);
      setViewerVisible(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingMore) fetchNextPage();
  };

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={COLORS.brandYellow}
    />
  );

  const listFooter = isFetchingMore ? <LoadingFooter /> : null;

  if (isLoading && pages.length === 0) return <LoadingSkeleton />;
  if (error) return <ErrorState error={new Error(error)} onRetry={() => refetch()} />;
  if (sections.length === 0) return <EmptyState />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Memoria</Text>
          <Text style={styles.headerSubtitle}>{totalCount} memories</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.textSecondary} />
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={COLORS.textSecondary} />
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('threads')}
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} />
        <Text style={styles.searchPlaceholder}>Search memories...</Text>
      </TouchableOpacity>

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        <ViewToggle viewMode={viewMode} onChangeViewMode={setViewMode} />
      </View>

      {/* Feed */}
      {viewMode === 'grid' && (
        <GridView
          sections={sections}
          allMemories={allMemories}
          onMemoryPress={handleMemoryPress}
          onEndReached={handleEndReached}
          refreshControl={refreshControl}
          ListFooterComponent={listFooter}
        />
      )}
      {viewMode === 'threaded' && (
        <ThreadedView
          allMemories={allMemories}
          onMemoryPress={handleMemoryPress}
          onEndReached={handleEndReached}
          refreshControl={refreshControl}
          ListFooterComponent={listFooter}
        />
      )}
      {viewMode === 'gitcommit' && (
        <GitCommitView
          sections={sections}
          onMemoryPress={handleMemoryPress}
          onEndReached={handleEndReached}
          refreshControl={refreshControl}
          ListFooterComponent={listFooter}
        />
      )}

      {/* Image Viewer */}
      <ImageViewer
        visible={viewerVisible}
        memories={allMemories}
        initialIndex={selectedMemoryIndex}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: { ...(TYPOGRAPHY.h2 as object), color: COLORS.brandYellow } as any,
  headerSubtitle: {
    ...(TYPOGRAPHY.caption as object),
    color: COLORS.textSecondary,
    marginTop: 2,
  } as any,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  searchPlaceholder: {
    ...(TYPOGRAPHY.body2 as object),
    color: COLORS.textSecondary,
  } as any,
  toggleRow: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'flex-start',
  },
});
