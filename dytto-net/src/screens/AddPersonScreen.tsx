import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App'; // Import the param list type
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Theme } from '../types/theme'; // Import Theme type
import { createRelationship } from '../services/api'; // Import API service
import { CreateRelationshipPayload } from '../types/Relationship'; // Import payload type

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
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [preferredCommunication, setPreferredCommunication] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [relationshipCategory, setRelationshipCategory] = useState('Friend');
  const [relationshipType, setRelationshipType] = useState('personal');
  const [reminderInterval, setReminderInterval] = useState('weekly');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const handleChoosePhoto = async () => {
    const uri = await pickImage();
    if (uri) {
      setPhotoUri(uri);
      Alert.alert('Photo Selected (Simulated)', `URI: ${uri}`);
    } else {
      Alert.alert('Image Picker', 'No image selected or picker cancelled (Simulated).');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!name || !relationshipCategory || !relationshipType || !reminderInterval) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    try {
      // Create relationship data using the specific payload type
      const relationshipData: CreateRelationshipPayload = {
        name,
        bio,
        birthday: birthday || undefined,
        phone: phone || undefined,
        email: email || undefined,
        location: location || undefined,
        preferred_communication: preferredCommunication || undefined,
        meeting_frequency: meetingFrequency || undefined,
        notes: notes || undefined,
        relationship_type: relationshipType,
        reminder_interval: reminderInterval,
        initial_category_name: relationshipCategory,
        photo_url: photoUri,
        tags: tags
      };

      console.log('Submitting new person to API:', relationshipData);

      // Call the API to create the relationship
      const newRelationship = await createRelationship(relationshipData);
      
      Alert.alert('Success', `Link created for ${name}.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding person:', error);
      Alert.alert('Error', 'Failed to add person. Please try again.');
    }
  };

  // State for collapsible sections
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <Text style={styles.label}>Name: <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter person's name"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Bio:</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Enter a brief description"
          placeholderTextColor={theme.colors.textSecondary}
          multiline={true}
          numberOfLines={3}
        />

        <Text style={styles.label}>Photo:</Text>
        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleChoosePhoto}
          >
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>
          {photoUri && <Text style={styles.photoUriText}>Selected: {photoUri.substring(photoUri.lastIndexOf('/') + 1)}</Text>}
        </View>
        
        {/* Collapsible Additional Information Section */}
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => setShowAdditionalInfo(!showAdditionalInfo)}
        >
          <Text style={styles.collapsibleTitle}>
            Additional Information {showAdditionalInfo ? '(hide)' : '(show)'}
          </Text>
          <Ionicons 
            name={showAdditionalInfo ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
        
        {showAdditionalInfo && (
          <View style={styles.collapsibleContent}>
            <Text style={styles.label}>Birthday:</Text>
            <TextInput
              style={styles.input}
              value={birthday}
              onChangeText={setBirthday}
              placeholder="MM/DD/YYYY (optional)"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.label}>Location:</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Where they live/work (optional)"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.label}>Meeting Frequency:</Text>
            <TextInput
              style={styles.input}
              value={meetingFrequency}
              onChangeText={setMeetingFrequency}
              placeholder="How often to meet (optional)"
              placeholderTextColor={theme.colors.textSecondary}
            />

            <Text style={styles.label}>Notes:</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              multiline={true}
              numberOfLines={3}
            />
          </View>
        )}
        
        {/* Collapsible Contact Information Section */}
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => setShowContactInfo(!showContactInfo)}
        >
          <Text style={styles.collapsibleTitle}>
            Contact Information {showContactInfo ? '(hide)' : '(show)'}
          </Text>
          <Ionicons 
            name={showContactInfo ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
        
        {showContactInfo && (
          <View style={styles.collapsibleContent}>
            <Text style={styles.label}>Phone:</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
            />
            
            <Text style={styles.label}>Email:</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
            />

            <Text style={styles.label}>Preferred Communication:</Text>
            <TextInput
              style={styles.input}
              value={preferredCommunication}
              onChangeText={setPreferredCommunication}
              placeholder="How they prefer to be contacted (optional)"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Relationship Details</Text>
        
        <Text style={styles.label}>Initial Relationship Category: <Text style={styles.required}>*</Text></Text>
        <View style={styles.optionsContainer}>
          {['Friend', 'Family', 'Business', 'Acquaintance', 'Romantic'].map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.optionButton,
                relationshipCategory === category && styles.selectedOption
              ]}
              onPress={() => setRelationshipCategory(category)}
            >
              <Text 
                style={[
                  styles.optionText,
                  relationshipCategory === category && styles.selectedOptionText
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Relationship Type: <Text style={styles.required}>*</Text></Text>
        <View style={styles.optionsContainer}>
          {['personal', 'professional', 'family'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.optionButton,
                relationshipType === type && styles.selectedOption
              ]}
              onPress={() => setRelationshipType(type)}
            >
              <Text 
                style={[
                  styles.optionText,
                  relationshipType === type && styles.selectedOptionText
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Reminder Settings</Text>
        
        <Text style={styles.label}>Reminder Interval: <Text style={styles.required}>*</Text></Text>
        <View style={styles.optionsContainer}>
          {['weekly', 'biweekly', 'monthly', 'custom'].map(interval => (
            <TouchableOpacity
              key={interval}
              style={[
                styles.optionButton,
                reminderInterval === interval && styles.selectedOption
              ]}
              onPress={() => setReminderInterval(interval)}
            >
              <Text 
                style={[
                  styles.optionText,
                  reminderInterval === interval && styles.selectedOptionText
                ]}
              >
                {interval.charAt(0).toUpperCase() + interval.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        {/* <Text style={styles.sectionTitle}>Tags</Text> */}
        
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add a tag"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TouchableOpacity 
            style={styles.addTagButton} 
            onPress={handleAddTag}
          >
            <Text style={styles.addTagButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Text style={styles.removeTagText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Add Person</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Function to generate themed styles
const themedStyles = (theme: Theme) => StyleSheet.create({
  required: {
    color: theme.colors.error || 'red',
    fontWeight: 'bold',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginTop: theme.spacing.md,
  },
  collapsibleTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  collapsibleContent: {
    marginTop: theme.spacing.sm,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,

  },
  label: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
   
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: 5,
    fontSize: theme.typography.body.fontSize,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  photoUriText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: 50,
  },
  buttonText: {
    color: theme.isDark ? theme.colors.background : theme.colors.background,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    
  },
  optionButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 50,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.isDark ? theme.colors.background : theme.colors.background,
  },
  tagInputContainer: {
    flexDirection: 'row',
    
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    padding: theme.spacing.sm,
    borderRadius: 50,
    fontSize: theme.typography.body.fontSize,
    marginRight: theme.spacing.sm,
  },
  addTagButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: 50,
    justifyContent: 'center',
  },
  addTagButtonText: {
    color: theme.isDark ? theme.colors.background : theme.colors.text,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '33', // Adding transparency to primary color
    borderRadius: 50,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tagText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption.fontSize,
  },
  removeTagText: {
    color: theme.colors.error || 'red',
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 50,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: theme.isDark ? theme.colors.background : theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: theme.typography.body.fontSize,
  },
});

export default AddPersonScreen;
