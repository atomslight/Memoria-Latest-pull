import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchMemories } from '../../../utils/api';
import {
  fetchMemoriesTimelinePageRequest,
  fetchMemoriesTimelinePageSuccess,
  fetchMemoriesTimelinePageFailure,
} from '../../../redux/reducers/memoriesTimeline';

function* handleFetchTimelinePage(
  action: ReturnType<typeof fetchMemoriesTimelinePageRequest>,
) {
  const { page } = action.payload;
  try {
    const data = (yield call(fetchMemories, page, 20)) as Awaited<
      ReturnType<typeof fetchMemories>
    >;
    yield put(fetchMemoriesTimelinePageSuccess({ page, data }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load memories';
    yield put(fetchMemoriesTimelinePageFailure(message));
  }
}

export function* watchMemoriesTimeline() {
  yield takeLatest(fetchMemoriesTimelinePageRequest.type, handleFetchTimelinePage);
}
