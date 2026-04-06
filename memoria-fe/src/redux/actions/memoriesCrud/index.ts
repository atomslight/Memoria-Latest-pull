import { createAction } from '@reduxjs/toolkit';

export const uploadMemoryRequest = createAction<FormData>('memoriesCrud/uploadMemory');
export const updateMemoryRequest = createAction<{
  id: string;
  data: { mood?: string; cluster?: string; locationName?: string; caption?: string };
}>('memoriesCrud/updateMemory');
export const deleteMemoryRequest = createAction<string>('memoriesCrud/deleteMemory');
