import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'; // Import navigation themes
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

// Import the actual screens
import DashboardScreen from './src/screens/DashboardScreen';
import AddPersonScreen from './src/screens/AddPersonScreen';
import EditPersonScreen from './src/screens/EditPersonScreen'; // Import the EditPerson screen
import LogInteractionScreen from './src/screens/LogInteractionScreen';
import ProfileScreen from './src/screens/ProfileScreen/index';
import GlobalTreeScreen from './src/screens/GlobalTreeScreen'; // Import the new screen
import { ThemeProvider, useTheme } from './src/context/ThemeContext'; // Import useTheme as well

// Define the stack navigator
// Define the parameter list for the stack navigator for type safety
export type RootStackParamList = {
  Dashboard: undefined;
  AddPerson: undefined;
  EditPerson: { personId: string }; // Edit person screen requires a personId
  LogInteraction: { personId?: string; personName?: string };
  Profile: { personId: string }; // Profile screen requires a personId
  GlobalTree: undefined; // Add GlobalTree screen
  // Add other screens and their parameters here later
};

const Stack = createStackNavigator<RootStackParamList>();

// Inner component to access theme context for navigation styling
const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  // Configure React Navigation theme based on app theme
  const navigationTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ... (theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
    },
  };

  // Configure Stack Navigator screen options based on theme
  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.surface,
      shadowColor: theme.isDark ? theme.colors.text : '#000', // Adjust shadow for theme
    },
    headerTintColor: theme.colors.primary, // Color for back button and title
    headerTitleStyle: {
      color: theme.colors.text, // Color for title text
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator initialRouteName="Dashboard" screenOptions={screenOptions}>
        {/* Apply common header styles via screenOptions, specific titles per screen */}
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'dytto - net' }} />
        <Stack.Screen name="AddPerson" component={AddPersonScreen} options={{ title: 'Add New Person' }} />
        <Stack.Screen name="EditPerson" component={EditPersonScreen} options={{ title: 'Edit Person' }} />
        <Stack.Screen name="LogInteraction" component={LogInteractionScreen} options={{ title: 'Log Interaction' }} />
        {/* Profile screen title is set dynamically within the component */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        {/* Add the Global Tree screen */}
        <Stack.Screen name="GlobalTree" component={GlobalTreeScreen} options={{ title: 'Global Tree' }} />
      </Stack.Navigator>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

// Main App component wraps the navigator with the ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
