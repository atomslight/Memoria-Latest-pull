import { call, put, takeLatest } from 'redux-saga/effects';
import { circlesApi } from '../../../utils/circlesApi';
import {
  fetchCircleDetailRequest,
  fetchCircleDetailSuccess,
  fetchCircleDetailFailure,
} from '../../../redux/reducers/circleDetail';

function* handleFetchCircleDetail(
  action: ReturnType<typeof fetchCircleDetailRequest>,
) {
  const { id } = action.payload;
  try {
    const data = (yield call(circlesApi.get, id)) as import('../../../types/circle').CircleDetail;
    yield put(fetchCircleDetailSuccess({ id, data }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load circle';
    yield put(fetchCircleDetailFailure({ id, message }));
  }
}

export function* watchCircleDetail() {
  yield takeLatest(fetchCircleDetailRequest.type, handleFetchCircleDetail);
}
