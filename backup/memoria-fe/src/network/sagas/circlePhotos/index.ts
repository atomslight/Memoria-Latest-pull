import { call, put, takeLatest } from 'redux-saga/effects';
import { circlesApi } from '../../../utils/circlesApi';
import {
  fetchCirclePhotosRequest,
  fetchCirclePhotosSuccess,
  fetchCirclePhotosFailure,
} from '../../../redux/reducers/circlePhotos';

function* handleFetchCirclePhotos(
  action: ReturnType<typeof fetchCirclePhotosRequest>,
) {
  const { circleId, page, limit } = action.payload;
  try {
    const data = (yield call(circlesApi.getPhotos, circleId, {
      page,
      limit,
    })) as import('../../../types/circle').CirclePhotosResponse;
    yield put(fetchCirclePhotosSuccess({ circleId, data }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load photos';
    yield put(fetchCirclePhotosFailure({ circleId, message }));
  }
}

export function* watchCirclePhotos() {
  yield takeLatest(fetchCirclePhotosRequest.type, handleFetchCirclePhotos);
}
