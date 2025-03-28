import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Button } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App'; // Import the param list type
import { Relationship } from '../types/Relationship'; // Import the type
import { useTheme } from '../context/ThemeContext'; // Import useTheme
import { Theme } from '../types/theme'; // Import Theme type

// Define navigation props type
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

// Define route props to receive personId
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
}

// Placeholder function to fetch relationship details by ID
const fetchRelationshipById = async (id: string): Promise<Relationship | null> => {
  console.log(`Fetching details for ID: ${id}`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const dummyData: Relationship[] = [
    { id: '1', name: 'Alice Smith', photo: undefined, level: 3, xp: 65, lastInteraction: '2025-03-25T10:00:00Z', categories: ['Friend'], reminderInterval: 'weekly' },
    { id: '2', name: 'Bob Johnson', photo: undefined, level: 1, xp: 10, lastInteraction: '2025-03-15T12:00:00Z', categories: ['Business', 'Networking'], reminderInterval: 'monthly' },
    { id: '3', name: 'Charlie Brown', photo: undefined, level: 5, xp: 90, lastInteraction: '2025-03-27T15:30:00Z', categories: ['Family'], reminderInterval: 'daily' },
    { id: '4', name: 'Diana Prince', photo: 'https://via.placeholder.com/100', level: 2, xp: 30, lastInteraction: '2025-02-20T09:00:00Z', categories: ['Friend'], reminderInterval: 'biweekly' },
  ];
  const person = dummyData.find(p => p.id === id);
  if (person) {
    const daysSince = calculateDaysSince(person.lastInteraction);
    return { ...person, daysSinceLastInteraction: daysSince };
  }
  return null;
};

// Function to calculate days since last interaction
const calculateDaysSince = (isoDateString: string): number => {
  const lastDate = new Date(isoDateString);
  const today = new Date();
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Placeholder XP Bar component - Now uses theme
const XpBar: React.FC<{ currentXp: number; level: number; theme: Theme }> = ({ currentXp, level, theme }) => {
  const styles = themedStyles(theme); // Use themed styles
  const xpToNextLevel = 100;
  const progress = (currentXp % xpToNextLevel) / xpToNextLevel;

  return (
    <View style={styles.xpContainer}>
      <Text style={styles.xpText}>Level {level} ({currentXp % xpToNextLevel}/{xpToNextLevel} XP)</Text>
      <View style={styles.xpBarBackground}>
        <View style={[styles.xpBarForeground, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};


const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme(); // Use theme context
  const styles = themedStyles(theme); // Generate themed styles
  const { personId } = route.params;
  const [person, setPerson] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchRelationshipById(personId);
      setPerson(data);
      if (data) {
        // Update navigation options with themed styles
        navigation.setOptions({
          title: data.name,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { color: theme.colors.text }
        });
      }
      setLoading(false);
    };
    loadData();
  }, [personId, navigation, theme]); // Add theme to dependency array

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Could not load profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profilePicPlaceholder}>
          {person.photo ? (
            <Image source={{ uri: person.photo }} style={styles.profilePic} />
          ) : (
            <Text style={styles.profilePicInitial}>{person.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.name}>{person.name}</Text>
        {person.xp !== undefined && <XpBar currentXp={person.xp} level={person.level} theme={theme} />}
      </View>

      {/* Overview Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.detailItem}>Level: {person.level}</Text>
        <Text style={styles.detailItem}>Last Interaction: {person.daysSinceLastInteraction} days ago</Text>
        <Text style={styles.detailItem}>Reminder: {person.reminderInterval || 'Not set'}</Text>

        <Text style={styles.detailItem}>Categories:</Text>
        <View style={styles.categoriesContainer}>
          {person.categories.map((category, index) => (
            <Text key={index} style={styles.categoryTag}>{category}</Text>
          ))}
        </View>
      </View>

      {/* Placeholder for Tabs */}
      <View style={styles.tabsPlaceholder}>
        <Text style={styles.placeholderText}>Tabs (Thread, Tree View, Insights) coming soon...</Text>
      </View>

       {/* Action Buttons */}
       <View style={styles.actionsSection}>
         <Button
           title="Log Interaction"
           onPress={() => navigation.navigate('LogInteraction', { personId: person.id, personName: person.name })}
           color={theme.colors.primary} // Use theme color
         />
       </View>

    </ScrollView>
  );
};

// Function to generate themed styles
const themedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Use theme background
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
      color: theme.colors.error,
      fontSize: theme.typography.body.fontSize,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface, // Use theme surface
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // Use theme border
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.secondary, // Use theme secondary
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePicInitial: {
    fontSize: 40, // Consider theme.typography.getResponsiveSize(40)
    color: theme.colors.background, // Text on secondary background
    fontWeight: 'bold',
  },
  name: {
    fontSize: theme.typography.h2.fontSize, // Use theme typography
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text, // Use theme text color
    marginBottom: theme.spacing.md,
  },
  xpContainer: {
    width: '80%',
    alignItems: 'center',
  },
  xpText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  xpBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: theme.colors.border, // Use theme border
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarForeground: {
    height: '100%',
    backgroundColor: theme.colors.success, // Use theme success color for XP
    borderRadius: 4,
  },
  detailsSection: {
    backgroundColor: theme.colors.surface, // Use theme surface
    padding: theme.spacing.md,
    margin: theme.spacing.sm,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  detailItem: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  categoryTag: {
    backgroundColor: theme.colors.border, // Use theme border
    color: theme.colors.textSecondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.caption.fontSize,
  },
  tabsPlaceholder: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    margin: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    fontSize: theme.typography.body.fontSize,
  },
  actionsSection: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  }
});

export default ProfileScreen;
