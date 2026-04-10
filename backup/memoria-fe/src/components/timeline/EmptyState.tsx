import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { BORDER_RADIUS } from '../../constants/shadows';

/**
 * EmptyState Component
 * 
 * Displays when user has no memories in their timeline.
 * Shows helpful message and CTA to upload photos.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.2, 10.3
 */
export function EmptyState() {
  const navigation = useNavigation<any>();
  
  const handleUploadPress = () => {
    // Navigate to the memory (upload) tab
    navigation.navigate('upload');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📸</Text>
      <Text style={styles.title}>No memories yet</Text>
      <Text style={styles.subtitle}>
        Start capturing your moments by uploading your first photo.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleUploadPress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Upload Photos"
        accessibilityHint="Opens the upload screen to add your first photo"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Upload Photos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.brandYellow,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.black,
  },
});
