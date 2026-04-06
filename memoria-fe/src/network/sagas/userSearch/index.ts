import { call, put, takeLatest } from 'redux-saga/effects';
import { circlesApi } from '../../../utils/circlesApi';
import {
  fetchUserSearchRequest,
  fetchUserSearchSuccess,
  fetchUserSearchFailure,
} from '../../../redux/reducers/userSearch';

function* handleUserSearch(action: ReturnType<typeof fetchUserSearchRequest>) {
  const { query } = action.payload;
  if (!query.trim()) {
    yield put(fetchUserSearchSuccess([]));
    return;
  }
  try {
    const res = (yield call(circlesApi.searchUsers, query)) as {
      users: import('../../../types/circle').UserSearchResult[];
    };
    yield put(fetchUserSearchSuccess(res.users));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Search failed';
    yield put(fetchUserSearchFailure(message));
  }
}

export function* watchUserSearch() {
  yield takeLatest(fetchUserSearchRequest.type, handleUserSearch);
}
