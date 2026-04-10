module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    ['inline-dotenv', { path: '.env' }],
    'react-native-reanimated/plugin',
  ],
};
