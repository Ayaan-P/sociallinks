import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; // Import the param list type
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Theme } from '../types/theme'; // Import Theme type

// Define navigation props type using the RootStackParamList
type AddPersonScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddPerson'>;

interface Props {
  navigation: AddPersonScreenNavigationProp;
}

// Mock function for image picker - replace with actual library later
const pickImage = async (): Promise<string | undefined> => {
  console.log('Simulating image picker...');
  return undefined;
};

const AddPersonScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme(); // Use theme context
  const styles = themedStyles(theme); // Generate themed styles

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [relationshipCategory, setRelationshipCategory] = useState('');

  const handleChoosePhoto = async () => {
    const uri = await pickImage();
    if (uri) {
      setPhotoUri(uri);
      Alert.alert('Photo Selected (Simulated)', `URI: ${uri}`);
    } else {
      Alert.alert('Image Picker', 'No image selected or picker cancelled (Simulated).');
    }
  };

  const handleSubmit = async () => {
    if (!name || !relationshipCategory) {
      Alert.alert('Error', 'Please fill in Name and Relationship Category.');
      return;
    }
    const newPersonData = {
      name,
      photo: photoUri,
      categories: [relationshipCategory],
      level: 1,
      xp: 0,
      lastInteraction: new Date().toISOString(),
    };
    console.log('Submitting new person (MVP):', newPersonData);
    try {
      // --- Placeholder API Call ---
      Alert.alert('Success', `Link created for ${name}.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding person:', error);
      Alert.alert('Error', 'Failed to add person. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Name (Required):</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter person's name"
        placeholderTextColor={theme.colors.textSecondary} // Use theme color
      />

      <Text style={styles.label}>Photo (Optional):</Text>
      <View style={styles.photoContainer}>
        {/* TODO: Style Button component or use TouchableOpacity for custom styling */}
        <Button title="Choose Photo" onPress={handleChoosePhoto} color={theme.colors.primary} />
        {photoUri && <Text style={styles.photoUriText}>Selected: {photoUri.substring(photoUri.lastIndexOf('/') + 1)}</Text>}
      </View>

      <Text style={styles.label}>Initial Relationship Category (Required):</Text>
      <TextInput
        style={styles.input}
        value={relationshipCategory}
        onChangeText={setRelationshipCategory}
        placeholder="e.g., Friend, Business, Family"
        placeholderTextColor={theme.colors.textSecondary} // Use theme color
      />

      {/* TODO: Style Button component or use TouchableOpacity for custom styling */}
      <Button title="Add Person" onPress={handleSubmit} color={theme.colors.primary} />
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
  label: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text, // Use theme text color
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border, // Use theme border color
    backgroundColor: theme.colors.surface, // Use theme surface for input background
    color: theme.colors.text, // Use theme text color for input text
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderRadius: 5,
    fontSize: theme.typography.body.fontSize,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  photoUriText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary, // Use theme secondary text color
    flexShrink: 1,
  },
});

export default AddPersonScreen;
