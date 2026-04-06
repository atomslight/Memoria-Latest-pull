/**
 * Unit tests for Landing Screen (src/screens/LandingScreen.tsx)
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

jest.mock('react-native-linear-gradient', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock authStore — unauthenticated by default
const mockAuthStore = {
  isAuthenticated: false,
  isLoading: false,
};
jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore,
}));

// Import after mocks
import LandingScreen from '../../src/screens/LandingScreen';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockAuthStore.isAuthenticated = false;
  mockAuthStore.isLoading = false;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Landing Screen', () => {
  it('renders the Memoria logo', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText('Memoria')).toBeTruthy();
  });

  it('renders the headline text', () => {
    const { getByText } = render(<LandingScreen />);
    expect(
      getByText("Your life's moments, intelligently organized."),
    ).toBeTruthy();
  });

  it('renders the Login button', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText('Login')).toBeTruthy();
  });

  it('renders the Create Account button', () => {
    const { getByText } = render(<LandingScreen />);
    expect(getByText('Create Account')).toBeTruthy();
  });

  it('navigates to login-email when Login is pressed', () => {
    const { getByText } = render(<LandingScreen />);
    fireEvent.press(getByText('Login'));
    expect(mockNavigate).toHaveBeenCalledWith('AuthLoginEmail');
  });

  it('navigates to signup-email when Create Account is pressed', () => {
    const { getByText } = render(<LandingScreen />);
    fireEvent.press(getByText('Create Account'));
    expect(mockNavigate).toHaveBeenCalledWith('AuthSignupEmail');
  });
});
