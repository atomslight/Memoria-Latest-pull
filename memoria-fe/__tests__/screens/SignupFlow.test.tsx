/**
 * Unit tests for Signup flow screens
 * - signup-email.tsx, signup-password.tsx, signup-name.tsx
 * Requirements: 2.5, 2.6, 2.7, 5.8, 5.10, 5.12
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ─── Shared mocks ─────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

let mockRouteParams: Record<string, string> = {};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const mockSignUp = jest.fn();
jest.mock('../../src/stores/authStore', () => ({
  useAuthStore: (selector: (s: { signUp: typeof mockSignUp }) => unknown) =>
    selector({ signUp: mockSignUp }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import SignupEmailScreen from '../../src/screens/auth/signup-email';
import SignupPasswordScreen from '../../src/screens/auth/signup-password';
import SignupNameScreen from '../../src/screens/auth/signup-name';

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = {};
});

// ─── Signup Email Screen ──────────────────────────────────────────────────────

describe('Signup Email Screen', () => {
  it('renders the email header', () => {
    const { getByText } = render(<SignupEmailScreen />);
    expect(getByText("What's your email id?")).toBeTruthy();
  });

  it('does NOT navigate with an invalid email', () => {
    const { getByText, getByPlaceholderText } = render(<SignupEmailScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'bad-email');
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to signup-password with email param on valid email', () => {
    const { getByText, getByPlaceholderText } = render(<SignupEmailScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).toHaveBeenCalledWith('AuthSignupPassword', {
      email: 'new@example.com',
    });
  });
});

// ─── Signup Password Screen ───────────────────────────────────────────────────

describe('Signup Password Screen', () => {
  beforeEach(() => {
    mockRouteParams = { email: 'new@example.com' };
  });

  it('renders the password header', () => {
    const { getByText } = render(<SignupPasswordScreen />);
    expect(getByText('Create a password')).toBeTruthy();
  });

  it('does NOT navigate when password is empty', () => {
    const { getByText } = render(<SignupPasswordScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to signup-name with email and password params', () => {
    const { getByText, getByPlaceholderText } = render(<SignupPasswordScreen />);
    fireEvent.changeText(getByPlaceholderText('Password'), 'mypassword');
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).toHaveBeenCalledWith('AuthSignupName', {
      email: 'new@example.com',
      password: 'mypassword',
    });
  });
});

// ─── Signup Name Screen ───────────────────────────────────────────────────────

describe('Signup Name Screen', () => {
  beforeEach(() => {
    mockRouteParams = { email: 'new@example.com', password: 'mypassword' };
  });

  it('renders the name header', () => {
    const { getByText } = render(<SignupNameScreen />);
    expect(getByText("What's your name?")).toBeTruthy();
  });

  it('calls signUp with email, password, and name on Continue', async () => {
    mockSignUp.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<SignupNameScreen />);

    fireEvent.changeText(getByPlaceholderText('Full name'), 'Jane Doe');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'new@example.com',
        'mypassword',
        'Jane Doe',
      );
    });
  });

  it('shows email verification message when signUp throws verification hint', async () => {
    mockSignUp.mockRejectedValueOnce(
      new Error('Please check your email and confirm your account'),
    );
    const { getByText, getByPlaceholderText } = render(<SignupNameScreen />);

    fireEvent.changeText(getByPlaceholderText('Full name'), 'Jane Doe');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Check your email')).toBeTruthy();
    });
  });

  it('shows error message when signUp fails with a generic error', async () => {
    mockSignUp.mockRejectedValueOnce(new Error('Email already in use'));
    const { getByText, getByPlaceholderText } = render(<SignupNameScreen />);

    fireEvent.changeText(getByPlaceholderText('Full name'), 'Jane Doe');
    fireEvent.press(getByText('Continue'));

    await waitFor(() => {
      expect(getByText('Email already in use')).toBeTruthy();
    });
  });

  it('does NOT call signUp when name is empty', () => {
    const { getByText } = render(<SignupNameScreen />);
    fireEvent.press(getByText('Continue'));
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
