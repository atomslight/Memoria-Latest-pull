import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getCurrentLocation } from '../../utils/location';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';
import { api } from '../../utils/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Ratio = '1:1' | '4:3' | '16:9' | 'Original';
type Mood = '😊 Happy' | '😌 Calm' | '🎉 Excited' | '😢 Nostalgic' | '😴 Tired' | '❤️ Loved';

const RATIOS: Ratio[] = ['1:1', '4:3', '16:9', 'Original'];

const MOODS: Mood[] = ['😊 Happy', '😌 Calm', '🎉 Excited', '😢 Nostalgic', '😴 Tired', '❤️ Loved'];

function getAspectRatio(ratio: Ratio): number | undefined {
  switch (ratio) {
    case '1:1': return 1;
    case '4:3': return 4 / 3;
    case '16:9': return 16 / 9;
    default: return undefined;
  }
}

export default function PostCaptureScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const uri: string | undefined = route.params?.uri;

  const [activeRatio, setActiveRatio] = useState<Ratio>('Original');
  const [caption, setCaption] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    getCurrentLocation().then(setLocation).catch(() => setLocation(null));
  }, []);

  const aspectRatio = getAspectRatio(activeRatio);
  const imageContainerStyle = aspectRatio
    ? { width: '100%' as const, aspectRatio }
    : { width: '100%' as const, height: SCREEN_HEIGHT * 0.55 };

  const handleSave = async () => {
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
		//If caption is being sent?
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      } //If caption is being sent?  (Here i have to make it detect automatically mood)
      if (selectedMood) {
        formData.append('mood', selectedMood);
      }
	  if (location) {
		// Convert { latitude: 12.34, longitude: 56.78 } into a string
		formData.append('locationCoordinates', JSON.stringify(location));
		}
      await api.memories.upload(formData);
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Upload Failed', message);
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = () => {
    navigation.goBack();
  };

  const handleAI = () => {
    if (uri) {
      navigation.navigate('CameraSmartPanel', { uri });
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Image preview ─────────────────────────────────────────────────── */}
      <View style={styles.imageWrapper}>
        <View style={imageContainerStyle}>
          {uri ? (
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, styles.imagePlaceholder]} />
          )}
        </View>
      </View>

      {/* ── Header row (absolute, over image) ────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Preview</Text>

        <TouchableOpacity onPress={handleAI} style={styles.aiButton}>
          <Text style={styles.aiButtonText}>✨ AI</Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom action panel ───────────────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.panelWrapper}
      >
        <ScrollView
          style={styles.panel}
          contentContainerStyle={styles.panelContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Ratio selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ratioRow}
          >
            {RATIOS.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setActiveRatio(r)}
                style={[styles.ratioChip, activeRatio === r && styles.ratioChipActive]}
              >
                <Text style={[styles.ratioChipText, activeRatio === r && styles.ratioChipTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Caption input */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={(t) => setCaption(t.slice(0, 200))}
              placeholder="Add a caption..."
              placeholderTextColor={COLORS.inputPlaceholder}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCounter}>{caption.length}/200</Text>
          </View>

          {/* Mood selector */}
          <Text style={styles.moodLabel}>MOOD</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodRow}
          >
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMood(selectedMood === m ? null : m)}
                style={[styles.moodChip, selectedMood === m && styles.moodChipActive]}
              >
                <Text style={[styles.moodChipText, selectedMood === m && styles.moodChipTextActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Save Memory button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={styles.saveButtonText}>Save Memory</Text>
            )}
          </TouchableOpacity>

          {/* Discard button */}
          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscard}
            disabled={uploading}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Image preview ──────────────────────────────────────────────────────────
  imageWrapper: {
    width: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    backgroundColor: COLORS.surface,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  aiButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.brandYellow,
    fontWeight: '600',
  },

  // ── Bottom panel ───────────────────────────────────────────────────────────
  panelWrapper: {
    flex: 1,
  },
  panel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  panelContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // ── Ratio chips ────────────────────────────────────────────────────────────
  ratioRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  ratioChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ratioChipActive: {
    backgroundColor: COLORS.brandYellow,
  },
  ratioChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  ratioChipTextActive: {
    color: COLORS.black,
    fontWeight: '600',
  },

  // ── Caption ────────────────────────────────────────────────────────────────
  captionContainer: {
    marginBottom: SPACING.md,
  },
  captionInput: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 12,
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCounter: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // ── Mood ───────────────────────────────────────────────────────────────────
  moodLabel: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  moodRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  moodChip: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  moodChipActive: {
    backgroundColor: COLORS.brandYellow,
  },
  moodChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  moodChipTextActive: {
    color: COLORS.black,
    fontWeight: '600',
  },

  // ── Action buttons ─────────────────────────────────────────────────────────
  saveButton: {
    height: 56,
    backgroundColor: COLORS.brandYellow,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  saveButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
    fontWeight: '600',
  },
  discardButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  discardButtonText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.error,
  },
});
