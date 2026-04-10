/**
 * Reactotron — dev-only debugging (network, logs, global errors).
 * @see https://docs.infinite.red/reactotron/
 *
 * Wasalt uses Redux plugins; Memoria uses Zustand + TanStack Query — no reactotron-redux.
 * AsyncStorage plugin is off (this app uses MMKV). Use the Reactotron desktop app (port 9090).
 * Android device/emulator: run `npm run adb:reactotron` so 9090 reaches your machine.
 */
import Reactotron from 'reactotron-react-native';

const reactotron = Reactotron.configure({ name: 'Memoria' })
  .useReactNative({
    asyncStorage: false,
    storybook: false,
  })
  .connect();

export default reactotron;
