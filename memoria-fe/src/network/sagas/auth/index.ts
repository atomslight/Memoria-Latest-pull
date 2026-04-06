import { call, put, takeLeading } from 'redux-saga/effects';
import { api } from '../../../utils/api';
import { mapBackendAuthResponse, useAuthStore } from '../../../stores/authStore';
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure,
  logoutRequest,
  logoutSettled,
} from '../../../redux/reducers/authApi';
import {
  triggerLogin,
  triggerSignup,
  triggerLogout,
} from '../../../redux/actions/authTriggers';

function* handleLogin(action: ReturnType<typeof triggerLogin>) {
  yield put(loginRequest());
  try {
    const raw = (yield call(api.auth.login, action.payload)) as unknown;
    const mapped = mapBackendAuthResponse(raw);
    yield call(async () => {
      await useAuthStore.getState().setUser(mapped.user, mapped.accessToken);
    });
    yield put(loginSuccess());
  } catch (e: unknown) {
    yield put(loginFailure(e instanceof Error ? e.message : 'Login failed'));
  }
}

function* handleSignup(action: ReturnType<typeof triggerSignup>) {
  yield put(signupRequest());
  try {
    const raw = (yield call(api.auth.register, action.payload)) as unknown;
    const mapped = mapBackendAuthResponse(raw);
    yield call(async () => {
      await useAuthStore.getState().setUser(mapped.user, mapped.accessToken);
    });
    yield put(signupSuccess());
  } catch (e: unknown) {
    yield put(signupFailure(e instanceof Error ? e.message : 'Sign up failed'));
  }
}

function* handleLogout() {
  yield put(logoutRequest());
  try {
    yield call(api.auth.logout);
  } catch {
    /* still clear local session */
  } finally {
    yield call(async () => {
      await useAuthStore.getState().clearAuth();
    });
    yield put(logoutSettled());
  }
}

export function* watchAuth() {
  yield takeLeading(triggerLogin.type, handleLogin);
  yield takeLeading(triggerSignup.type, handleSignup);
  yield takeLeading(triggerLogout.type, handleLogout);
}
