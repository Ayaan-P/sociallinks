import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
import { getRelationship, updateRelationship } from '../services/api';
import { UpdateRelationshipPayload } from '../types/Relationship';

// Define navigation and route props types
type EditPersonScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditPerson'>;
type EditPersonScreenRouteProp = RouteProp<RootStackParamList, 'EditPerson'>;

interface Props {
  navigation: EditPersonScreenNavigationProp;
  route: EditPersonScreenRouteProp;
}

// Mock function for image picker - replace with actual library later
const pickImage = async (): Promise<string | undefined> => {
  console.log('Simulating image picker...');
  return undefined;
};

const EditPersonScreen: React.FC<Props> = ({ navigation, route }) => {
  const { personId } = route.params;
  const { theme } = useTheme();
  const styles = themedStyles(theme);

  // State for form fields
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Friend']);
  const [relationshipType, setRelationshipType] = useState('personal');
  const [reminderInterval, setReminderInterval] = useState('weekly');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [activeTagCategory, setActiveTagCategory] = useState('custom');
  
  // Loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Collapsible sections state
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Predefined tag categories with suggestions
  const tagCategories = {
    interests: ['Sports', 'Music', 'Art', 'Travel', 'Food', 'Technology', 'Reading', 'Movies', 'Gaming', 'Fitness'],
    traits: ['Funny', 'Kind', 'Ambitious', 'Creative', 'Reliable', 'Thoughtful', 'Organized', 'Adventurous'],
    contexts: ['Work', 'School', 'Neighbor', 'Childhood', 'Online', 'Mutual Friend', 'Event', 'Group'],
    dynamics: ['Mentor', 'Mentee', 'Collaborator', 'Support', 'Accountability', 'Inspiration'],
    custom: []
  };

  // Fetch relationship data when component mounts
  useEffect(() => {
    const fetchRelationshipData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const relationshipData = await getRelationship(personId);
        
        // Set form fields with existing data
        setName(relationshipData.name || '');
        setBio(relationshipData.bio || '');
        setBirthday(relationshipData.birthday || '');
        setPhone(relationshipData.phone || '');
        setEmail(relationshipData.email || '');
        setLocation(relationshipData.location || '');
        setPreferredCommunication(relationshipData.preferred_communication || '');
        setMeetingFrequency(relationshipData.meeting_frequency || '');
        setNotes(relationshipData.notes || '');
        setPhotoUri(relationshipData.photo_url);
        setSelectedCategories(relationshipData.categories || ['Friend']);
        setRelationshipType(relationshipData.relationship_type || 'personal');
        setReminderInterval(relationshipData.reminder_interval || 'weekly');
        setTags(relationshipData.tags || []);
        
        // Expand sections if they have data
        if (
          relationshipData.birthday || 
          relationshipData.location || 
          relationshipData.meeting_frequency || 
          relationshipData.notes
        ) {
          setShowAdditionalInfo(true);
        }
        
        if (
          relationshipData.phone || 
          relationshipData.email || 
          relationshipData.preferred_communication
        ) {
          setShowContactInfo(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching relationship data:', err);
        setError('Failed to load relationship data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchRelationshipData();
  }, [personId]);

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
    if (!name || selectedCategories.length === 0 || !relationshipType || !reminderInterval) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    try {
      // Create update payload
      const updateData: UpdateRelationshipPayload = {
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
        photo_url: photoUri,
        tags,
        categories: selectedCategories
      };

      console.log('Updating person:', updateData);
      
      // Call the API to update the relationship
      await updateRelationship(personId, updateData);
      
      Alert.alert('Success', `${name} updated successfully.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating person:', error);
      Alert.alert('Error', 'Failed to update person. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading relationship data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        
        <Text style={styles.label}>Relationship Categories: <Text style={styles.required}>*</Text></Text>
        <Text style={styles.helperText}>Select one or more categories that describe this relationship</Text>
        <View style={styles.optionsContainer}>
          {[
            'Friend', 'Family', 'Business', 'Acquaintance', 'Romantic', 'Colleague', 'Neighbor', 'Classmate', 'Community',  
            'Mentor', 'Intellectual Peer', 'Emotional Support'
          ].map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.optionButton,
                selectedCategories.includes(category) && styles.selectedOption
              ]}
              onPress={() => {
                if (selectedCategories.includes(category)) {
                  // Don't allow removing the last category
                  if (selectedCategories.length > 1) {
                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                  }
                } else {
                  setSelectedCategories([...selectedCategories, category]);
                }
              }}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedCategories.includes(category) && styles.selectedOptionText
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
        <Text style={styles.sectionTitle}>Tags</Text>
        <Text style={styles.helperText}>Tags help you remember important details about this relationship</Text>
        
        {/* Tag category selector */}
        <View style={styles.tagCategoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.tagCategoryButton, activeTagCategory === 'interests' && styles.activeTagCategory]} 
              onPress={() => setActiveTagCategory('interests')}
            >
              <MaterialIcons name="interests" size={16} color={activeTagCategory === 'interests' ? theme.colors.background : theme.colors.primary} />
              <Text style={[styles.tagCategoryText, activeTagCategory === 'interests' && styles.activeTagCategoryText]}>Interests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tagCategoryButton, activeTagCategory === 'traits' && styles.activeTagCategory]} 
              onPress={() => setActiveTagCategory('traits')}
            >
              <MaterialIcons name="psychology" size={16} color={activeTagCategory === 'traits' ? theme.colors.background : theme.colors.primary} />
              <Text style={[styles.tagCategoryText, activeTagCategory === 'traits' && styles.activeTagCategoryText]}>Traits</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tagCategoryButton, activeTagCategory === 'contexts' && styles.activeTagCategory]} 
              onPress={() => setActiveTagCategory('contexts')}
            >
              <MaterialIcons name="place" size={16} color={activeTagCategory === 'contexts' ? theme.colors.background : theme.colors.primary} />
              <Text style={[styles.tagCategoryText, activeTagCategory === 'contexts' && styles.activeTagCategoryText]}>Contexts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tagCategoryButton, activeTagCategory === 'dynamics' && styles.activeTagCategory]} 
              onPress={() => setActiveTagCategory('dynamics')}
            >
              <MaterialCommunityIcons name="handshake" size={16} color={activeTagCategory === 'dynamics' ? theme.colors.background : theme.colors.primary} />
              <Text style={[styles.tagCategoryText, activeTagCategory === 'dynamics' && styles.activeTagCategoryText]}>Dynamics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tagCategoryButton, activeTagCategory === 'custom' && styles.activeTagCategory]} 
              onPress={() => setActiveTagCategory('custom')}
            >
              <MaterialIcons name="add" size={16} color={activeTagCategory === 'custom' ? theme.colors.background : theme.colors.primary} />
              <Text style={[styles.tagCategoryText, activeTagCategory === 'custom' && styles.activeTagCategoryText]}>Custom</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {/* Tag suggestions or custom input */}
        {activeTagCategory === 'custom' ? (
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a custom tag"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TouchableOpacity 
              style={styles.addTagButton} 
              onPress={handleAddTag}
            >
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tagSuggestionsContainer}>
            <FlatList
              data={tagCategories[activeTagCategory as keyof typeof tagCategories]}
              horizontal={false}
              numColumns={2}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[
                    styles.tagSuggestion,
                    tags.includes(item) && styles.selectedTagSuggestion
                  ]}
                  onPress={() => {
                    if (tags.includes(item)) {
                      handleRemoveTag(item);
                    } else {
                      setTags([...tags, item]);
                    }
                  }}
                >
                  <Text 
                    style={[
                      styles.tagSuggestionText,
                      tags.includes(item) && styles.selectedTagSuggestionText
                    ]}
                  >
                    {item}
                  </Text>
                  {tags.includes(item) && (
                    <MaterialIcons name="check" size={16} color={theme.colors.background} />
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
          </View>
        )}
        
        {/* Display selected tags */}
        {tags.length > 0 && (
          <View>
            <Text style={styles.selectedTagsTitle}>Selected Tags:</Text>
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
          </View>
        )}
      </View>

      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Function to generate themed styles
const themedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.typography.body.fontSize,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 5,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
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
  tagCategoryContainer: {
    marginBottom: theme.spacing.sm,
  },
  tagCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 50,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  activeTagCategory: {
    backgroundColor: theme.colors.primary,
  },
  tagCategoryText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption.fontSize,
    marginLeft: 4,
  },
  activeTagCategoryText: {
    color: theme.colors.background,
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
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
  tagSuggestionsContainer: {
    marginBottom: theme.spacing.md,
  },
  tagSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 50,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flex: 1,
    maxWidth: '48%',
  },
  selectedTagSuggestion: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tagSuggestionText: {
    color: theme.colors.text,
    fontSize: theme.typography.caption.fontSize,
  },
  selectedTagSuggestionText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  selectedTagsTitle: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
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

export default EditPersonScreen;
