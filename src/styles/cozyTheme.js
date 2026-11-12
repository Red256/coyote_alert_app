// Cozy Design System - Warm, Pastel, Round Theme

export const cozyTheme = {
  colors: {
    // Primary Colors - Yellow
    primary: '#F9E1A8',        // Main Yellow
    primaryLight: '#FBF0D1',   // Light Yellow
    primaryDark: '#F7D675',    // Dark Yellow
    
    // Secondary Colors - Green
    secondary: '#D6E5BD',      // Main Green
    secondaryLight: '#E8F2E0', // Light Green
    secondaryDark: '#C4D8A8',  // Dark Green
    
    // Accent Colors - Blue
    accent: '#BCD8EC',         // Main Blue
    accentLight: '#D6E8F5',    // Light Blue
    accentDark: '#A2C7E0',     // Dark Blue
    
    // Additional Colors - Pink and Purple
    pink: '#FFCBE1',           // Pink
    pinkLight: '#FFE0F0',      // Light Pink
    pinkDark: '#FFB5D1',       // Dark Pink
    
    purple: '#DCCCEC',         // Purple
    purpleLight: '#E8DCF0',    // Light Purple
    purpleDark: '#D0BCE4',     // Dark Purple
    
    // Warm Neutrals
    background: '#FBF0D1',     // Light Yellow Background
    surface: '#FFFFFF',        // Pure White
    surfaceLight: '#FEFEFE',   // Off White
    
    // Text Colors
    textPrimary: '#5D4037',    // Warm Brown
    textSecondary: '#8D6E63',  // Medium Brown
    textLight: '#A1887F',      // Light Brown
    textWhite: '#FFFFFF',      // White Text
    
    // Status Colors (Using new palette)
    success: '#D6E5BD',        // Green
    warning: '#F9E1A8',        // Yellow
    error: '#FFCBE1',          // Pink
    info: '#BCD8EC',           // Blue
    
    // Special Cozy Colors (Legacy support)
    cozy: '#FFCBE1',           // Pink
    warm: '#F9E1A8',           // Yellow
    calm: '#BCD8EC',           // Blue
    gentle: '#DCCCEC',         // Purple
  },
  
  typography: {
    // Font Families - Using Arial for a clean, modern look
    primary: 'Arial',
    secondary: 'Arial',
    cute: 'Arial', // Using Arial for consistency
    
    // Font Sizes
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    base: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 8,
    base: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  
  shadows: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 10,
    },
  },
  
  // Component Styles
  components: {
    button: {
      primary: {
        backgroundColor: '#F9E1A8',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      secondary: {
        backgroundColor: '#D6E5BD',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      },
      cozy: {
        backgroundColor: '#FFCBE1',
        borderRadius: 28,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderWidth: 1,
        borderColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
      },
      outline: {
        backgroundColor: 'transparent',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: '#000',
      },
    },
    
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: '#000',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    
    input: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#000',
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: '#5D4037',
      fontFamily: 'Quicksand-Bold',
    },
  }
};

// Helper function to get cozy styles
export const getCozyStyles = (component) => {
  return cozyTheme.components[component] || {};
};
