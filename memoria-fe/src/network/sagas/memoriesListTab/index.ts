import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchMemories } from '../../../utils/api';
import {
  fetchMemoriesListTabRequest,
  fetchMemoriesListTabSuccess,
  fetchMemoriesListTabFailure,
} from '../../../redux/reducers/memoriesListTab';

function* handleFetchMemoriesListTab() {
  try {
    const data = (yield call(fetchMemories, 1, 100)) as Awaited<
      ReturnType<typeof fetchMemories>
    >;
    yield put(fetchMemoriesListTabSuccess(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load memories';
    yield put(fetchMemoriesListTabFailure(message));
  }
}

export function* watchMemoriesListTab() {
  yield takeLatest(fetchMemoriesListTabRequest.type, handleFetchMemoriesListTab);
}
