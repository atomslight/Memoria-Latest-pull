import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../../utils/api';
import {
  fetchSearchRequest,
  fetchSearchSuccess,
  fetchSearchFailure,
} from '../../../redux/reducers/search';

function* handleSearch(action: ReturnType<typeof fetchSearchRequest>) {
  const { query, page, limit } = action.payload;
  if (!query.length) {
    yield put(
      fetchSearchSuccess({
        results: [],
        pagination: { page: 1, limit: limit ?? 20, total: 0 },
      }),
    );
    return;
  }
  try {
    const data = (yield call(api.search.query, query, {
      page,
      limit,
    })) as {
      results: import('../../../redux/reducers/search').SearchResultItem[];
      pagination: { page: number; limit: number; total: number };
    };
    yield put(
      fetchSearchSuccess({
        results: data.results,
        pagination: data.pagination,
      }),
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Search failed';
    yield put(fetchSearchFailure(message));
  }
}

export function* watchSearch() {
  yield takeLatest(fetchSearchRequest.type, handleSearch);
}
