import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants';

interface PhotoCardProps {
  photoId: string;
  thumbnailUrl: string;
  caption: string | null;
  capturedAt: string;
}

export function PhotoCard({ photoId, thumbnailUrl, caption, capturedAt }: PhotoCardProps) {
  const navigation = useNavigation<any>();

  const formattedDate = capturedAt
    ? new Date(capturedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Memory', { id: photoId })}
      accessibilityRole="button"
      accessibilityLabel={caption ?? 'Photo memory'}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        {caption ? (
          <Text style={styles.caption} numberOfLines={2}>{caption}</Text>
        ) : null}
        {formattedDate ? (
          <Text style={styles.date}>{formattedDate}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    padding: SPACING.sm,
    gap: 4,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  date: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    fontSize: 11,
  },
});
