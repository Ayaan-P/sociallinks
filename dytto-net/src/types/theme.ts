import { Dimensions, TextStyle } from 'react-native';

type FontWeight = TextStyle['fontWeight'];

export interface ColorPalette {
  // Primary brand colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: string[];
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Surface colors
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  card: string;
  modal: string;
  
  // Text colors
  text: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Interactive colors
  interactive: string;
  interactivePressed: string;
  interactiveDisabled: string;
  
  // Border and divider colors
  border: string;
  borderLight: string;
  borderStrong: string;
  divider: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // Special colors
  premium: string;
  premiumGradient: string[];
  accent: string;
  accentGradient: string[];
  
  // Overlay colors
  overlay: string;
  overlayStrong: string;
  scrim: string;
  
  // Shadow colors
  shadow: string;
  shadowStrong: string;
}

export interface Spacing {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  getResponsive: (size: number, factor?: number) => number;
}

export interface BorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
  pill: number;
}

export interface Elevation {
  none: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  xl: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export interface Typography {
  getResponsiveSize: (size: number) => number;
  fontFamily: string;
  fontFamilyBold: string;
  fontFamilyMedium: string;
  fontFamilyLight: string;
  
  // Display styles
  displayLarge: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  displayMedium: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  displaySmall: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  
  // Headline styles
  headlineLarge: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  headlineMedium: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  headlineSmall: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  
  // Title styles
  titleLarge: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  titleMedium: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  titleSmall: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  
  // Body styles
  bodyLarge: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  bodyMedium: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  bodySmall: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  
  // Label styles
  labelLarge: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  labelMedium: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  labelSmall: {
    fontSize: number;
    fontWeight: FontWeight;
    lineHeight: number;
    letterSpacing: number;
  };
  
  // Legacy support
  h1: {
    fontSize: number;
    fontWeight: FontWeight;
  };
  h2: {
    fontSize: number;
    fontWeight: FontWeight;
  };
  h3: {
    fontSize: number;
    fontWeight: FontWeight;
  };
  h4: {
    fontSize: number;
    fontWeight: FontWeight;
  };
  body: {
    fontSize: number;
    fontWeight: FontWeight;
  };
  caption: {
    fontSize: number;
    fontWeight: FontWeight;
  };
}

export interface Animation {
  timing: {
    quick: number;
    base: number;
    gentle: number;
    slow: number;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    spring: string;
  };
}

export interface Theme {
  colors: ColorPalette;
  spacing: Spacing;
  borderRadius: BorderRadius;
  elevation: Elevation;
  typography: Typography;
  animation: Animation;
  isDark: boolean;
}

// Helper functions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STANDARD_WIDTH = 375;
const STANDARD_HEIGHT = 812;

const getResponsiveSpacing = (size: number, factor: number = 1.2): number => {
  const scale = Math.min(SCREEN_WIDTH / STANDARD_WIDTH, factor);
  return Math.round(size * scale);
};

const getResponsiveTypography = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / STANDARD_WIDTH, 1.15);
  return Math.round(size * scale);
};

// Premium Light Theme
export const lightTheme: Theme = {
  colors: {
    // Primary brand colors - Deep Ocean Blues
    primary: '#0066CC',
    primaryLight: '#4D94FF',
    primaryDark: '#004499',
    primaryGradient: ['#0066CC', '#0052A3'],
    
    // Secondary colors - Warm Amber
    secondary: '#FF8F00',
    secondaryLight: '#FFB74D',
    secondaryDark: '#E65100',
    
    // Surface colors
    background: '#FFFFFF',
    surface: '#FAFBFC',
    surfaceElevated: '#FFFFFF',
    surfaceHighlight: '#F8F9FA',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    
    // Text colors
    text: '#1A1A1A',
    textPrimary: '#000000',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // Interactive colors
    interactive: '#0066CC',
    interactivePressed: '#004499',
    interactiveDisabled: '#D1D5DB',
    
    // Border and divider colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderStrong: '#D1D5DB',
    divider: '#F3F4F6',
    
    // Status colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    
    // Special colors
    premium: '#8B5CF6',
    premiumGradient: ['#8B5CF6', '#A855F7'],
    accent: '#EC4899',
    accentGradient: ['#EC4899', '#F97316'],
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.3)',
    overlayStrong: 'rgba(0, 0, 0, 0.6)',
    scrim: 'rgba(0, 0, 0, 0.1)',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowStrong: 'rgba(0, 0, 0, 0.25)',
  },
  
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
    getResponsive: getResponsiveSpacing,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 50,
    pill: 9999,
  },
  
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.15)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.2)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: 'rgba(0, 0, 0, 0.25)',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 16,
    },
  },
  
  typography: {
    getResponsiveSize: getResponsiveTypography,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    fontFamilyBold: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    fontFamilyMedium: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    fontFamilyLight: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    
    // Display styles
    displayLarge: {
      fontSize: 57,
      fontWeight: '400',
      lineHeight: 64,
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontSize: 45,
      fontWeight: '400',
      lineHeight: 52,
      letterSpacing: 0,
    },
    displaySmall: {
      fontSize: 36,
      fontWeight: '400',
      lineHeight: 44,
      letterSpacing: 0,
    },
    
    // Headline styles
    headlineLarge: {
      fontSize: 32,
      fontWeight: '600',
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      letterSpacing: 0,
    },
    
    // Title styles
    titleLarge: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    
    // Body styles
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    
    // Label styles
    labelLarge: {
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '600',
      lineHeight: 14,
      letterSpacing: 0.5,
    },
    
    // Legacy support
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 28, fontWeight: 'bold' },
    h3: { fontSize: 24, fontWeight: '600' },
    h4: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 12, fontWeight: 'normal' },
  },
  
  animation: {
    timing: {
      quick: 150,
      base: 250,
      gentle: 350,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  
  isDark: false,
};

// Premium Dark Theme
export const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    // Primary brand colors - Brighter in dark mode
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#2563EB',
    primaryGradient: ['#3B82F6', '#2563EB'],
    
    // Secondary colors
    secondary: '#F59E0B',
    secondaryLight: '#FBBF24',
    secondaryDark: '#D97706',
    
    // Surface colors
    background: '#000000',
    surface: '#111111',
    surfaceElevated: '#1A1A1A',
    surfaceHighlight: '#222222',
    card: '#1A1A1A',
    modal: '#1F1F1F',
    
    // Text colors
    text: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    textInverse: '#000000',
    
    // Interactive colors
    interactive: '#3B82F6',
    interactivePressed: '#2563EB',
    interactiveDisabled: '#374151',
    
    // Border and divider colors
    border: '#2A2A2A',
    borderLight: '#1F1F1F',
    borderStrong: '#404040',
    divider: '#1F1F1F',
    
    // Status colors
    success: '#22C55E',
    successLight: '#16A34A',
    warning: '#EAB308',
    warningLight: '#CA8A04',
    error: '#F87171',
    errorLight: '#DC2626',
    info: '#60A5FA',
    infoLight: '#3B82F6',
    
    // Special colors
    premium: '#A855F7',
    premiumGradient: ['#A855F7', '#C084FC'],
    accent: '#F472B6',
    accentGradient: ['#F472B6', '#FB7185'],
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayStrong: 'rgba(0, 0, 0, 0.9)',
    scrim: 'rgba(255, 255, 255, 0.05)',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.8)',
  },
  
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.4)',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.6)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.8)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 16,
    },
  },
  
  isDark: true,
};