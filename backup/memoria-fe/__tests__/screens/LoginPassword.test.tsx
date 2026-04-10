/**
 * Unit tests for Login Password Screen (src/screens/auth/login-password.tsx)
 * Requirements: 4.5, 4.7
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({ params: { email: 'user@example.com' } }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const mockSignIn = jest.fn();
jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (selector: (s: { signIn: typeof mockSignIn }) => unknown) =>
    selector({ signIn: mockSignIn }),
}));

import LoginPasswordScreen from '../../src/screens/auth/login-password';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Login Password Screen', () => {
  it('renders the password header', () => {
    const { getByText } = render(<LoginPasswordScreen />);
    expect(getByText('Enter the password')).toBeTruthy();
  });

  it('renders the Continue button', () => {
    const { getByText } = render(<LoginPasswordScreen />);
    expect(getByText('Continue')).toBeTruthy();
  });

  it('calls signIn with email and password when Continue is pressed', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<LoginPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Password'), 'secret123');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'secret123');
    });
  });

  it('shows an error message when signIn fails', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { getByText, getByPlaceholderText } = render(<LoginPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('does not call signIn when password is empty', () => {
    const { getByText } = render(<LoginPasswordScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
