import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useWindowDimensions, RefreshControl, Alert, ActionSheetIOS, Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchMemoriesTrashRequest } from '../../redux/reducers/memoriesTrash';
import {
  fetchMemoriesListTabRequest,
} from '../../redux/reducers/memoriesListTab';
import {
  fetchMemoriesTimelinePageRequest,
} from '../../redux/reducers/memoriesTimeline';
import { api } from '../../utils/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import type { Memory } from '../../types/memory';

export default function TrashScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useAppSelector((s) => s.memoriesTrash);

  useEffect(() => {
    dispatch(fetchMemoriesTrashRequest());
  }, [dispatch]);

  const memories = (data?.memories as Memory[]) || [];
  const itemSize = (width - SPACING.sm * 4) / 3;

  const invalidateMainMemories = useCallback(() => {
    dispatch(fetchMemoriesListTabRequest());
    dispatch(fetchMemoriesTimelinePageRequest({ page: 1, reset: true }));
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(fetchMemoriesTrashRequest());
    setRefreshing(false);
  }, [dispatch]);

  const handleMemoryPress = (memory: Memory) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Restore', 'Delete Permanently'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Restore
            try {
              await api.memories.restore(memory.id);
              await handleRefresh();
              invalidateMainMemories();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to restore memory');
            }
          } else if (buttonIndex === 2) {
            // Delete permanently
            Alert.alert(
              'Delete Permanently',
              'This action cannot be undone. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.memories.permanentDelete(memory.id);
                      await handleRefresh();
                    } catch (error) {
                      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete memory');
                    }
                  },
                },
              ]
            );
          }
        }
      );
    } else {
      // Android fallback
      Alert.alert('Memory Actions', 'Choose an action', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              await api.memories.restore(memory.id);
              await handleRefresh();
              invalidateMainMemories();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to restore memory');
            }
          },
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Permanently',
              'This action cannot be undone. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.memories.permanentDelete(memory.id);
                      await handleRefresh();
                    } catch (error) {
                      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete memory');
                    }
                  },
                },
              ]
            );
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Trash</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading trash...</Text>
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="trash-outline" size={64} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>Trash is empty</Text>
          <Text style={styles.emptyText}>Deleted memories will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
              tintColor={COLORS.brandYellow} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleMemoryPress(item)}
              style={[styles.gridItem, { width: itemSize, height: itemSize }]}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.thumbnailMedium }}
                style={styles.gridImage}
                resizeMode="cover"
              />
              <View style={styles.trashOverlay}>
                <Ionicons name="trash" size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  backButton: { padding: SPACING.sm, width: 40 },
  title: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  loadingText: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyTitle: { ...TYPOGRAPHY.h3, color: COLORS.textPrimary, marginTop: SPACING.md },
  emptyText: { ...TYPOGRAPHY.body1, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
  grid: { padding: SPACING.sm },
  row: { gap: SPACING.xs },
  gridItem: {
    borderRadius: BORDER_RADIUS.sm, overflow: 'hidden',
    marginBottom: SPACING.xs, backgroundColor: COLORS.surface,
  },
  gridImage: { width: '100%', height: '100%' },
  trashOverlay: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
    width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
  },
});
