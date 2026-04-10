import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../constants/colors';
import { SPACING } from '../constants/spacing';
import { BORDER_RADIUS } from '../constants/shadows';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GRID_GAP = 4;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

// Placeholder photo colors for the background grid
const PLACEHOLDER_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#1b1b2f', '#2c2c54',
  '#1e272e', '#2d3436', '#0c0c1d', '#1a1a3e', '#22223b',
  '#2b2d42', '#14213d', '#1d3557', '#283618', '#3a0ca3',
  '#240046', '#10002b', '#1b263b', '#0d1b2a', '#1b2838',
  '#212529', '#343a40', '#1a1a2e', '#16213e', '#0f3460',
  '#1b1b2f', '#2c2c54', '#1e272e', '#2d3436', '#0c0c1d',
  '#1a1a3e', '#22223b', '#2b2d42', '#14213d', '#1d3557',
  '#283618', '#3a0ca3', '#240046', '#10002b', '#1b263b',
  '#0d1b2a', '#1b2838', '#212529', '#343a40', '#1a1a2e',
];

// Generate varying heights for masonry effect
const TILE_HEIGHTS = PLACEHOLDER_COLORS.map((_, i) => {
  const heights = [100, 130, 160, 120, 140, 110, 150, 135, 125, 145];
  return heights[i % heights.length];
});

// Total scroll height for the grid content (enough to scroll continuously)
const TOTAL_GRID_HEIGHT = TILE_HEIGHTS.reduce((sum, h) => sum + h + GRID_GAP, 0) / NUM_COLUMNS;

export default function LandingScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow continuous vertical scroll animation
    const animate = () => {
      scrollY.setValue(0);
      Animated.timing(scrollY, {
        toValue: -TOTAL_GRID_HEIGHT,
        duration: 30000,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();

    return () => scrollY.stopAnimation();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brandYellow} />
      </View>
    );
  }

  // When authenticated, RootNavigator switches to the main stack (tabs).

  // Build columns for the 3-column grid
  const columns: { color: string; height: number }[][] = [[], [], []];
  PLACEHOLDER_COLORS.forEach((color, i) => {
    columns[i % NUM_COLUMNS].push({ color, height: TILE_HEIGHTS[i] });
  });

  return (
    <View style={styles.container}>
      {/* Animated photo grid background */}
      <View style={styles.gridContainer}>
        <Animated.View
          style={[
            styles.gridInner,
            { transform: [{ translateY: scrollY }] },
          ]}
        >
          {/* Render twice for seamless loop */}
          {[0, 1].map((pass) => (
            <View key={pass} style={styles.gridRow}>
              {columns.map((column, colIndex) => (
                <View key={`${pass}-${colIndex}`} style={styles.gridColumn}>
                  {column.map((tile, tileIndex) => (
                    <View
                      key={`${pass}-${colIndex}-${tileIndex}`}
                      style={[
                        styles.gridTile,
                        {
                          backgroundColor: tile.color,
                          height: tile.height,
                          width: TILE_WIDTH,
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', COLORS.black]}
        locations={[0, 0.6, 0.85]}
        style={styles.gradient}
      />

      {/* Content overlay */}
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.logo}>Memoria</Text>
          <Text style={styles.headline}>
            Your life's moments, intelligently organized.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.loginButton}
            onPress={() => navigation.navigate('AuthLoginEmail')}
            accessibilityRole="button"
            accessibilityLabel="Login"
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>

          <Pressable
            style={styles.createAccountButton}
            onPress={() => navigation.navigate('AuthSignupEmail')}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            <Text style={styles.createAccountButtonText}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gridInner: {
    flexDirection: 'column',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: GRID_GAP,
  },
  gridColumn: {
    flexDirection: 'column',
    gap: GRID_GAP,
  },
  gridTile: {
    borderRadius: BORDER_RADIUS.sm,
    opacity: 0.6,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  textContainer: {
    marginBottom: SPACING.xl,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.brandYellow,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  headline: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 26,
    opacity: 0.9,
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  loginButton: {
    width: '100%',
    height: SPACING.buttonHeight,
    backgroundColor: COLORS.brandYellow,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  createAccountButton: {
    width: '100%',
    height: SPACING.buttonHeight,
    backgroundColor: COLORS.transparent,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
});
