module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^.*utils/reactotronConfig$': '<rootDir>/jest/reactotronConfig.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-redux|immer|@reduxjs/toolkit|react-native-haptic-feedback|react-native-vector-icons|expo-blur|expo-image-picker|@expo/vector-icons|react-native-gesture-handler|react-native-url-polyfill)/)'
  ],
  setupFiles: ['<rootDir>/jest.setup.js']
};
