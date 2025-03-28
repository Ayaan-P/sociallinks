import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App'; // Import the param list type
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Theme } from '../types/theme'; // Import Theme type

// Define navigation props type using the RootStackParamList
type LogInteractionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LogInteraction'>;

// Define route props to potentially receive personId if navigating from a specific person
type LogInteractionScreenRouteProp = RouteProp<RootStackParamList, 'LogInteraction'>;

interface Props {
  navigation: LogInteractionScreenNavigationProp;
  route: LogInteractionScreenRouteProp;
}

const LogInteractionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme(); // Use theme context
  const styles = themedStyles(theme); // Generate themed styles

  const personId = route.params?.personId;
  const personName = route.params?.personName || 'Selected Person';

  const [note, setNote] = useState('');
  const [sentimentTag, setSentimentTag] = useState('');

  const handleLogSubmit = async () => {
    if (!note) {
      Alert.alert('Error', 'Please enter a note for the interaction.');
      return;
    }
    const interactionData = {
      personId: personId || 'unknown',
      note,
      sentimentTag,
      timestamp: new Date().toISOString(),
      xpGain: 1,
    };
    console.log(`Logging interaction for ${personName} (ID: ${interactionData.personId}):`, interactionData);
    try {
      // --- Placeholder API Call ---
      Alert.alert('Success', `Interaction logged for ${personName}. +1 XP!`);
      navigation.goBack();
    } catch (error) {
      console.error('Error logging interaction:', error);
      Alert.alert('Error', 'Failed to log interaction. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Log Interaction with {personName}</Text>

      <Text style={styles.label}>Interaction Note (Required):</Text>
      <TextInput
        style={styles.textArea}
        value={note}
        onChangeText={setNote}
        placeholder="What did you talk about? What happened?"
        placeholderTextColor={theme.colors.textSecondary} // Use theme color
        multiline={true}
        numberOfLines={4}
      />

      <Text style={styles.label}>Sentiment Tag (Optional):</Text>
      <TextInput
        style={styles.input}
        value={sentimentTag}
        onChangeText={setSentimentTag}
        placeholder="e.g., Happy, Deep, Fun, Draining"
        placeholderTextColor={theme.colors.textSecondary} // Use theme color
      />

      {/* TODO: Style Button component or use TouchableOpacity for custom styling */}
      <Button title="Log Interaction (+1 XP)" onPress={handleLogSubmit} color={theme.colors.primary} />
    </ScrollView>
  );
};

// Function to generate themed styles
const themedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background, // Use theme background
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text, // Use theme text color
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  label: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border, // Use theme border color
    backgroundColor: theme.colors.surface, // Use theme surface
    color: theme.colors.text, // Use theme text color
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderRadius: 5,
    fontSize: theme.typography.body.fontSize,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderRadius: 5,
    fontSize: theme.typography.body.fontSize,
    height: 100,
    textAlignVertical: 'top',
  },
});

export default LogInteractionScreen;
