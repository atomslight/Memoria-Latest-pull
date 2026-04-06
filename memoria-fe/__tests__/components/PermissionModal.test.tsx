/**
 * Unit tests for PermissionModal component
 * Requirements: 6.3, 6.4, 6.5, 6.6
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PermissionModal } from '../../src/components/PermissionModal';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
  }),
}));

import * as ImagePicker from 'expo-image-picker';

const defaultProps = {
  visible: true,
  onAllow: jest.fn(),
  onDeny: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PermissionModal', () => {
  it('renders the permission request text', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    expect(
      getByText('Memoria would like to access your photos'),
    ).toBeTruthy();
  });

  it('renders the Allow Access button', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    expect(getByText('Allow Access')).toBeTruthy();
  });

  it("renders the Don't Allow button", () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    expect(getByText("Don't Allow")).toBeTruthy();
  });

  it('calls onAllow when Allow Access is pressed', () => {
    const onAllow = jest.fn();
    const { getByText } = render(
      <PermissionModal {...defaultProps} onAllow={onAllow} />,
    );
    fireEvent.press(getByText('Allow Access'));
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it("calls onDeny when Don't Allow is pressed", () => {
    const onDeny = jest.fn();
    const { getByText } = render(
      <PermissionModal {...defaultProps} onDeny={onDeny} />,
    );
    fireEvent.press(getByText("Don't Allow"));
    expect(onDeny).toHaveBeenCalledTimes(1);
  });

  it('does not render content when visible is false', () => {
    const { queryByText } = render(
      <PermissionModal {...defaultProps} visible={false} />,
    );
    expect(
      queryByText('Memoria would like to access your photos'),
    ).toBeNull();
  });
});
