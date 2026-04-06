import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../constants/colors';
import { BORDER_RADIUS } from '../constants/shadows';
import { SPACING } from '../constants/spacing';

interface PermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionModal({ visible, onAllow, onDeny }: PermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="camera-outline"
              size={48}
              color={COLORS.textPrimary}
            />
          </View>

          <Text style={styles.title}>
            Memoria would like to access your photos
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              onPress={onAllow}
              style={styles.allowButton}
              accessibilityRole="button"
              accessibilityLabel="Allow Access"
            >
              <Text style={styles.allowButtonText}>Allow Access</Text>
            </Pressable>

            <Pressable
              onPress={onDeny}
              style={styles.denyButton}
              accessibilityRole="button"
              accessibilityLabel="Don't Allow"
            >
              <Text style={styles.denyButtonText}>Don't Allow</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  allowButton: {
    width: '100%',
    height: SPACING.buttonHeight,
    backgroundColor: '#D4D4D8',
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  denyButton: {
    width: '100%',
    height: SPACING.buttonHeight,
    backgroundColor: COLORS.transparent,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});
