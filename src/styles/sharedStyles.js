import { StyleSheet } from 'react-native';
import { cozyTheme } from './cozyTheme';

/**
 * Shared styles used across multiple screens
 * Import these to maintain consistency and reduce code duplication
 */
export const sharedStyles = StyleSheet.create({
  // Common header styles
  header: {
    backgroundColor: '#2596be',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...cozyTheme.shadows.soft,
  },

  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: 50,
    height: 50,
    marginRight: 8,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: cozyTheme.typography.primary,
  },

  placeholder: {
    width: 40,
  },

  // Common container styles
  screenContainer: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },

  // Common content padding
  contentPadding: {
    padding: 16,
  },

  // Common card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...cozyTheme.shadows.soft,
  },

  // Common button styles
  primaryButton: {
    backgroundColor: '#1fc5f5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    ...cozyTheme.shadows.medium,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2596be',
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#2596be',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: cozyTheme.typography.primary,
  },
});

