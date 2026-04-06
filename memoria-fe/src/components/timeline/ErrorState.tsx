import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { BORDER_RADIUS } from '../../constants/shadows';

/**
 * ErrorState Component
 * 
 * Displays error message with retry option when timeline fails to load.
 * Handles different error types (network, server, timeout).
 * 
 * Requirements: 9.1, 9.2, 9.5, 10.1, 10.2
 */

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Determines the appropriate error message based on error type
 */
function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'No internet connection. Please check your network and try again.';
  }
  
  // Timeout errors
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Server errors
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return 'Server error. Please try again later.';
  }
  
  // Default error message
  return error.message || 'Failed to load memories. Please try again.';
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const errorMessage = getErrorMessage(error);
  
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{errorMessage}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Try Again"
        accessibilityHint="Retries loading your memories"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Try Again</Text>
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
  message: {
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
