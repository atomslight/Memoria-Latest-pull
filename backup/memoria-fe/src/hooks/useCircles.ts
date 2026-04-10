import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  clearCirclesMutationSettled,
  type CirclesMutationCallbackKey,
} from '../redux/reducers/circlesMutations';
import {
  fetchCirclesListRequest,
  fetchCirclesListSuccess,
  fetchCirclesListFailure,
} from '../redux/reducers/circlesList';
import {
  fetchCircleDetailRequest,
  fetchCircleDetailSuccess,
  fetchCircleDetailFailure,
} from '../redux/reducers/circleDetail';
import {
  fetchCirclePhotosRequest,
  fetchCirclePhotosSuccess,
  fetchCirclePhotosFailure,
} from '../redux/reducers/circlePhotos';
import {
  fetchUserSearchRequest,
  fetchUserSearchSuccess,
  fetchUserSearchFailure,
} from '../redux/reducers/userSearch';
import {
  triggerCreateCircle,
  triggerAddPhotoToCircle,
  triggerAddCircleMember,
  triggerRemoveCircleMember,
  triggerDeleteCircle,
} from '../redux/actions/circlesTriggers';

export type CircleMutateCallbacks = {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
};

function useCirclesMutationSettledCallbacks(key: CirclesMutationCallbackKey) {
  const dispatch = useAppDispatch();
  const lastSettled = useAppSelector((s) => s.circlesMutations.lastSettled);
  const callbacksRef = useRef<CircleMutateCallbacks | null>(null);

  useEffect(() => {
    if (!lastSettled || lastSettled.key !== key) return;
    dispatch(clearCirclesMutationSettled());
    const cb = callbacksRef.current;
    callbacksRef.current = null;
    if (lastSettled.ok) cb?.onSuccess?.();
    else cb?.onError?.(new Error(lastSettled.errorMessage ?? 'Request failed'));
  }, [lastSettled, key, dispatch]);

  return callbacksRef;
}

export function useCircles() {
  const dispatch = useAppDispatch();
  const { circles, isLoading, error } = useAppSelector((s) => s.circlesList);

  useEffect(() => {
    dispatch(fetchCirclesListRequest());
  }, [dispatch]);

  const refetch = useCallback(() => {
    dispatch(fetchCirclesListRequest());
  }, [dispatch]);

  return {
    data: circles,
    isLoading,
    error: error ? new Error(error) : null,
    refetch,
    isRefetching: isLoading,
  };
}

export function useCircle(id: string) {
  const dispatch = useAppDispatch();
  const detail = useAppSelector((s) => s.circleDetail.entities[id]);
  const loading = useAppSelector((s) => s.circleDetail.loadingIds[id]);
  const err = useAppSelector((s) => s.circleDetail.errors[id]);

  useEffect(() => {
    if (id) {
      dispatch(fetchCircleDetailRequest({ id }));
    }
  }, [dispatch, id]);

  const refetch = useCallback(() => {
    if (id) dispatch(fetchCircleDetailRequest({ id }));
  }, [dispatch, id]);

  return {
    data: detail,
    isLoading: !!loading && !detail,
    error: err ? new Error(err) : null,
    refetch,
    isRefetching: !!loading,
  };
}

export function useCirclePhotos(
  id: string,
  params?: { page?: number; limit?: number },
) {
  const dispatch = useAppDispatch();
  const photosData = useAppSelector((s) => s.circlePhotos.byCircleId[id]);
  const loading = useAppSelector((s) => s.circlePhotos.loadingIds[id]);
  const err = useAppSelector((s) => s.circlePhotos.errors[id]);

  useEffect(() => {
    if (id) {
      dispatch(
        fetchCirclePhotosRequest({
          circleId: id,
          page: params?.page,
          limit: params?.limit,
        }),
      );
    }
  }, [dispatch, id, params?.page, params?.limit]);

  const refetch = useCallback(() => {
    if (id) {
      dispatch(
        fetchCirclePhotosRequest({
          circleId: id,
          page: params?.page,
          limit: params?.limit,
        }),
      );
    }
  }, [dispatch, id, params?.page, params?.limit]);

  return {
    data: photosData,
    isLoading: !!loading && !photosData,
    error: err ? new Error(err) : null,
    refetch,
    isRefetching: !!loading,
  };
}

export function useCreateCircle() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(
    (s) => s.circlesMutations.pending.createCircle,
  );
  const callbacksRef = useCirclesMutationSettledCallbacks('createCircle');

  const mutate = useCallback(
    (
      data: { name: string; description?: string; emoji?: string },
      opts?: CircleMutateCallbacks,
    ) => {
      callbacksRef.current = opts ?? null;
      dispatch(triggerCreateCircle(data));
    },
    [dispatch, callbacksRef],
  );

  return { mutate, isPending };
}

export function useAddPhotoToCircle() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(
    (s) => s.circlesMutations.pending.addPhotoToCircle,
  );

  const mutate = useCallback(
    (vars: { circleId: string; photoId: string }) => {
      dispatch(triggerAddPhotoToCircle(vars));
    },
    [dispatch],
  );

  return { mutate, isPending };
}

export function useAddMember() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((s) => s.circlesMutations.pending.addMember);
  const callbacksRef = useCirclesMutationSettledCallbacks('addMember');

  const mutate = useCallback(
    (
      vars: { circleId: string; userId: string },
      opts?: CircleMutateCallbacks,
    ) => {
      callbacksRef.current = opts ?? null;
      dispatch(triggerAddCircleMember(vars));
    },
    [dispatch, callbacksRef],
  );

  return { mutate, isPending };
}

export function useRemoveMember() {
  const dispatch = useAppDispatch();
  const callbacksRef = useCirclesMutationSettledCallbacks('removeMember');

  const mutate = useCallback(
    (
      vars: { circleId: string; userId: string },
      opts?: CircleMutateCallbacks,
    ) => {
      callbacksRef.current = opts ?? null;
      dispatch(triggerRemoveCircleMember(vars));
    },
    [dispatch, callbacksRef],
  );

  return { mutate };
}

export function useDeleteCircle() {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector(
    (s) => s.circlesMutations.pending.deleteCircle,
  );
  const callbacksRef = useCirclesMutationSettledCallbacks('deleteCircle');

  const mutate = useCallback(
    (id: string, opts?: CircleMutateCallbacks) => {
      callbacksRef.current = opts ?? null;
      dispatch(triggerDeleteCircle(id));
    },
    [dispatch, callbacksRef],
  );

  return { mutate, isPending };
}

export function useSearchUsers(query: string) {
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((s) => s.userSearch);

  useEffect(() => {
    if (query.trim().length > 0) {
      dispatch(fetchUserSearchRequest({ query }));
    } else {
      dispatch(fetchUserSearchSuccess([]));
    }
  }, [dispatch, query]);

  return {
    data: users,
    isLoading,
    error: error ? new Error(error) : null,
    refetch: () => dispatch(fetchUserSearchRequest({ query })),
  };
}
