import React from 'react';
import { TextInput, StyleSheet, type KeyboardTypeOptions } from 'react-native';
import { TYPOGRAPHY } from '../../constants/typography';
import { useAppTheme } from '../../theme/ThemeContext';

interface AuthInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
}

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoFocus,
}: AuthInputProps) {
  const c = useAppTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoFocus={autoFocus}
      style={[styles.input, { color: c.textPrimary }]}
      placeholderTextColor={c.placeholder}
      selectionColor={c.brandYellow}
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...TYPOGRAPHY.inputLarge,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
});
