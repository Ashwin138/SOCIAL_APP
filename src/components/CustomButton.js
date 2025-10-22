import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

export default function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  disabled = false,
  loading = false 
}) {
  const buttonStyle = [
    styles.button,
    variant === 'outline' && styles.outlineButton,
    variant === 'secondary' && styles.secondaryButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'outline' && styles.outlineText,
    variant === 'secondary' && styles.secondaryText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.surface} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceLight,
  },
  disabledButton: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.5,
  },
  text: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  outlineText: {
    color: COLORS.text,
  },
  secondaryText: {
    color: COLORS.text,
  },
  disabledText: {
    color: COLORS.textLight,
  },
});