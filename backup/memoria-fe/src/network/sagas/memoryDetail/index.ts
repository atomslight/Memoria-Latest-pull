import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '../../../utils/api';
import {
  fetchMemoryDetailRequest,
  fetchMemoryDetailSuccess,
  fetchMemoryDetailFailure,
} from '../../../redux/reducers/memoryDetail';

function* handleFetchMemoryDetail(
  action: ReturnType<typeof fetchMemoryDetailRequest>,
) {
  const { id } = action.payload;
  try {
    const data = (yield call(api.memories.get, id)) as unknown;
    yield put(fetchMemoryDetailSuccess({ id, data }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load memory';
    yield put(fetchMemoryDetailFailure({ id, message }));
  }
}

export function* watchMemoryDetail() {
  yield takeLatest(fetchMemoryDetailRequest.type, handleFetchMemoryDetail);
}
