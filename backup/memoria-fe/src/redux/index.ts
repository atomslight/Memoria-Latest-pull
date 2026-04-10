/* Re-exports (wasalt-crm-app keeps src/redux/index.js for barrel usage) */
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
