import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Relationship } from '../types/Relationship';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
// Ionicons import removed

// Define navigation props type
type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

// Placeholder data
const dummyData: Relationship[] = [
  { id: '1', name: 'Alice Smith', photo: undefined, level: 3, xp: 65, lastInteraction: '2025-03-25T10:00:00Z', categories: ['Friend'], reminderInterval: 'weekly' },
  { id: '2', name: 'Bob Johnson', photo: undefined, level: 1, xp: 10, lastInteraction: '2025-03-15T12:00:00Z', categories: ['Business', 'Networking'], reminderInterval: 'monthly' },
  { id: '3', name: 'Charlie Brown', photo: undefined, level: 5, xp: 90, lastInteraction: '2025-03-27T15:30:00Z', categories: ['Family'], reminderInterval: 'daily' },
  { id: '4', name: 'Diana Prince', photo: 'https://via.placeholder.com/50', level: 2, xp: 30, lastInteraction: '2025-02-20T09:00:00Z', categories: ['Friend'], reminderInterval: 'biweekly' },
];

// Simple XP Bar component
const MiniXpBar: React.FC<{ currentXp?: number; level: number; theme: Theme }> = ({ currentXp = 0, level, theme }) => {
  const styles = themedStyles(theme);
  const xpToNextLevel = 100;
  const progress = (currentXp % xpToNextLevel) / xpToNextLevel;
  return (
    <View style={styles.miniXpBarContainer}>
      <View style={styles.miniXpBarBackground}>
        <View style={[styles.miniXpBarForeground, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

// Helper functions
const calculateDaysSince = (isoDateString: string): number => {
  const lastDate = new Date(isoDateString);
  const today = new Date();
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const isOverdue = (daysSince: number, interval?: Relationship['reminderInterval']): boolean => {
  if (!interval) return false;
  switch (interval) {
    case 'daily': return daysSince > 1;
    case 'weekly': return daysSince > 7;
    case 'biweekly': return daysSince > 14;
    case 'monthly': return daysSince > 30;
    default: return false;
  }
};

// Main Component
const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = themedStyles(theme);

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const processedData = dummyData.map(rel => {
          const daysSince = calculateDaysSince(rel.lastInteraction);
          return { ...rel, daysSinceLastInteraction: daysSince, isOverdue: isOverdue(daysSince, rel.reminderInterval) };
        });
        setRelationships(processedData);
      } catch (error) { console.error('Error fetching relationships:', error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: Relationship }) => (
    // Main item navigates to LogInteraction screen
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('LogInteraction', { personId: item.id, personName: item.name })}
    >
      {/* Profile Picture / Initial - Wrapped in TouchableOpacity */}
      <TouchableOpacity
        style={styles.photoTouchable} // Added style for touchable area if needed
        onPress={(e) => {
          e.stopPropagation(); // Prevent outer TouchableOpacity onPress
          navigation.navigate('Profile', { personId: item.id });
        }}
      >
        <View style={styles.photoPlaceholder}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.photo} />
          ) : (
            <Text style={styles.photoInitial}>{item.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Details Section */}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.levelAndXpContainer}>
          <Text style={styles.itemLevel}>Level: {item.level}</Text>
          <MiniXpBar currentXp={item.xp} level={item.level} theme={theme} />
        </View>
        <Text style={styles.itemLastInteraction}>
          Last interaction: {item.daysSinceLastInteraction} days ago
        </Text>
        <View style={styles.categoriesContainer}>
          {item.categories.map((category, index) => (
            <View key={index} style={[
              styles.categoryTag,
              item.isOverdue && styles.categoryTagOverdue
            ]}>
              <Text style={[
                styles.categoryTagText,
                item.isOverdue && styles.categoryTagTextOverdue
              ]}>{category}</Text>
            </View>
          ))}
        </View>
      </View>
      {/* Removed rightAlignedSection and Log Button/Icon */}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading relationships...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={relationships}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<View style={styles.emptyListContainer}><Text style={styles.emptyListText}>No relationships added yet. Tap below to add one!</Text></View>}
        contentContainerStyle={relationships.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : {}}
      />
      <View style={styles.addButtonContainer}>
        <Button
          title="+ Add New Person"
          onPress={() => navigation.navigate('AddPerson')}
          color={theme.colors.primary}
        />
      </View>
    </View>
  );
};

// Styles function
const themedStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
  emptyListContainer: { alignItems: 'center', padding: theme.spacing.lg },
  emptyListText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: theme.typography.body.fontSize },
  itemContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.4 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  photoTouchable: { // Style for the touchable area around the photo
     marginRight: theme.spacing.md, // Keep the margin here
  },
  photoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    // marginRight removed, handled by photoTouchable
  },
  photo: { width: 50, height: 50, borderRadius: 25 },
  photoInitial: { fontSize: theme.typography.h3.fontSize, color: theme.colors.background, fontWeight: 'bold' },
  itemDetails: { flex: 1 }, // Removed marginRight as there's no right section now
  itemName: { fontSize: theme.typography.h4.fontSize, fontWeight: theme.typography.h4.fontWeight, color: theme.colors.text, marginBottom: theme.spacing.xs },
  levelAndXpContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  itemLevel: { fontSize: theme.typography.caption.fontSize, color: theme.colors.textSecondary, marginRight: theme.spacing.sm },
  miniXpBarContainer: { flex: 1 },
  miniXpBarBackground: { height: 5, backgroundColor: theme.colors.border, borderRadius: 2.5, overflow: 'hidden' },
  miniXpBarForeground: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2.5 },
  itemLastInteraction: { fontSize: theme.typography.caption.fontSize, color: theme.colors.textSecondary, marginBottom: theme.spacing.xs },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.xs },
  categoryTag: { backgroundColor: theme.colors.border, paddingVertical: theme.spacing.xs / 2, paddingHorizontal: theme.spacing.sm, borderRadius: 4, marginRight: theme.spacing.xs, marginBottom: theme.spacing.xs },
  categoryTagOverdue: { backgroundColor: theme.colors.error + '33' },
  categoryTagText: { color: theme.colors.textSecondary, fontSize: 11 },
  categoryTagTextOverdue: { color: theme.colors.error, fontWeight: '500' },
  // rightAlignedSection style removed
  // logButton style removed
  addButtonContainer: { padding: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
});

export default DashboardScreen;
