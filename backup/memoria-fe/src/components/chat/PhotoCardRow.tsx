import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PhotoCard } from './PhotoCard';
import { SPACING } from '../../constants';

interface PhotoResult {
  photoId: string;
  thumbnailUrl: string;
  caption: string | null;
  capturedAt: string;
}

interface PhotoCardRowProps {
  photos: PhotoResult[];
}

export function PhotoCardRow({ photos }: PhotoCardRowProps) {
  if (!photos || photos.length === 0) return null;
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {photos.map((photo) => (
          <PhotoCard key={photo.photoId} {...photo} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  content: {
    paddingRight: SPACING.md,
  },
});
