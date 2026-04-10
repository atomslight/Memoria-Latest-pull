import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

interface ChatInputProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
}

export function ChatInput({ onSend, isStreaming }: ChatInputProps) {
  const [input, setInput] = useState('');
  const sendScale = useRef(new Animated.Value(1)).current;

  const canSend = !isStreaming && input.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    // Subtle press animation
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(sendScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onSend(input.trim());
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.outerContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your memories..."
            placeholderTextColor={COLORS.textTertiary}
            selectionColor={COLORS.brandYellow}
            multiline
            maxLength={1000}
            returnKeyType="default"
            blurOnSubmit={false}
            accessibilityLabel="Message input"
          />
        </View>
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Attach file"
          >
            <Ionicons name="add" size={22} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  canSend ? styles.sendButtonActive : styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!canSend}
                accessibilityRole="button"
                accessibilityLabel="Send message"
                accessibilityState={{ disabled: !canSend }}
              >
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={canSend ? COLORS.black : COLORS.textTertiary}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
    paddingHorizontal: SPACING.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLight,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.brandYellow,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
});
