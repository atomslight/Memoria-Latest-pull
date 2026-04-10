import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import type { TimelineSection } from '../../utils/timeline';
import type { Memory } from '../../types/memory';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.xs) / 2; // 2-column

interface GridViewProps {
  sections: TimelineSection[];
  allMemories: Memory[];
  onMemoryPress: (memory: Memory) => void;
  onEndReached: () => void;
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  ListFooterComponent?: React.ReactElement | null;
}

type HeaderItem = { type: 'header'; date: string; count: number };
type RowItem = { type: 'row'; memories: [Memory, Memory | null] };
type ListItem = HeaderItem | RowItem;

export function GridView({
  sections,
  allMemories,
  onMemoryPress,
  onEndReached,
  refreshControl,
  ListFooterComponent,
}: GridViewProps) {
  const listData: ListItem[] = React.useMemo(() => {
    const items: ListItem[] = [];
    for (const section of sections) {
      items.push({ type: 'header', date: section.displayDate, count: section.memories.length });
      for (let i = 0; i < section.memories.length; i += 2) {
        items.push({
          type: 'row',
          memories: [section.memories[i], section.memories[i + 1] ?? null],
        });
      }
    }
    return items;
  }, [sections]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderAccent} />
          <Text style={styles.sectionHeaderText}>{item.date}</Text>
          <Text style={styles.sectionHeaderCount}>{item.count}</Text>
        </View>
      );
    }
    return (
      <View style={styles.row}>
        {item.memories.map((memory, idx) =>
          memory ? (
            <TouchableOpacity
              key={memory.id}
              style={styles.cell}
              onPress={() => onMemoryPress(memory)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: memory.thumbnailMedium || memory.thumbnailSmall }}
                style={styles.cellImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View key={`empty-${idx}`} style={styles.cell} />
          )
        )}
      </View>
    );
  };

  return (
    <FlashList
      data={listData}
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        item.type === 'header' ? `header-${item.date}` : `row-${index}`
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      ListFooterComponent={ListFooterComponent}
      drawDistance={400}
      contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  sectionHeaderAccent: {
    width: 3,
    height: 16,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 2,
  },
  sectionHeaderText: {
    ...(TYPOGRAPHY.body2 as object),
    color: COLORS.white,
    fontWeight: '600',
    flex: 1,
  } as any,
  sectionHeaderCount: { ...(TYPOGRAPHY.caption as object), color: COLORS.textSecondary } as any,
  row: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs },
  cell: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  cellImage: { width: '100%', height: '100%' },
});
