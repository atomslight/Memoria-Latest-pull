import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchMemories } from '../../../utils/api';
import {
  fetchMemoriesPickerPageRequest,
  fetchMemoriesPickerPageSuccess,
  fetchMemoriesPickerPageFailure,
} from '../../../redux/reducers/memoriesPicker';

function* handleFetchPickerPage(
  action: ReturnType<typeof fetchMemoriesPickerPageRequest>,
) {
  const { page } = action.payload;
  try {
    const data = (yield call(fetchMemories, page, 30)) as Awaited<
      ReturnType<typeof fetchMemories>
    >;
    yield put(fetchMemoriesPickerPageSuccess({ page, data }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load memories';
    yield put(fetchMemoriesPickerPageFailure(message));
  }
}

export function* watchMemoriesPicker() {
  yield takeLatest(fetchMemoriesPickerPageRequest.type, handleFetchPickerPage);
}
