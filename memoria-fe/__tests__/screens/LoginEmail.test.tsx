/**
 * Unit tests for Login Email Screen (src/screens/auth/login-email.tsx)
 * Requirements: 3.8
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

import LoginEmailScreen from '../../src/screens/auth/login-email';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Login Email Screen', () => {
  it('renders the email header', () => {
    const { getByText } = render(<LoginEmailScreen />);
    expect(getByText("What's your email id?")).toBeTruthy();
  });

  it('renders the Continue button', () => {
    const { getByText } = render(<LoginEmailScreen />);
    expect(getByText('Continue')).toBeTruthy();
  });

  it('does NOT navigate when Continue is pressed with an invalid email', () => {
    const { getByText, getByPlaceholderText } = render(<LoginEmailScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to login-password with email param when Continue is pressed with a valid email', () => {
    const { getByText, getByPlaceholderText } = render(<LoginEmailScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.press(getByText('Continue'));
    expect(mockNavigate).toHaveBeenCalledWith('AuthLoginPassword', {
      email: 'user@example.com',
    });
  });
});
