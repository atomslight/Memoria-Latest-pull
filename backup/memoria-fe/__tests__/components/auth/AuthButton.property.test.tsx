/**
 * Property-based tests for AuthButton validation states
 *
 * Feature: ui-design-revamp
 * Property 1: Email validation controls auth button state
 * Property 2: Password non-empty controls auth button state
 */

import React, { useState } from 'react';
import { render } from '@testing-library/react-native';
import * as fc from 'fast-check';
import { AuthButton } from '../../../src/components/auth/AuthButton';

// Email validation — mirrors what the auth screens use
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Wrapper components ───────────────────────────────────────────────────────

function EmailButtonWrapper({ email }: { email: string }) {
  const disabled = !isValidEmail(email);
  return (
    <AuthButton
      onPress={() => {}}
      label="Continue"
      disabled={disabled}
    />
  );
}

function PasswordButtonWrapper({ password }: { password: string }) {
  const disabled = password.length === 0;
  return (
    <AuthButton
      onPress={() => {}}
      label="Continue"
      disabled={disabled}
    />
  );
}

// ─── Property 1: Email validation controls auth button state ─────────────────
// Validates: Requirements 3.6, 3.7, 5.2

describe('Property 1: Email validation controls auth button state', () => {
  it('button is disabled for any invalid/random string', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const { getByRole } = render(<EmailButtonWrapper email={input} />);
        const button = getByRole('button');
        const expectedDisabled = !isValidEmail(input);
        expect(button.props.accessibilityState?.disabled).toBe(expectedDisabled);
      }),
      { numRuns: 100 },
    );
  });

  it('button is enabled for any valid email address', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const { getByRole } = render(<EmailButtonWrapper email={email} />);
        const button = getByRole('button');
        // Valid email → button should NOT be disabled
        expect(button.props.accessibilityState?.disabled).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ─── Property 2: Password non-empty controls auth button state ───────────────
// Validates: Requirements 4.4, 5.5

describe('Property 2: Password non-empty controls auth button state', () => {
  it('button disabled state equals (password.length === 0) for any string', () => {
    fc.assert(
      fc.property(fc.string(), (password) => {
        const { getByRole } = render(<PasswordButtonWrapper password={password} />);
        const button = getByRole('button');
        expect(button.props.accessibilityState?.disabled).toBe(password.length === 0);
      }),
      { numRuns: 100 },
    );
  });

  it('button is always disabled for the empty string', () => {
    const { getByRole } = render(<PasswordButtonWrapper password="" />);
    const button = getByRole('button');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('button is always enabled for any non-empty string', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (password) => {
        const { getByRole } = render(<PasswordButtonWrapper password={password} />);
        const button = getByRole('button');
        expect(button.props.accessibilityState?.disabled).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
