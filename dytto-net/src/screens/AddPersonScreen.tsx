import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { createRelationship, updateRelationship } from '../services/api';
import { CreateRelationshipPayload } from '../types/Relationship';
import PremiumCard from '../components/Premium/PremiumCard';
import PremiumButton from '../components/Premium/PremiumButton';
import PremiumInput from '../components/Premium/PremiumInput';

type AddPersonScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddPerson'>;

interface Props {
  navigation: AddPersonScreenNavigationProp;
}

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface TagCategory {
  id: string;
  name: string;
  icon: string;
  tags: string[];
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'friend',
    name: 'Friend',
    icon: 'people',
    color: '#10B981',
    description: 'Personal friendship',
  },
  {
    id: 'family',
    name: 'Family',
    icon: 'home',
    color: '#F59E0B',
    description: 'Family member',
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'briefcase',
    color: '#3B82F6',
    description: 'Professional contact',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    icon: 'heart',
    color: '#EF4444',
    description: 'Romantic relationship',
  },
  {
    id: 'mentor',
    name: 'Mentor',
    icon: 'school',
    color: '#8B5CF6',
    description: 'Guidance & advice',
  },
  {
    id: 'colleague',
    name: 'Colleague',
    icon: 'business',
    color: '#06B6D4',
    description: 'Work colleague',
  },
];

const TAG_CATEGORIES: TagCategory[] = [
  {
    id: 'interests',
    name: 'Interests',
    icon: 'star',
    tags: ['Sports', 'Music', 'Art', 'Travel', 'Food', 'Technology', 'Reading', 'Movies'],
  },
  {
    id: 'traits',
    name: 'Traits',
    icon: 'psychology',
    tags: ['Funny', 'Kind', 'Ambitious', 'Creative', 'Reliable', 'Thoughtful', 'Organized'],
  },
  {
    id: 'contexts',
    name: 'Contexts',
    icon: 'place',
    tags: ['Work', 'School', 'Neighbor', 'Childhood', 'Online', 'Event', 'Group'],
  },
];

const AddPersonScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Friend']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reminderInterval, setReminderInterval] = useState('weekly');
  const [loading, setLoading] = useState(false);
  
  // UI State
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [activeTagCategory, setActiveTagCategory] = useState('interests');

  const styles = createStyles(theme);

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const handleCategoryToggle = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter(c => c !== categoryName));
      }
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a name for this person.');
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert('Required Field', 'Please select at least one relationship category.');
      return;
    }

    setLoading(true);

    try {
      const relationshipData: CreateRelationshipPayload = {
        name: name.trim(),
        bio: bio.trim() || undefined,
        relationship_type: 'personal',
        reminder_interval: reminderInterval,
        initial_category_name: selectedCategories[0],
        tags: selectedTags,
      };

      const newRelationship = await createRelationship(relationshipData);

      if (selectedCategories.length > 1) {
        try {
          await updateRelationship(newRelationship.id, {
            categories: selectedCategories,
          });
        } catch (updateError) {
          console.error('Error updating categories:', updateError);
        }
      }

      Alert.alert(
        'Success',
        `${name} has been added to your network!`,
        [
          {
            text: 'View Profile',
            onPress: () => {
              navigation.replace('Profile', { personId: String(newRelationship.id) });
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              setName('');
              setBio('');
              setSelectedCategories(['Friend']);
              setSelectedTags([]);
              setReminderInterval('weekly');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating relationship:', error);
      Alert.alert(
        'Error',
        'Failed to add person. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryCard = (category: CategoryOption) => {
    const isSelected = selectedCategories.includes(category.name);
    
    return (
      <PremiumCard
        key={category.id}
        onPress={() => handleCategoryToggle(category.name)}
        variant={isSelected ? 'elevated' : 'default'}
        style={[
          styles.categoryCard,
          isSelected && {
            borderColor: category.color,
            borderWidth: 2,
          },
        ]}
      >
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon as any} size={24} color={category.color} />
        </View>
        
        <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
          {category.name}
        </Text>
        
        <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
          {category.description}
        </Text>
        
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: category.color }]}>
            <Ionicons name="checkmark" size={16} color="white" />
          </View>
        )}
      </PremiumCard>
    );
  };

  const renderTagButton = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    
    return (
      <TouchableOpacity
        key={tag}
        style={[
          styles.tagButton,
          {
            backgroundColor: isSelected 
              ? theme.colors.primary + '20' 
              : theme.colors.surfaceHighlight,
            borderColor: isSelected 
              ? theme.colors.primary 
              : theme.colors.border,
          },
        ]}
        onPress={() => handleTagToggle(tag)}
      >
        <Text style={[
          styles.tagButtonText,
          {
            color: isSelected 
              ? theme.colors.primary 
              : theme.colors.textSecondary,
            fontWeight: isSelected ? '600' : '500',
          },
        ]}>
          {tag}
        </Text>
        
        {isSelected && (
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color={theme.colors.primary}
            style={styles.tagSelectedIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.colors.primary} 
      />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleSection}>
              <Text style={styles.headerTitle}>Add New Person</Text>
              <Text style={styles.headerSubtitle}>Build your network</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Basic Information */}
          <PremiumCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Basic Information
            </Text>
            
            <PremiumInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter their name"
              required
              leftIcon="person"
            />
            
            <PremiumInput
              label="Bio (Optional)"
              value={bio}
              onChangeText={setBio}
              placeholder="Brief description or notes"
              multiline
              numberOfLines={3}
              leftIcon="document-text"
            />
          </PremiumCard>

          {/* Relationship Categories */}
          <PremiumCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Relationship Type
            </Text>
            
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Select one or more categories that describe your relationship
            </Text>
            
            <View style={styles.categoriesGrid}>
              {CATEGORY_OPTIONS.map(renderCategoryCard)}
            </View>
          </PremiumCard>

          {/* Tags */}
          <PremiumCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Tags & Interests
            </Text>
            
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Add tags to remember important details about this person
            </Text>
            
            {/* Tag Category Selector */}
            <View style={styles.tagCategoryContainer}>
              {TAG_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.tagCategoryButton,
                    {
                      backgroundColor: activeTagCategory === category.id 
                        ? theme.colors.primary 
                        : theme.colors.surfaceHighlight,
                    },
                  ]}
                  onPress={() => setActiveTagCategory(category.id)}
                >
                  <MaterialIcons
                    name={category.icon as any}
                    size={16}
                    color={activeTagCategory === category.id ? 'white' : theme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.tagCategoryText,
                    {
                      color: activeTagCategory === category.id 
                        ? 'white' 
                        : theme.colors.textSecondary,
                    },
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Tag Buttons */}
            <View style={styles.tagsContainer}>
              {TAG_CATEGORIES.find(cat => cat.id === activeTagCategory)?.tags.map(renderTagButton)}
            </View>
            
            {/* Selected Tags Summary */}
            {selectedTags.length > 0 && (
              <View style={styles.selectedTagsContainer}>
                <Text style={[styles.selectedTagsTitle, { color: theme.colors.textSecondary }]}>
                  Selected Tags ({selectedTags.length})
                </Text>
                <View style={styles.selectedTagsList}>
                  {selectedTags.map((tag) => (
                    <View key={tag} style={[styles.selectedTag, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Text style={[styles.selectedTagText, { color: theme.colors.primary }]}>
                        {tag}
                      </Text>
                      <TouchableOpacity onPress={() => handleTagToggle(tag)}>
                        <Ionicons name="close" size={16} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </PremiumCard>

          {/* Reminder Settings */}
          <PremiumCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Reminder Settings
            </Text>
            
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              How often would you like to be reminded to connect?
            </Text>
            
            <View style={styles.reminderOptions}>
              {[
                { value: 'weekly', label: 'Weekly', icon: 'calendar' },
                { value: 'biweekly', label: 'Bi-weekly', icon: 'calendar-outline' },
                { value: 'monthly', label: 'Monthly', icon: 'calendar-clear' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.reminderOption,
                    {
                      backgroundColor: reminderInterval === option.value 
                        ? theme.colors.primary + '20' 
                        : theme.colors.surfaceHighlight,
                      borderColor: reminderInterval === option.value 
                        ? theme.colors.primary 
                        : theme.colors.border,
                    },
                  ]}
                  onPress={() => setReminderInterval(option.value)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={reminderInterval === option.value ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text style={[
                    styles.reminderOptionText,
                    {
                      color: reminderInterval === option.value 
                        ? theme.colors.primary 
                        : theme.colors.textSecondary,
                    },
                  ]}>
                    {option.label}
                  </Text>
                  
                  {reminderInterval === option.value && (
                    <View style={[styles.reminderSelectedIndicator, { backgroundColor: theme.colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </PremiumCard>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: theme.colors.background }]}>
          <PremiumButton
            title="Add to Network"
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={!name.trim() || selectedCategories.length === 0}
            icon="add"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 0 : 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Layout
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Sections
  section: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tags
  tagCategoryContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  tagCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagCategoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tagButtonText: {
    fontSize: 14,
  },
  tagSelectedIcon: {
    marginLeft: 4,
  },
  selectedTagsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  selectedTagsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedTagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Reminder Options
  reminderOptions: {
    gap: 12,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  reminderOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  reminderSelectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});

export default AddPersonScreen;