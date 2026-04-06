import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING } from '../../constants';
import type { ViewMode } from '../../stores/preferencesStore';

interface ViewToggleProps {
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}

const MODES: { mode: ViewMode; icon: string }[] = [
  { mode: 'grid', icon: 'grid-outline' },
  { mode: 'threaded', icon: 'list-outline' },
  { mode: 'gitcommit', icon: 'git-commit-outline' },
];

export function ViewToggle({ viewMode, onChangeViewMode }: ViewToggleProps) {
  return (
    <View style={styles.container}>
      {MODES.map(({ mode, icon }) => (
        <TouchableOpacity
          key={mode}
          onPress={() => onChangeViewMode(mode)}
          style={[styles.button, viewMode === mode && styles.buttonActive]}
          hitSlop={4}
        >
          <Ionicons
            name={icon}
            size={18}
            color={viewMode === mode ? COLORS.brandYellow : COLORS.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    padding: 4,
    gap: 2,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: COLORS.surfaceLight,
  },
});
