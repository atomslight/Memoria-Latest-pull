import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchSearchRequest, fetchSearchSuccess } from '../redux/reducers/search';

export function useSearch(
  query: string,
  params?: { page?: number; limit?: number },
) {
  const dispatch = useAppDispatch();
  const { data, isLoading, error, query: lastQuery } = useAppSelector(
    (s) => s.search,
  );

  useEffect(() => {
    if (query.length > 0) {
      dispatch(
        fetchSearchRequest({
          query,
          page: params?.page,
          limit: params?.limit,
        }),
      );
    } else {
      dispatch(
        fetchSearchSuccess({
          results: [],
          pagination: {
            page: 1,
            limit: params?.limit ?? 20,
            total: 0,
          },
        }),
      );
    }
  }, [dispatch, query, params?.page, params?.limit]);

  return {
    data: query.length > 0 || lastQuery ? data : null,
    isLoading: query.length > 0 ? isLoading : false,
    error: error ? new Error(error) : null,
    refetch: () =>
      dispatch(
        fetchSearchRequest({
          query,
          page: params?.page,
          limit: params?.limit,
        }),
      ),
  };
}
