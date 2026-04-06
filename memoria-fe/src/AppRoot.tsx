import './polyfills';
import { Provider } from 'react-redux';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './redux/store';
import { useAuthStore } from './stores/authStore';
import { usePreferencesStore } from './stores/preferencesStore';
import { ThemeProvider } from './theme/ThemeContext';
import { NavigationShell } from './theme/NavigationShell';
import { storage } from './utils/storage';
import { installFetchCurlAlert } from './utils/networkDebug';

const AUTH_STORAGE_KEYS = ['auth.user', 'auth.token'];

export function AppRoot() {
  const loadAuth = useAuthStore((s) => s.loadAuth);

  useEffect(() => {
    if (__DEV__) {
      void import('./utils/reactotronConfig').then(() => {
        console.log('[dev] Reactotron configured');
      });
    }
  }, []);

  useEffect(() => {
    installFetchCurlAlert();
    storage.hydrate(AUTH_STORAGE_KEYS).then(() => loadAuth());
    usePreferencesStore.persist.rehydrate();
  }, [loadAuth]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <NavigationShell />
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
