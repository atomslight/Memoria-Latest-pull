import { createAction } from '@reduxjs/toolkit';

export const triggerCreateCircle = createAction<{
  name: string;
  description?: string;
  emoji?: string;
}>('circles/triggerCreateCircle');

export const triggerAddPhotoToCircle = createAction<{
  circleId: string;
  photoId: string;
}>('circles/triggerAddPhotoToCircle');

export const triggerAddCircleMember = createAction<{
  circleId: string;
  userId: string;
}>('circles/triggerAddCircleMember');

export const triggerRemoveCircleMember = createAction<{
  circleId: string;
  userId: string;
}>('circles/triggerRemoveCircleMember');

export const triggerDeleteCircle = createAction<string>('circles/triggerDeleteCircle');

/** Sequential add-photo calls for share-to-circle modal */
export const triggerSharePhotosToCircle = createAction<{
  circleId: string;
  photoIds: string[];
}>('circles/triggerSharePhotosToCircle');
