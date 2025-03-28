import { Dimensions, TextStyle } from 'react-native'; // Import TextStyle

// Define FontWeight type based on TextStyle
type FontWeight = TextStyle['fontWeight'];

export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  getResponsive: (size: number, factor?: number) => number;
}

export interface Typography {
  getResponsiveSize: (size: number) => number;
  fontFamily: string; // Keep as string, adjust if specific font files are used
  h1: {
    fontSize: number;
    fontWeight: FontWeight; // Use correct type
  };
  h2: {
    fontSize: number;
    fontWeight: FontWeight; // Use correct type
  };
  h3: {
    fontSize: number;
    fontWeight: FontWeight; // Use correct type
  };
  h4: {
    fontSize: number;
    fontWeight: FontWeight; // Use correct type
  };
  body: {
    fontSize: number;
    fontWeight: FontWeight; // Use correct type
  };
  caption: {
    fontSize: number;
    fontWeight: FontWeight; // Use correct type
  };
}

export interface Theme {
  colors: ColorPalette;
  spacing: Spacing;
  typography: Typography;
  isDark: boolean;
}

// Helper function to calculate responsive sizes based on screen width
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STANDARD_WIDTH = 375; // iPhone X width as base

const getResponsiveSpacing = (size: number, factor: number = 1): number => {
  const scale = SCREEN_WIDTH / STANDARD_WIDTH;
  return Math.round(size * Math.min(scale, factor));
};

const getResponsiveTypography = (size: number): number => {
  const scale = SCREEN_WIDTH / STANDARD_WIDTH;
  return Math.round(size * Math.min(scale, 1.2)); // Cap font scaling at 1.2x
};

export const lightTheme: Theme = {
  colors: {
    primary: '#84BABF',
    secondary: '#06363D',
    background: '#FFFFFF',
    surface: '#F2F2F7',
    text: '#000000',
    textSecondary: '#6C6C6C',
    border: '#E5E5EA',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5856D6'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    getResponsive: getResponsiveSpacing
  },
  typography: {
    getResponsiveSize: getResponsiveTypography,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', // Example font stack
    h1: {
      fontSize: 32,
      fontWeight: 'bold' // Valid FontWeight
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' // Valid FontWeight
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' // Valid FontWeight
    },
    h4: {
      fontSize: 16,
      fontWeight: '600' // Valid FontWeight
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' // Valid FontWeight
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal' // Valid FontWeight
    }
  },
  isDark: false
};

export const darkTheme: Theme = {
  ...lightTheme, // Spread light theme first
  colors: { // Override colors
    primary: '#06363D',
    secondary: '#84BABF',
    background: '#000000',
    surface: '#141414',
    text: '#E0EDE9',
    textSecondary: '#84BABF',
    border: '#000000', //'#0D6F73'
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    info: '#411D2B'
  },
  // Typography and Spacing are inherited from lightTheme unless overridden
  isDark: true
};
