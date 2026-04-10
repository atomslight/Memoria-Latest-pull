/**
 * EmptyState Preview
 * 
 * This file can be used to visually test the EmptyState component
 * in isolation during development.
 * 
 * To use: Import and render this component in a test screen.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from './EmptyState';
import { COLORS } from '../../constants/colors';

export function EmptyStatePreview() {
  return (
    <View style={styles.container}>
      <EmptyState />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});
