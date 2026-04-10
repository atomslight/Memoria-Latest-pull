import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../../utils/api';
import {
  fetchMemoriesTrashRequest,
  fetchMemoriesTrashSuccess,
  fetchMemoriesTrashFailure,
} from '../../../redux/reducers/memoriesTrash';

function* handleFetchTrash() {
  try {
    const data = (yield call(api.memories.trash, {
      page: 1,
      limit: 100,
    })) as {
      memories?: unknown[];
      pagination?: { page: number; limit: number; total: number };
    };
    const memories = data.memories ?? [];
    const pagination = data.pagination;
    yield put(fetchMemoriesTrashSuccess({ memories, pagination }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load trash';
    yield put(fetchMemoriesTrashFailure(message));
  }
}

export function* watchMemoriesTrash() {
  yield takeLatest(fetchMemoriesTrashRequest.type, handleFetchTrash);
}
