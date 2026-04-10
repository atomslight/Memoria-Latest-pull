import { call, put, takeLatest } from 'redux-saga/effects';
import apiClient from '../../../utils/api';
import {
  fetchMemoryEmbeddingSearchRequest,
  fetchMemoryEmbeddingSearchSuccess,
  fetchMemoryEmbeddingSearchFailure,
  type MemorySearchHit,
} from '../../../redux/reducers/memoryEmbeddingSearch';

function fetchEmbeddingResults(query: string) {
  return apiClient
    .get('/api/v1/search', { params: { q: query, limit: 50 } })
    .then((res) => res.data?.results ?? []);
}

function* handleMemoryEmbeddingSearch(
  action: ReturnType<typeof fetchMemoryEmbeddingSearchRequest>,
) {
  const q = action.payload.query.trim();
  if (q.length <= 1) {
    yield put(fetchMemoryEmbeddingSearchSuccess([]));
    return;
  }
  try {
    const results = (yield call(fetchEmbeddingResults, q)) as MemorySearchHit[];
    yield put(fetchMemoryEmbeddingSearchSuccess(results));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Search failed';
    yield put(fetchMemoryEmbeddingSearchFailure(message));
  }
}

export function* watchMemoryEmbeddingSearch() {
  yield takeLatest(
    fetchMemoryEmbeddingSearchRequest.type,
    handleMemoryEmbeddingSearch,
  );
}
