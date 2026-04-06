import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BORDER_RADIUS } from '../../constants/shadows';
import { SPACING } from '../../constants/spacing';
import { useAppTheme } from '../../theme/ThemeContext';

interface AuthButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export function AuthButton({
  onPress,
  label,
  disabled = false,
  loading = false,
}: AuthButtonProps) {
  const c = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(1)).current;

  const isInactive = disabled || loading;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.6,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      {/* Glow layer — sits behind the button */}
      {!isInactive && (
        <Animated.View
          style={[
            styles.glowLayer,
            {
              opacity: glowOpacity,
              backgroundColor: c.brandYellow,
              shadowColor: c.brandYellow,
            },
          ]}
          pointerEvents="none"
        />
      )}

      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInactive}
        style={[
          styles.button,
          isInactive
            ? { backgroundColor: c.surfaceLight }
            : { backgroundColor: c.brandYellow },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isInactive }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={c.black} />
        ) : (
          <Text
            style={[
              styles.label,
              isInactive
                ? { color: c.textTertiary }
                : { color: c.black },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.lg,
    // The glow: a soft yellow shadow spreading outward
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  button: {
    width: '100%',
    height: SPACING.buttonHeight,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
