import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { TabIcon } from './TabIcon';
import { TYPOGRAPHY, SPACING } from '../../constants';
import { useAppTheme } from '../../theme/ThemeContext';

interface TabButtonProps {
  route: { key: string; name: string };
  index: number;
  isActive: boolean;
  onPress: () => void;
}

interface TabConfig {
  name: string;
  icon: 'home' | 'albums' | 'add-circle' | 'camera' | 'settings' | 'sparkles';
  label: string;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: { name: 'index', icon: 'home', label: 'Home' },
  circles: { name: 'circles', icon: 'albums', label: 'Circles' },
  upload: { name: 'upload', icon: 'add-circle', label: 'Upload' },
  threads: { name: 'threads', icon: 'sparkles', label: 'Memoria AI' },
  settings: { name: 'settings', icon: 'settings', label: 'Settings' },
};

export function TabButton({ route, index, isActive, onPress }: TabButtonProps) {
  const c = useAppTheme();
  const config = TAB_CONFIGS[route.name];
  const isUploadTab = route.name === 'upload';
  
  const handlePress = async () => {
    try {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    } catch (error) {
      // Gracefully degrade - haptics not critical
      console.warn('Haptic feedback not available:', error);
    }
    onPress();
  };
  
  // Special styling for upload tab
  if (isUploadTab) {
    return (
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handlePress}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${config.label} tab`}
        testID={`tab-button-${route.name}`}
      >
        <View
          style={[
            styles.uploadIconContainer,
            {
              backgroundColor: c.brandYellow,
              shadowColor: c.brandYellow,
            },
            isActive && {
              backgroundColor: c.brandYellowDark,
              transform: [{ scale: 1.05 }],
            },
          ]}
        >
          <TabIcon
            name={config.icon}
            isActive={true}
            color={c.white}
          />
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${config.label} tab`}
      testID={`tab-button-${route.name}`}
    >
      <TabIcon
        name={config.icon}
        isActive={isActive}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: c.textSecondary },
          isActive && { color: c.brandYellow },
        ]}
        testID={`tab-label-${route.name}`}
      >
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 44,
    minWidth: 44,
  },
  tabLabel: {
    ...TYPOGRAPHY.tabLabel,
    marginTop: SPACING.xs,
  },
  uploadButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 44,
    minWidth: 44,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
