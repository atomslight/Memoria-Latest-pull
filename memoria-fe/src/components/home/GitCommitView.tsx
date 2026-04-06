import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';
import type { TimelineSection } from '../../utils/timeline';
import type { Memory } from '../../types/memory';

interface GitCommitViewProps {
  sections: TimelineSection[];
  onMemoryPress: (memory: Memory) => void;
  onEndReached: () => void;
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
  ListFooterComponent?: React.ReactElement | null;
}

type ClusterGroup = { cluster: string; memories: Memory[]; relativeTime: string };

export function GitCommitView({
  sections,
  onMemoryPress,
  onEndReached,
  refreshControl,
  ListFooterComponent,
}: GitCommitViewProps) {
  const clusterGroups: ClusterGroup[] = React.useMemo(() => {
    const allMemories = sections.flatMap((s) => s.memories);
    const map = new Map<string, Memory[]>();
    for (const m of allMemories) {
      const key = (m as any).cluster || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).map(([cluster, memories]) => ({
      cluster,
      memories,
      relativeTime: getRelativeTime(
        memories[0]?.capturedAt
          ? String(memories[0].capturedAt)
          : String(memories[0]?.createdAt)
      ),
    }));
  }, [sections]);

  const renderItem = ({ item }: { item: ClusterGroup }) => (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={styles.clusterName}>{item.cluster}</Text>
        <Text style={styles.relativeTime}>{item.relativeTime}</Text>
      </View>
      {item.memories.map((memory, idx) => (
        <View key={memory.id} style={styles.commitRow}>
          <View style={styles.connectorCol}>
            {idx < item.memories.length - 1 && <View style={styles.connectorLine} />}
            <View style={styles.commitDot} />
          </View>
          <View style={styles.commitContent}>
            <TouchableOpacity onPress={() => onMemoryPress(memory)}>
              <Text style={styles.commitCaption} numberOfLines={2}>
                {memory.caption || 'Untitled memory'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.commitDate}>
              {new Date(memory.capturedAt || memory.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <FlashList
      data={clusterGroups}
      renderItem={renderItem}
      keyExtractor={(item) => item.cluster}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={refreshControl}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}
    />
  );
}

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const styles = StyleSheet.create({
  group: { marginBottom: SPACING.lg },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clusterName: {
    ...(TYPOGRAPHY.body2 as object),
    color: COLORS.white,
    fontWeight: '600',
  } as any,
  relativeTime: { ...(TYPOGRAPHY.caption as object), color: COLORS.textSecondary } as any,
  commitRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  connectorCol: { width: 16, alignItems: 'center', position: 'relative' },
  connectorLine: {
    position: 'absolute',
    top: 8,
    bottom: -SPACING.sm,
    width: 2,
    backgroundColor: COLORS.surfaceLight,
  },
  commitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brandYellow,
    marginTop: 4,
    zIndex: 1,
  },
  commitContent: { flex: 1 },
  commitCaption: {
    ...(TYPOGRAPHY.body2 as object),
    color: COLORS.white,
    marginBottom: 2,
  } as any,
  commitDate: { ...(TYPOGRAPHY.caption as object), color: COLORS.textSecondary } as any,
});
