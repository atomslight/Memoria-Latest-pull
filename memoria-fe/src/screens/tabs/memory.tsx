import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useWindowDimensions, RefreshControl, Alert, ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchMemoriesListTabRequest } from '../../redux/reducers/memoriesListTab';
import {
  fetchMemoriesTimelinePageRequest,
} from '../../redux/reducers/memoriesTimeline';
import { api } from '../../utils/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import type { Memory } from '../../types/memory';

export default function MemoryScreen() {
  const { width } = useWindowDimensions();
  const dispatch = useAppDispatch();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isFocused = useIsFocused();
  const { data, isLoading, error } = useAppSelector((s) => s.memoriesListTab);

  useEffect(() => {
    if (isFocused) {
      dispatch(fetchMemoriesListTabRequest());
    }
  }, [isFocused, dispatch]);

  const memories = data?.memories || [];
  const itemSize = (width - SPACING.sm * 4) / 3;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(fetchMemoriesListTabRequest());
    setRefreshing(false);
  }, [dispatch]);

  const handleDelete = (memory: Memory) => {
    Alert.alert('Delete Memory', 'Are you sure you want to delete this memory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.memories.delete(memory.id);
            setSelectedMemory(null);
            dispatch(fetchMemoriesListTabRequest());
            dispatch(fetchMemoriesTimelinePageRequest({ page: 1, reset: true }));
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete memory');
          }
        },
      },
    ]);
  };

  // Detail view
  if (selectedMemory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedMemory(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Memory Detail</Text>
          <TouchableOpacity onPress={() => handleDelete(selectedMemory)} style={styles.backButton}>
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </View>
        <View style={styles.detailImageContainer}>
          <Image
            source={{ uri: selectedMemory.thumbnailLarge || selectedMemory.thumbnailMedium }}
            style={styles.detailImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.detailInfo}>
          {selectedMemory.captionStatus === 'completed' && selectedMemory.caption && (
            <Text style={styles.detailCaption}>{selectedMemory.caption}</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading && memories.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brandYellow} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => dispatch(fetchMemoriesListTabRequest())}>
          <Text style={styles.retry}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>All Memories</Text>
      </View>
      <FlatList
        data={memories}
        numColumns={3}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.brandYellow} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedMemory(item)}
            style={[styles.thumbWrap, { width: itemSize, height: itemSize }]}
          >
            <Image
              source={{ uri: item.thumbnailMedium || item.thumbnailSmall }}
              style={styles.thumb}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: SPACING.md },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textPrimary } as any,
  row: { gap: SPACING.sm, marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm },
  gridContent: { paddingBottom: SPACING.xl },
  thumbWrap: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.surface },
  thumb: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  errorText: { ...TYPOGRAPHY.body1, color: COLORS.error, marginBottom: SPACING.md } as any,
  retry: { ...TYPOGRAPHY.body1, color: COLORS.brandYellow } as any,
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: { padding: SPACING.xs },
  detailTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary } as any,
  detailImageContainer: { flex: 1, backgroundColor: COLORS.black },
  detailImage: { width: '100%', height: '100%' },
  detailInfo: { padding: SPACING.md },
  detailCaption: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary } as any,
});
