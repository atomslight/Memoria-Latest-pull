/** Jest stub: avoid loading reactotron-react-native in tests */
const reactotron = {
  configure: () => reactotron,
  useReactNative: () => reactotron,
  use: () => reactotron,
  connect: () => reactotron,
  display: () => {},
  close: () => {},
};

module.exports = reactotron;
module.exports.default = reactotron;
