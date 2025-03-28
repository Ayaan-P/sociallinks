import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Theme, lightTheme, darkTheme } from '../types/theme';


interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(lightTheme);

  // Load saved theme preference on mount - COMMENTED OUT due to missing databaseService
  // useEffect(() => {
  //   const loadThemePreference = async () => {
  //     try {
  //       // TODO: Implement theme loading (e.g., using AsyncStorage)
  //       // const savedTheme = await databaseService.getPreference('theme');
  //       // if (savedTheme === 'dark') {
  //       //   setThemeState(darkTheme);
  //       // }
  //       console.log('Theme loading skipped (databaseService missing)');
  //     } catch (error) {
  //       console.error('Error loading theme preference:', error);
  //     }
  //   };
  //   loadThemePreference();
  // }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => {
      const newTheme = prevTheme.isDark ? lightTheme : darkTheme;
      // Save theme preference - COMMENTED OUT
      // TODO: Implement theme saving (e.g., using AsyncStorage)
      // databaseService.setPreference('theme', newTheme.isDark ? 'dark' : 'light')
      //   .catch(error => console.error('Error saving theme preference:', error));
      console.log('Theme saving skipped (databaseService missing)');
      return newTheme;
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    // Save theme preference - COMMENTED OUT
    // TODO: Implement theme saving (e.g., using AsyncStorage)
    // databaseService.setPreference('theme', newTheme.isDark ? 'dark' : 'light')
    //   .catch(error => console.error('Error saving theme preference:', error));
    console.log('Theme saving skipped (databaseService missing)');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility hooks for specific theme properties
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

export const useSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

export const useTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

// Utility function to get system font family based on platform
export const getSystemFont = () => {
  return Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System'
  });
};
