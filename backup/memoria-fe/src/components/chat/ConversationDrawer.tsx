import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ConversationDrawerProps {
  visible: boolean;
  conversations: Conversation[];
  onSelect: (conversationId: string) => void;
  onNew: () => void;
  onDelete: (conversationId: string) => void;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ConversationDrawer({
  visible,
  conversations,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: ConversationDrawerProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.newButton} onPress={onNew} accessibilityRole="button">
          <Ionicons name="add" size={18} color={COLORS.black} />
          <Text style={styles.newButtonText}>New conversation</Text>
        </TouchableOpacity>

        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => { onSelect(item.id); onClose(); }}
              onLongPress={() => onDelete(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint="Long press to delete"
            >
              <Ionicons name="chatbubble-outline" size={16} color={COLORS.textTertiary} style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.rowTime}>{timeAgo(item.updatedAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={32} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No conversations yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
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
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    backgroundColor: COLORS.brandYellow,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  newButtonText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
    color: COLORS.black,
  },
  list: {
    paddingHorizontal: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 2,
  },
  rowIcon: {
    marginRight: SPACING.sm,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textPrimary,
  },
  rowTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  empty: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textTertiary,
  },
});
