import React from 'react';
import { View } from 'react-native';
import { cozyTheme } from '../styles/cozyTheme';

const CozyCard = ({ 
  children, 
  variant = 'default',
  padding = 'medium',
  style = {},
  ...props 
}) => {
  const getCardStyle = () => {
    const baseStyle = {
      borderRadius: cozyTheme.borderRadius.lg,
      ...cozyTheme.shadows.soft,
    };

    const variantStyles = {
      default: {
        backgroundColor: cozyTheme.colors.surface,
        borderWidth: 1,
        borderColor: '#000',
      },
      primary: {
        backgroundColor: cozyTheme.colors.primaryLight,
        borderWidth: 1,
        borderColor: '#000',
      },
      secondary: {
        backgroundColor: cozyTheme.colors.secondaryLight,
        borderWidth: 1,
        borderColor: '#000',
      },
      accent: {
        backgroundColor: cozyTheme.colors.accentLight,
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
    };

    const paddingStyles = {
      small: {
        padding: cozyTheme.spacing.sm,
      },
      medium: {
        padding: cozyTheme.spacing.base,
      },
      large: {
        padding: cozyTheme.spacing.lg,
      },
      extraLarge: {
        padding: cozyTheme.spacing.xl,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...paddingStyles[padding],
      ...style,
    };
  };

  return (
    <View style={getCardStyle()} {...props}>
      {children}
    </View>
  );
};

export default CozyCard;
