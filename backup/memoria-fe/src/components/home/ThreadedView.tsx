import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import type { Memory } from '../../types/memory';

interface ThreadedViewProps {
  allMemories: Memory[];
  onMemoryPress: (memory: Memory) => void;
  onEndReached: () => void;
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  ListFooterComponent?: React.ReactElement | null;
}

export function ThreadedView({
  allMemories,
  onMemoryPress,
  onEndReached,
  refreshControl,
  ListFooterComponent,
}: ThreadedViewProps) {
  const renderItem = ({ item }: { item: Memory }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onMemoryPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardDate}>
          {new Date(item.capturedAt || item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Image
        source={{ uri: item.thumbnailMedium || item.thumbnailSmall }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      {item.caption ? (
        <Text style={styles.cardCaption} numberOfLines={3}>
          {item.caption}
        </Text>
      ) : (
        <Text style={styles.cardCaptionPending}>Analyzing...</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <FlashList
      data={allMemories}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  cardDate: { ...(TYPOGRAPHY.caption as object), color: COLORS.textSecondary } as any,
  cardImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: SPACING.sm },
  cardCaption: { ...(TYPOGRAPHY.body2 as object), color: COLORS.white } as any,
  cardCaptionPending: {
    ...(TYPOGRAPHY.body2 as object),
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  } as any,
});
