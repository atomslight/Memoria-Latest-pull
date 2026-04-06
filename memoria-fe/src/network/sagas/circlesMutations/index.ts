import { call, put, takeLeading } from 'redux-saga/effects';
import { circlesApi } from '../../../utils/circlesApi';
import {
  setCirclesMutationPending,
  circlesMutationSettled,
} from '../../../redux/reducers/circlesMutations';
import { fetchCirclesListRequest } from '../../../redux/reducers/circlesList';
import { fetchCircleDetailRequest } from '../../../redux/reducers/circleDetail';
import { fetchCirclePhotosRequest } from '../../../redux/reducers/circlePhotos';
import {
  triggerCreateCircle,
  triggerAddPhotoToCircle,
  triggerAddCircleMember,
  triggerRemoveCircleMember,
  triggerDeleteCircle,
  triggerSharePhotosToCircle,
} from '../../../redux/actions/circlesTriggers';
import { sharePhotosToCircleFinished } from '../../../redux/reducers/circlesMutations';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Request failed';
}

function* handleCreateCircle(action: ReturnType<typeof triggerCreateCircle>) {
  yield put(setCirclesMutationPending({ key: 'createCircle', value: true }));
  try {
    yield call(circlesApi.create, action.payload);
    yield put(fetchCirclesListRequest());
    yield put(circlesMutationSettled({ key: 'createCircle', ok: true }));
  } catch (e: unknown) {
    yield put(
      circlesMutationSettled({
        key: 'createCircle',
        ok: false,
        errorMessage: errorMessage(e),
      }),
    );
  } finally {
    yield put(setCirclesMutationPending({ key: 'createCircle', value: false }));
  }
}

function* handleAddPhoto(action: ReturnType<typeof triggerAddPhotoToCircle>) {
  const { circleId, photoId } = action.payload;
  yield put(setCirclesMutationPending({ key: 'addPhotoToCircle', value: true }));
  try {
    yield call(circlesApi.addPhoto, circleId, photoId);
    yield put(fetchCirclePhotosRequest({ circleId }));
  } finally {
    yield put(setCirclesMutationPending({ key: 'addPhotoToCircle', value: false }));
  }
}

function* handleAddMember(action: ReturnType<typeof triggerAddCircleMember>) {
  const { circleId, userId } = action.payload;
  yield put(setCirclesMutationPending({ key: 'addMember', value: true }));
  try {
    yield call(circlesApi.addMember, circleId, userId);
    yield put(fetchCircleDetailRequest({ id: circleId }));
    yield put(circlesMutationSettled({ key: 'addMember', ok: true }));
  } catch (e: unknown) {
    yield put(
      circlesMutationSettled({
        key: 'addMember',
        ok: false,
        errorMessage: errorMessage(e),
      }),
    );
  } finally {
    yield put(setCirclesMutationPending({ key: 'addMember', value: false }));
  }
}

function* handleRemoveMember(action: ReturnType<typeof triggerRemoveCircleMember>) {
  const { circleId, userId } = action.payload;
  yield put(setCirclesMutationPending({ key: 'removeMember', value: true }));
  try {
    yield call(circlesApi.removeMember, circleId, userId);
    yield put(fetchCircleDetailRequest({ id: circleId }));
    yield put(circlesMutationSettled({ key: 'removeMember', ok: true }));
  } catch (e: unknown) {
    yield put(
      circlesMutationSettled({
        key: 'removeMember',
        ok: false,
        errorMessage: errorMessage(e),
      }),
    );
  } finally {
    yield put(setCirclesMutationPending({ key: 'removeMember', value: false }));
  }
}

function* handleDeleteCircle(action: ReturnType<typeof triggerDeleteCircle>) {
  yield put(setCirclesMutationPending({ key: 'deleteCircle', value: true }));
  try {
    yield call(circlesApi.delete, action.payload);
    yield put(fetchCirclesListRequest());
    yield put(circlesMutationSettled({ key: 'deleteCircle', ok: true }));
  } catch (e: unknown) {
    yield put(
      circlesMutationSettled({
        key: 'deleteCircle',
        ok: false,
        errorMessage: errorMessage(e),
      }),
    );
  } finally {
    yield put(setCirclesMutationPending({ key: 'deleteCircle', value: false }));
  }
}

function* handleSharePhotosToCircle(
  action: ReturnType<typeof triggerSharePhotosToCircle>,
) {
  const { circleId, photoIds } = action.payload;
  yield put(setCirclesMutationPending({ key: 'addPhotoToCircle', value: true }));
  let successCount = 0;
  const errors: string[] = [];
  for (const photoId of photoIds) {
    try {
      yield call(circlesApi.addPhoto, circleId, photoId);
      successCount += 1;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      if (!msg.toLowerCase().includes('already')) {
        errors.push(msg || 'Unknown error');
      }
    }
  }
  yield put(fetchCirclePhotosRequest({ circleId }));
  yield put(setCirclesMutationPending({ key: 'addPhotoToCircle', value: false }));
  yield put(sharePhotosToCircleFinished({ successCount, errors }));
}

export function* watchCirclesMutations() {
  yield takeLeading(triggerCreateCircle.type, handleCreateCircle);
  yield takeLeading(triggerAddPhotoToCircle.type, handleAddPhoto);
  yield takeLeading(triggerAddCircleMember.type, handleAddMember);
  yield takeLeading(triggerRemoveCircleMember.type, handleRemoveMember);
  yield takeLeading(triggerDeleteCircle.type, handleDeleteCircle);
  yield takeLeading(triggerSharePhotosToCircle.type, handleSharePhotosToCircle);
}
