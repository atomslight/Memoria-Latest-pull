import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCreateCircle } from '../../hooks/useCircles';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { BORDER_RADIUS, SHADOWS } from '../../constants/shadows';
import { EmojiPicker } from '../../components/circles/EmojiPicker';

export default function CreateCircleScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🔵');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const { mutate: createCircle, isPending } = useCreateCircle();

  const scale = useRef(new Animated.Value(1)).current;

  const canSubmit = name.trim().length > 0 && !isPending;

  const handlePressIn = () => {
    if (!canSubmit) return;
    Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a circle name.');
      return;
    }
    createCircle(
      { name: trimmedName, description: description.trim() || undefined, emoji },
      {
        onSuccess: () => navigation.goBack(),
        onError: (err) => Alert.alert('Error', err.message || 'Failed to create circle'),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={SPACING.authBreathingRoom}
    >
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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create a Circle</Text>
        <Text style={styles.subheading}>
          A private space to share photos with people you choose.
        </Text>

        {/* Emoji selector */}
        <View style={styles.emojiRow}>
          <TouchableOpacity style={styles.emojiSelector} onPress={() => setShowEmojiPicker(true)} accessibilityRole="button" accessibilityLabel="Choose circle emoji">
            <Text style={styles.emojiSelectorText}>{emoji}</Text>
            <Text style={styles.emojiSelectorHint}>Tap to change</Text>
          </TouchableOpacity>
        </View>

        {/* Name field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Circle Name</Text>
          <View style={[styles.inputWrap, nameFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Family, MBA Friends, Road Trip"
              placeholderTextColor={COLORS.inputPlaceholder}
              maxLength={100}
              autoFocus
              returnKeyType="next"
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              selectionColor={COLORS.brandYellow}
              accessibilityLabel="Circle name"
            />
          </View>
          <Text style={styles.charCount}>{name.length}/100</Text>
        </View>

        {/* Description field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.inputWrap, styles.textAreaWrap, descFocused && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this circle about?"
              placeholderTextColor={COLORS.inputPlaceholder}
              maxLength={500}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
              selectionColor={COLORS.brandYellow}
              accessibilityLabel="Circle description"
            />
          </View>
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>
      </ScrollView>

      {/* Create button — pinned to bottom like auth screens */}
      <View style={styles.footer}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            style={[styles.createBtn, !canSubmit && styles.createBtnDisabled]}
            onPress={handleSubmit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Create circle"
          >
            {isPending ? (
              <ActivityIndicator size="small" color={COLORS.black} />
            ) : (
              <Text style={[styles.createBtnText, !canSubmit && styles.createBtnTextDisabled]}>
                Create Circle
              </Text>
            )}
          </Pressable>
        </Animated.View>
      </View>

      <EmojiPicker
        visible={showEmojiPicker}
        onSelect={setEmoji}
        onClose={() => setShowEmojiPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  heading: {
    ...TYPOGRAPHY.authHeader,
    color: COLORS.brandYellow,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPOGRAPHY.body2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  optional: {
    color: COLORS.textTertiary,
    textTransform: 'none',
    fontWeight: '400',
    fontSize: 11,
  },
  inputWrap: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  inputWrapFocused: {
    borderColor: COLORS.brandYellow,
  },
  textAreaWrap: {
    minHeight: 110,
    paddingTop: SPACING.sm,
  },
  input: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    padding: 0,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  createBtn: {
    height: SPACING.buttonHeight,
    backgroundColor: COLORS.brandYellow,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  createBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  createBtnText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },
  createBtnTextDisabled: {
    color: COLORS.textTertiary,
  },
  emojiRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emojiSelector: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  emojiSelectorText: {
    fontSize: 56,
  },
  emojiSelectorHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
});
