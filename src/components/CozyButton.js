import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cozyTheme } from '../styles/cozyTheme';

const CozyButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  icon = null,
  style = {},
  textStyle = {},
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: cozyTheme.borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...cozyTheme.shadows.soft,
    };

    const sizeStyles = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
      },
      medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        minHeight: 48,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        minHeight: 56,
      },
    };

    const variantStyles = {
      primary: {
        backgroundColor: cozyTheme.colors.primary,
        borderWidth: 1,
        borderColor: '#000',
      },
      secondary: {
        backgroundColor: cozyTheme.colors.secondary,
        borderWidth: 1,
        borderColor: '#000',
      },
      accent: {
        backgroundColor: cozyTheme.colors.accent,
        borderWidth: 1,
        borderColor: '#000',
      },
      cozy: {
        backgroundColor: cozyTheme.colors.cozy,
        borderWidth: 1,
        borderColor: '#000',
      },
      warm: {
        backgroundColor: cozyTheme.colors.warm,
        borderWidth: 1,
        borderColor: '#000',
      },
      calm: {
        backgroundColor: cozyTheme.colors.calm,
        borderWidth: 1,
        borderColor: '#000',
      },
      gentle: {
        backgroundColor: cozyTheme.colors.gentle,
        borderWidth: 1,
        borderColor: '#000',
      },
      pink: {
        backgroundColor: cozyTheme.colors.pink,
        borderWidth: 1,
        borderColor: '#000',
      },
      purple: {
        backgroundColor: cozyTheme.colors.purple,
        borderWidth: 1,
        borderColor: '#000',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#000',
      },
    };

    const disabledStyle = disabled ? {
      backgroundColor: cozyTheme.colors.textLight,
      opacity: 0.6,
    } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyle,
      ...style,
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: cozyTheme.typography.primary,
    };

    const sizeTextStyles = {
      small: {
        fontSize: cozyTheme.typography.sm,
      },
      medium: {
        fontSize: cozyTheme.typography.base,
      },
      large: {
        fontSize: cozyTheme.typography.lg,
      },
    };

    const variantTextStyles = {
      primary: {
        color: cozyTheme.colors.textPrimary,
      },
      secondary: {
        color: cozyTheme.colors.textPrimary,
      },
      accent: {
        color: cozyTheme.colors.textPrimary,
      },
      cozy: {
        color: cozyTheme.colors.textPrimary,
      },
      warm: {
        color: cozyTheme.colors.textPrimary,
      },
      calm: {
        color: cozyTheme.colors.textPrimary,
      },
      gentle: {
        color: cozyTheme.colors.textPrimary,
      },
      pink: {
        color: cozyTheme.colors.textPrimary,
      },
      purple: {
        color: cozyTheme.colors.textPrimary,
      },
      outline: {
        color: cozyTheme.colors.primary,
      },
    };

    const disabledTextStyle = disabled ? {
      color: cozyTheme.colors.textLight,
    } : {};

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...disabledTextStyle,
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      <Text style={getTextStyle()}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 8,
  },
});

export default CozyButton;
