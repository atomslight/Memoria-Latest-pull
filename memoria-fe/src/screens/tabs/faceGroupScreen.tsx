import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { BORDER_RADIUS } from '../../constants/shadows';
import api from '../../utils/api';


export default function FaceGroupScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params;

  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await api.get(`/face-groups/${id}`);
      setGroup(data);
      setNameInput(data.name || '');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch face group details');
    } finally {
      setIsLoading(false);
    }
  };

  const saveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === group?.name) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await api.patch(`/face-groups/${id}`, { name: nameInput.trim() });
      setGroup({ ...group, name: nameInput.trim() });
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      // fallback
    } finally {
      setIsSaving(false);
    }
  };

  const renderFace = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.faceCard}
        onPress={() => navigation.navigate('Memory', { id: item.photoId })}
      >
        <Image
          source={{ uri: item.photo?.storagePath }}
          style={styles.faceImage}
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.brandYellow} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Group not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroup}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              selectTextOnFocus
              onSubmitEditing={saveName}
              returnKeyType="done"
            />
            {isSaving ? (
              <ActivityIndicator size="small" color={COLORS.brandYellow} style={styles.saveIcon} />
            ) : (
              <TouchableOpacity onPress={saveName} style={styles.saveIcon}>
                <Ionicons name="checkmark" size={24} color={COLORS.brandYellow} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{group.name || 'Unnamed'}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIcon}>
              <Ionicons name="pencil" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={group.faces}
        keyExtractor={(item) => item.id}
        renderItem={renderFace}
        numColumns={3}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
      />
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
    height: 60,
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  editIcon: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    ...TYPOGRAPHY.body1,
  },
  saveIcon: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
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
  gridContent: {
    padding: SPACING.xs,
  },
  row: {
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  faceCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
});
