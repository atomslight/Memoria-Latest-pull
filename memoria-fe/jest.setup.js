jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('react-native-gesture-handler', () => {
  return {
    GestureHandlerRootView: ({ children }) => children,
    PanGestureHandler: ({ children }) => children,
    State: {},
    GestureDetector: ({ children }) => children,
    Gesture: {
      Pan: () => ({
        onUpdate: jest.fn(() => ({ onEnd: jest.fn() })),
      }),
    },
  };
});
