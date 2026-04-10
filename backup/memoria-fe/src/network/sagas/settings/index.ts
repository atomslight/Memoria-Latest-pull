import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchMemories, api } from '../../../utils/api';
import {
  fetchSettingsStatsRequest,
  fetchSettingsStatsSuccess,
  fetchSettingsStatsFailure,
} from '../../../redux/reducers/settingsStats';
import {
  fetchActivityRequest,
  fetchActivitySuccess,
  fetchActivityFailure,
} from '../../../redux/reducers/activity';

function* handleSettingsStats() {
  try {
    const data = (yield call(fetchMemories, 1, 1)) as Awaited<
      ReturnType<typeof fetchMemories>
    >;
    yield put(fetchSettingsStatsSuccess(data.pagination.total));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load stats';
    yield put(fetchSettingsStatsFailure(message));
  }
}

function* handleActivity() {
  try {
    const data = (yield call(api.memories.getActivity)) as unknown;
    yield put(fetchActivitySuccess(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load activity';
    yield put(fetchActivityFailure(message));
  }
}

export function* watchSettingsStats() {
  yield takeLatest(fetchSettingsStatsRequest.type, handleSettingsStats);
}

export function* watchActivity() {
  yield takeLatest(fetchActivityRequest.type, handleActivity);
}
