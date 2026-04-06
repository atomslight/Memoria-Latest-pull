/*
 * Root saga (mirrors wasalt-crm-app/src/network/sagas/index.js)
 */
import { all } from 'redux-saga/effects';
import { watchMemoriesTimeline } from './memoriesTimeline';
import { watchMemoriesPicker } from './memoriesPicker';
import { watchMemoriesListTab } from './memoriesListTab';
import { watchMemoriesTrash } from './memoriesTrash';
import { watchMemoryDetail } from './memoryDetail';
import { watchCirclesList } from './circlesList';
import { watchCircleDetail } from './circleDetail';
import { watchCirclePhotos } from './circlePhotos';
import { watchUserSearch } from './userSearch';
import { watchCirclesMutations } from './circlesMutations';
import { watchSettingsStats, watchActivity } from './settings';
import { watchMemoryEmbeddingSearch } from './memoryEmbeddingSearch';
import { watchAuth } from './auth';
import { watchSearch } from './search';
import { watchMemoriesCrud } from './memoriesCrud';

export default function* rootSaga() {
  yield all([
    watchMemoriesTimeline(),
    watchMemoriesPicker(),
    watchMemoriesListTab(),
    watchMemoriesTrash(),
    watchMemoryDetail(),
    watchCirclesList(),
    watchCircleDetail(),
    watchCirclePhotos(),
    watchUserSearch(),
    watchCirclesMutations(),
    watchSettingsStats(),
    watchActivity(),
    watchMemoryEmbeddingSearch(),
    watchAuth(),
    watchSearch(),
    watchMemoriesCrud(),
  ]);
}
