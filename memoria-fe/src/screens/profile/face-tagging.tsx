import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/shadows';
import { useFaceGroupStore, FaceGroup } from '../../stores/faceGroupStore';

export default function FaceTaggingScreen() {
  const navigation = useNavigation<any>();
  const { groups, isLoading, error, fetchGroups, updateGroup } = useFaceGroupStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupPress = (group: FaceGroup) => {
    navigation.navigate('FaceGroupScreen', { id: group.id });
  };

  const renderGroup = ({ item }: { item: FaceGroup }) => {
    return (
      <TouchableOpacity style={styles.groupCard} onPress={() => handleGroupPress(item)}>
        <View style={styles.groupIconContainer}>
          <Ionicons name="person" size={24} color={COLORS.textSecondary} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name || 'Unnamed'}</Text>
          <Text style={styles.groupCount}>{item._count?.faces || 0} faces</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Face Tagging</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brandYellow} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroups}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="scan-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No Faces Found</Text>
              <Text style={styles.emptySubtitle}>
                Upload photos with faces to see them grouped here automatically.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
  },
  groupCount: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.brandYellow,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
