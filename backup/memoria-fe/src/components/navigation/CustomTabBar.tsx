import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabButton } from './TabButton';
import { BORDER_RADIUS } from '../../constants';
import { useAppTheme } from '../../theme/ThemeContext';

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useAppTheme();
  
  const handleTabPress = (route: (typeof state.routes)[number]) => {
    try {
      navigation.navigate(route.name);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fall back to home tab
      navigation.navigate('index');
    }
  };
  
  return (
    <View
      style={[
        styles.tabBar,
        {
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
          backgroundColor: c.surface,
          borderTopColor: c.border,
        },
      ]}
      testID="custom-tab-bar"
    >
      {state.routes.map((route, index) => (
        <TabButton
          key={route.key}
          route={route}
          index={index}
          isActive={state.index === index}
          onPress={() => handleTabPress(route)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
