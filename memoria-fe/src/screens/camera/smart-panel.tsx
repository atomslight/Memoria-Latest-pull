import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { api } from '../../utils/api';

type Mood = '😊 Happy' | '💪 Hustle' | '🌿 Calm' | '🌅 Nostalgic' | '🎉 Excited';
type Cluster = 'Friends' | 'Family' | 'Work' | 'Travel' | 'Solo';

const MOODS: Mood[] = ['😊 Happy', '💪 Hustle', '🌿 Calm', '🌅 Nostalgic', '🎉 Excited'];
const CLUSTERS: Cluster[] = ['Friends', 'Family', 'Work', 'Travel', 'Solo'];

export default function SmartPanelScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const uri: string | undefined = route.params?.uri;

  const [caption, setCaption] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [locationName, setLocationName] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setCaption('A beautiful moment captured in time ✨');
    setGeneratingCaption(false);
  };

  const handleSaveToDevice = () => {
    Alert.alert('Saved!', 'Photo saved to your device.');
  };

  const handleUpload = async () => {
    if (!uri) return;
    setUploading(true);
    try {
      const formData = new FormData();
      const fileName = uri.split('/').pop() ?? 'photo.jpg';
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);

      if (caption.trim()) formData.append('caption', caption.trim());
      if (selectedMood) formData.append('mood', selectedMood);
      if (selectedCluster) formData.append('cluster', selectedCluster);
      if (locationName.trim()) formData.append('locationName', locationName.trim());

      await api.memories.upload(formData);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Panel ✨</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
          )}
        </View>

        {/* Caption section */}
        <Text style={styles.sectionLabel}>CAPTION</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateCaption}
          disabled={generatingCaption}
          activeOpacity={0.8}
        >
          {generatingCaption ? (
            <ActivityIndicator size="small" color={COLORS.brandYellow} />
          ) : (
            <Text style={styles.generateButtonText}>✨ Generate with AI</Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption..."
          placeholderTextColor={COLORS.inputPlaceholder}
          multiline
          textAlignVertical="top"
        />

        {/* Mood section */}
        <Text style={styles.sectionLabel}>MOOD</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood}
              onPress={() => setSelectedMood(selectedMood === mood ? null : mood)}
              style={[styles.chip, selectedMood === mood && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedMood === mood && styles.chipTextActive]}>
                {mood}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cluster section */}
        <Text style={styles.sectionLabel}>CLUSTER</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CLUSTERS.map((cluster) => (
            <TouchableOpacity
              key={cluster}
              onPress={() => setSelectedCluster(selectedCluster === cluster ? null : cluster)}
              style={[styles.chip, selectedCluster === cluster && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedCluster === cluster && styles.chipTextActive]}>
                {cluster}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Location */}
        {showLocationInput ? (
          <TextInput
            style={styles.locationInput}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Enter location..."
            placeholderTextColor={COLORS.inputPlaceholder}
            autoFocus
          />
        ) : (
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationInput(true)}
          >
            <Text style={styles.locationChipText}>📍 Add Location</Text>
          </TouchableOpacity>
        )}

        {/* Bottom action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveToDevice}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Save to Device</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={styles.uploadButtonText}>Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090B',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // Thumbnail
  thumbnailContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.surface,
  },

  // Section label
  sectionLabel: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  // Generate button
  generateButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: SPACING.sm,
    minWidth: 44,
    alignItems: 'center',
  },
  generateButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.brandYellow,
  },

  // Caption input
  captionInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    minHeight: 80,
    marginBottom: SPACING.lg,
    textAlignVertical: 'top',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: COLORS.brandYellow,
  },
  chipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.black,
    fontWeight: '600',
  },

  // Location
  locationChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: SPACING.lg,
  },
  locationChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  locationInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 8,
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
  uploadButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
    fontWeight: '600',
  },
});
