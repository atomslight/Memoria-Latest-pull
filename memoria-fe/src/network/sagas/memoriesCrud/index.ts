import { call, put, takeLeading } from 'redux-saga/effects';
import { api } from '../../../utils/api';
import {
  uploadMemoryRequest,
  updateMemoryRequest,
  deleteMemoryRequest,
} from '../../../redux/actions/memoriesCrud';
import {
  setUploadPending,
  setUpdatePending,
  setDeletePending,
  setMemoriesMutationError,
} from '../../../redux/reducers/memoriesMutations';
import { fetchMemoriesTimelinePageRequest } from '../../../redux/reducers/memoriesTimeline';
import { fetchMemoriesListTabRequest } from '../../../redux/reducers/memoriesListTab';
import { fetchMemoryDetailRequest } from '../../../redux/reducers/memoryDetail';

function* refreshMemoryLists() {
  yield put(fetchMemoriesTimelinePageRequest({ page: 1, reset: true }));
  yield put(fetchMemoriesListTabRequest());
}

function* handleUploadMemory(action: ReturnType<typeof uploadMemoryRequest>) {
  yield put(setUploadPending(true));
  yield put(setMemoriesMutationError(null));
  try {
    yield call(api.memories.upload, action.payload);
    yield* refreshMemoryLists();
  } catch (e: unknown) {
    yield put(
      setMemoriesMutationError(e instanceof Error ? e.message : 'Upload failed'),
    );
  } finally {
    yield put(setUploadPending(false));
  }
}

function* handleUpdateMemory(action: ReturnType<typeof updateMemoryRequest>) {
  const { id, data } = action.payload;
  yield put(setUpdatePending(true));
  yield put(setMemoriesMutationError(null));
  try {
    yield call(api.memories.update, id, data);
    yield put(fetchMemoryDetailRequest({ id }));
    yield* refreshMemoryLists();
  } catch (e: unknown) {
    yield put(
      setMemoriesMutationError(e instanceof Error ? e.message : 'Update failed'),
    );
  } finally {
    yield put(setUpdatePending(false));
  }
}

function* handleDeleteMemory(action: ReturnType<typeof deleteMemoryRequest>) {
  yield put(setDeletePending(true));
  yield put(setMemoriesMutationError(null));
  try {
    yield call(api.memories.delete, action.payload);
    yield* refreshMemoryLists();
  } catch (e: unknown) {
    yield put(
      setMemoriesMutationError(e instanceof Error ? e.message : 'Delete failed'),
    );
  } finally {
    yield put(setDeletePending(false));
  }
}

export function* watchMemoriesCrud() {
  yield takeLeading(uploadMemoryRequest.type, handleUploadMemory);
  yield takeLeading(updateMemoryRequest.type, handleUpdateMemory);
  yield takeLeading(deleteMemoryRequest.type, handleDeleteMemory);
}
