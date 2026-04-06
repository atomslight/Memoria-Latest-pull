import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchMemoriesListTabRequest } from '../redux/reducers/memoriesListTab';
import { fetchMemoryDetailRequest } from '../redux/reducers/memoryDetail';
import {
  uploadMemoryRequest,
  updateMemoryRequest,
  deleteMemoryRequest,
} from '../redux/actions/memoriesCrud';
import type { MemoriesResponse } from '../utils/api';

interface Memory {
  id: string;
  userId: string;
  caption: string | null;
  thumbnailSmall: string | null;
  thumbnailMedium: string | null;
  thumbnailLarge: string | null;
  capturedAt: string;
  createdAt: string;
}

export function useMemories(params?: { page?: number; limit?: number }) {
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector((s) => s.memoriesListTab);

  useEffect(() => {
    dispatch(fetchMemoriesListTabRequest());
  }, [dispatch, params?.page, params?.limit]);

  return {
    data: data as MemoriesResponse | null,
    isLoading,
    error: error ? new Error(error) : null,
    refetch: () => dispatch(fetchMemoriesListTabRequest()),
  };
}

export function useMemory(id: string) {
  const dispatch = useAppDispatch();
  const entity = useAppSelector((s) => s.memoryDetail.entities[id]);
  const loading = useAppSelector((s) => s.memoryDetail.loadingIds[id]);
  const err = useAppSelector((s) => s.memoryDetail.errors[id]);

  useEffect(() => {
    if (id) dispatch(fetchMemoryDetailRequest({ id }));
  }, [dispatch, id]);

  const memory =
    entity && typeof entity === 'object' && entity !== null && 'memory' in entity
      ? (entity as { memory: Memory }).memory
      : (entity as Memory | undefined);

  return {
    data: memory,
    isLoading: !!loading && !entity,
    error: err ? new Error(err) : null,
    refetch: () => {
      if (id) dispatch(fetchMemoryDetailRequest({ id }));
    },
  };
}

export function useUploadMemory() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.memoriesMutations.uploadPending);

  const mutate = useCallback(
    (formData: FormData) => {
      dispatch(uploadMemoryRequest(formData));
    },
    [dispatch],
  );

  return { mutate, isPending };
}

export function useUpdateMemory() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.memoriesMutations.updatePending);

  const mutate = useCallback(
    (vars: {
      id: string;
      data: { mood?: string; cluster?: string; locationName?: string; caption?: string };
    }) => {
      dispatch(updateMemoryRequest(vars));
    },
    [dispatch],
  );

  return { mutate, isPending };
}

export function useDeleteMemory() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.memoriesMutations.deletePending);

  const mutate = useCallback(
    (id: string) => {
      dispatch(deleteMemoryRequest(id));
    },
    [dispatch],
  );

  return { mutate, isPending };
}
