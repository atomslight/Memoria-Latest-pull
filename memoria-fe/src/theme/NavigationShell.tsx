import React from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { RootNavigator } from '../navigation/RootNavigator';
import { useTheme } from './ThemeContext';

export function NavigationShell() {
  const { colors, resolvedScheme } = useTheme();
  const base = resolvedScheme === 'dark' ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.brandPrimary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
      <Toast />
    </NavigationContainer>
  );
}
