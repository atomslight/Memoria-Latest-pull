import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchMemoryDetailRequest } from '../redux/reducers/memoryDetail';
import {
  fetchMemoriesTimelinePageRequest,
} from '../redux/reducers/memoriesTimeline';
import { fetchMemoriesListTabRequest } from '../redux/reducers/memoriesListTab';
import { api } from '../utils/api';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants';
import type { Memory } from '../types/memory';

export default function MemoryDetailScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string | undefined = route.params?.id;

  const entity = useAppSelector((s) =>
    id ? s.memoryDetail.entities[id] : undefined,
  );
  const loading = useAppSelector((s) =>
    id ? s.memoryDetail.loadingIds[id] : false,
  );
  const loadError = useAppSelector((s) =>
    id ? s.memoryDetail.errors[id] : undefined,
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchMemoryDetailRequest({ id }));
    }
  }, [dispatch, id]);

  const memory = useMemo((): Memory | undefined => {
    if (!entity || typeof entity !== 'object') return undefined;
    const e = entity as { memory?: Memory };
    return e.memory ?? (entity as Memory);
  }, [entity]);

  const isLoading = !!loading && !entity;
  const error = loadError ? new Error(loadError) : null;

  const handleDelete = () => {
    Alert.alert('Delete Memory', 'Are you sure you want to delete this memory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.memories.delete(id!);
            dispatch(fetchMemoriesTimelinePageRequest({ page: 1, reset: true }));
            dispatch(fetchMemoriesListTabRequest());
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

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
        <Text style={styles.headerTitle}>Memory</Text>
        {memory && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Delete memory"
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        )}
        {!memory && <View style={styles.backButton} />}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brandYellow} />
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load memory</Text>
        </View>
      )}

      {memory && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Photo */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: memory.thumbnailLarge || memory.thumbnailMedium }}
              style={styles.image}
              resizeMode="contain"
              accessibilityLabel={memory.caption || 'Memory photo'}
            />
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            {/* Caption */}
            {memory.captionStatus === 'completed' && memory.caption && (
              <Text style={styles.caption}>{memory.caption}</Text>
            )}
            {memory.captionStatus === 'pending' && (
              <View style={styles.captionRow}>
                <ActivityIndicator size="small" color={COLORS.brandYellow} />
                <Text style={styles.captionPending}>Generating caption...</Text>
              </View>
            )}
            {memory.captionStatus === 'failed' && (
              <Text style={styles.captionFailed}>Caption unavailable</Text>
            )}

            <View style={styles.divider} />

            {/* Date */}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textTertiary} />
              <Text style={styles.metaText}>
                {memory.capturedAt
                  ? new Date(memory.capturedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown date'}
              </Text>
            </View>

            {/* File info */}
            {memory.fileSize && (
              <View style={styles.metaRow}>
                <Ionicons name="image-outline" size={16} color={COLORS.textTertiary} />
                <Text style={styles.metaText}>
                  {(memory.fileSize / 1024 / 1024).toFixed(1)} MB
                  {memory.mimeType ? ` · ${memory.mimeType}` : ''}
                </Text>
              </View>
            )}

            {/* Dimensions */}
            {memory.width && memory.height && (
              <View style={styles.metaRow}>
                <Ionicons name="resize-outline" size={16} color={COLORS.textTertiary} />
                <Text style={styles.metaText}>
                  {memory.width} × {memory.height}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.black,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  caption: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  captionPending: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  captionFailed: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  metaText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
