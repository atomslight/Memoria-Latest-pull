/**
 * LoadingFooter Component
 * 
 * Displays a loading indicator at the bottom of the timeline
 * when fetching more memories during pagination.
 * 
 * Requirements: 3.3, 10.1
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../constants';

export function LoadingFooter() {
  return (
    <View style={styles.container}>
      <ActivityIndicator 
        size="large" 
        color={COLORS.brandYellow}
        testID="loading-footer-spinner"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
