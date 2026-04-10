import { combineReducers } from '@reduxjs/toolkit';
import memoriesTimelineReducer from './memoriesTimeline';
import memoriesPickerReducer from './memoriesPicker';
import memoriesListTabReducer from './memoriesListTab';
import memoriesTrashReducer from './memoriesTrash';
import memoryDetailReducer from './memoryDetail';
import circlesListReducer from './circlesList';
import circleDetailReducer from './circleDetail';
import circlePhotosReducer from './circlePhotos';
import userSearchReducer from './userSearch';
import settingsStatsReducer from './settingsStats';
import activityReducer from './activity';
import memoryEmbeddingSearchReducer from './memoryEmbeddingSearch';
import authApiReducer from './authApi';
import circlesMutationsReducer from './circlesMutations';
import searchReducer from './search';
import memoriesMutationsReducer from './memoriesMutations';

export const appReducer = combineReducers({
  memoriesTimeline: memoriesTimelineReducer,
  memoriesPicker: memoriesPickerReducer,
  memoriesListTab: memoriesListTabReducer,
  memoriesTrash: memoriesTrashReducer,
  memoryDetail: memoryDetailReducer,
  circlesList: circlesListReducer,
  circleDetail: circleDetailReducer,
  circlePhotos: circlePhotosReducer,
  userSearch: userSearchReducer,
  settingsStats: settingsStatsReducer,
  activity: activityReducer,
  memoryEmbeddingSearch: memoryEmbeddingSearchReducer,
  authApi: authApiReducer,
  circlesMutations: circlesMutationsReducer,
  search: searchReducer,
  memoriesMutations: memoriesMutationsReducer,
});

export type AppReducerState = ReturnType<typeof appReducer>;
