import { call, put, takeLatest } from 'redux-saga/effects';
import { circlesApi } from '../../../utils/circlesApi';
import {
  fetchCirclesListRequest,
  fetchCirclesListSuccess,
  fetchCirclesListFailure,
} from '../../../redux/reducers/circlesList';

function* handleFetchCirclesList() {
  try {
    const res = (yield call(circlesApi.list)) as { circles: import('../../../types/circle').CircleListItem[] };
    yield put(fetchCirclesListSuccess(res.circles));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load circles';
    yield put(fetchCirclesListFailure(message));
  }
}

export function* watchCirclesList() {
  yield takeLatest(fetchCirclesListRequest.type, handleFetchCirclesList);
}
