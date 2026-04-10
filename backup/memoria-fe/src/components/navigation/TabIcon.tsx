import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';

interface TabIconProps {
  name: string;
  isActive: boolean;
  color?: string;
}

export function TabIcon({ name, isActive, color }: TabIconProps) {
  const c = useAppTheme();
  const iconColor = color || (isActive ? c.brandYellow : c.textSecondary);
  const iconOpacity = color ? 1 : (isActive ? 1 : 0.5);
  
  // Simplified version without animations - add back after fixing native modules
  const glowStyle = isActive ? {
    shadowColor: c.brandYellow,
    shadowRadius: 8,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 0 },
  } : {};
  
  return (
    <View style={[styles.iconContainer, glowStyle]}>
      <Ionicons
        name={name}
        size={24}
        color={iconColor}
        style={{ opacity: iconOpacity }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
