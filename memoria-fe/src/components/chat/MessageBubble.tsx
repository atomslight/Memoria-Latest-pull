import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants';

interface MessageBubbleProps {
  text: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
}

export function MessageBubble({ text, role, isStreaming }: MessageBubbleProps) {
  const isUser = role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        { opacity: fadeAnim },
      ]}
    >
      {isUser ? (
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{text}</Text>
        </View>
      ) : (
        <View style={styles.assistantRow}>
          <Text style={styles.assistantText}>{text}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  userText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  assistantRow: {
    maxWidth: '92%',
    paddingVertical: 4,
  },
  assistantText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textPrimary,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
});
