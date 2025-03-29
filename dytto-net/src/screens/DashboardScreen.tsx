import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Relationship } from '../types/Relationship';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
import { getDashboardData, API_BASE_URL } from '../services/api';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define navigation props type
type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

// Enhanced XP Bar component with animation
const MiniXpBar: React.FC<{ currentXp?: number; level: number; theme: Theme }> = ({ currentXp = 0, level, theme }) => {
  const styles = themedStyles(theme);
  const xpToNextLevel = 100;
  const progress = (currentXp % xpToNextLevel) / xpToNextLevel;
  
  // Create animated value for progress
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Animate the XP bar when it changes
    Animated.timing(animation, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [progress]);
  
  return (
    <View style={styles.miniXpBarContainer}>
      <View style={styles.miniXpBarBackground}>
        <Animated.View 
          style={[
            styles.miniXpBarForeground, 
            { width: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
      </View>
      <Text style={styles.xpText}>{`${Math.floor(currentXp % xpToNextLevel)}/${xpToNextLevel} XP`}</Text>
    </View>
  );
};

// Relationship category tag component
const CategoryTag: React.FC<{ 
  label: string; 
  isOverdue?: boolean; 
  theme: Theme;
  isPrimary?: boolean;
}> = ({ label, isOverdue, theme, isPrimary }) => {
  const styles = themedStyles(theme);
  
  return (
    <View style={[
      styles.categoryTag,
      isPrimary && styles.primaryCategoryTag,
      isOverdue && styles.categoryTagOverdue
    ]}>
      <Text style={[
        styles.categoryTagText,
        isPrimary && styles.primaryCategoryTagText,
        isOverdue && styles.categoryTagTextOverdue
      ]}>
        {label}
      </Text>
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

const isOverdue = (daysSince: number, interval?: Relationship['reminderInterval'] | Relationship['reminder_interval']): boolean => {
  if (!interval) return false;
  switch (interval) {
    case 'daily': return daysSince > 1;
    case 'weekly': return daysSince > 7;
    case 'biweekly': return daysSince > 14;
    case 'monthly': return daysSince > 30;
    default: return false;
  }
};

// Format days since last interaction in a user-friendly way
const formatDaysSince = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

// Main Component
const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = themedStyles(theme);

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation value for header
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [theme.spacing.xl * 2, theme.spacing.lg],
    extrapolate: 'clamp'
  });

  const fetchData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch dashboard data from the API
      const dashboardData = await getDashboardData();
      
      if (!dashboardData || !Array.isArray(dashboardData)) {
        setError('Invalid data format received from server');
        return;
      }
      
      // Process the data to match our frontend needs
      const processedData = dashboardData.map((item) => {
        // Convert backend format to frontend format
        const relationship: Relationship = {
          id: item.id,
          name: item.name || 'Unknown',
          photo_url: item.photo_url,
          photo: item.photo_url, // For backward compatibility
          level: item.level || 1,
          category: item.category || 'Friend',
          tags: item.tags || [],
          categories: [item.category || 'Friend', ...(item.tags || [])], // Combine category and tags for UI
          relationship_type: item.relationship_type || '',
          reminder_interval: item.reminder_interval || '',
          reminderInterval: item.reminder_interval || '', // For backward compatibility
          daysSinceLastInteraction: typeof item.days_since_interaction === 'number' 
            ? item.days_since_interaction 
            : 0,
          xp: item.xp || 0
        };
        
        // Calculate if the relationship is overdue
        relationship.isOverdue = isOverdue(
          relationship.daysSinceLastInteraction || 0, 
          relationship.reminder_interval || relationship.reminderInterval
        );
        
        return relationship;
      });
      
      // Sort relationships: overdue first, then by level (descending)
      const sortedData = processedData.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return (b.level || 0) - (a.level || 0);
      });
      
      setRelationships(sortedData);
    } catch (error) { 
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to connect to the server');
      }
    } finally { 
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    fetchData(true);
  };

  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      try {
        await fetchData();
      } catch (e) {
        console.error('[Dashboard] Error in useEffect data loading:', e);
      }
    };
    
    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  const renderItem = ({ item }: { item: Relationship }) => {
    const isMainCategory = (category: string) => 
      category === item.category || category === 'Friend' || category === 'Business' || category === 'Family';
    
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          item.isOverdue && styles.overdueItemContainer
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('LogInteraction', { personId: String(item.id), personName: item.name })}
      >
        {/* Left section with photo and quick log button */}
        <View style={styles.leftSection}>
          {/* Profile Picture / Initial */}
          <TouchableOpacity
            style={[
              styles.photoContainer,
              item.isOverdue && styles.photoContainerOverdue
            ]}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('Profile', { personId: String(item.id) });
            }}
          >
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.photo} />
            ) : (
              <Text style={styles.photoInitial}>{item.name.charAt(0).toUpperCase()}</Text>
            )}
            
            {/* Level badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{item.level}</Text>
            </View>
          </TouchableOpacity>
          
          {/* Quick log button */}
          <TouchableOpacity 
            style={styles.quickLogButton}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('LogInteraction', { personId: String(item.id), personName: item.name });
            }}
          >
            <Text style={styles.quickLogButtonText}>Log</Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.itemDetails}>
          <View style={styles.nameAndDaysContainer}>
            <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
              {item.name}
            </Text>
            
            <Text style={[
              styles.daysSinceText,
              item.isOverdue && styles.daysSinceTextOverdue
            ]}>
              {formatDaysSince(item.daysSinceLastInteraction || 0)}
            </Text>
          </View>
          
          {/* XP Bar */}
          <MiniXpBar currentXp={item.xp} level={item.level || 1} theme={theme} />
          
          {/* Categories */}
          <View style={styles.categoriesContainer}>
            {item.categories && item.categories
              .filter((category, index, self) => self.indexOf(category) === index) // Remove duplicates
              .map((category, index) => (
                <CategoryTag 
                  key={index} 
                  label={category} 
                  isOverdue={item.isOverdue}
                  isPrimary={isMainCategory(category)}
                  theme={theme} 
                />
              ))
            }
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render header component for FlatList
  const renderHeader = () => (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      
      <Text style={styles.headerSubtitle}>
        {relationships.length} {relationships.length === 1 ? 'relationship' : 'relationships'} tracked
      </Text>
    </Animated.View>
  );

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No relationships yet</Text>
      <Text style={styles.emptyText}>
        Start tracking your real-world relationships by adding your first connection.
      </Text>
      <TouchableOpacity 
        style={styles.emptyAddButton}
        onPress={() => navigation.navigate('AddPerson')}
      >
        <Text style={styles.emptyAddButtonText}>+ Add Your First Person</Text>
      </TouchableOpacity>
    </View>
  );

  // Render footer with add button
  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AddPerson')}
      >
        <Text style={styles.addButtonText}>+ Add New Person</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your relationships...</Text>
      </View>
    );
  }
  
  if (error && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchData()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={relationships}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={relationships.length > 0 ? renderFooter : null}
        contentContainerStyle={
          relationships.length === 0 
            ? styles.emptyListContentContainer 
            : styles.listContentContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

// Enhanced styles with improved visual design
const themedStyles = (theme: Theme) => StyleSheet.create({
  // Container styles
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  centerContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // Header styles
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
  },
  
  // List content styles
  listContentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyListContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl,
  },
  
  // Item container styles
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
  overdueItemContainer: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  
  // Left section styles (photo and log button)
  leftSection: {
    marginRight: theme.spacing.md,
    alignItems: 'center',
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoContainerOverdue: {
    borderColor: theme.colors.error,
  },
  photo: { 
    width: 56, 
    height: 56, 
    borderRadius: 28 
  },
  photoInitial: { 
    fontSize: theme.typography.h3.fontSize, 
    color: theme.colors.background, 
    fontWeight: 'bold' 
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  levelBadgeText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickLogButton: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 4,
  },
  quickLogButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Details section styles
  itemDetails: { 
    flex: 1,
  },
  nameAndDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  itemName: { 
    fontSize: theme.typography.h4.fontSize, 
    fontWeight: theme.typography.h4.fontWeight, 
    color: theme.colors.text,
    flex: 1,
  },
  daysSinceText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  daysSinceTextOverdue: {
    color: theme.colors.error,
    fontWeight: '500',
  },
  
  // XP Bar styles
  miniXpBarContainer: { 
    marginBottom: theme.spacing.sm,
  },
  miniXpBarBackground: { 
    height: 6, 
    backgroundColor: theme.colors.border, 
    borderRadius: 3, 
    overflow: 'hidden',
    marginBottom: 2,
  },
  miniXpBarForeground: { 
    height: '100%', 
    backgroundColor: theme.colors.primary, 
    borderRadius: 3,
  },
  xpText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  
  // Categories styles
  categoriesContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  categoryTag: { 
    backgroundColor: theme.colors.border, 
    paddingVertical: 2, 
    paddingHorizontal: theme.spacing.sm, 
    borderRadius: 4, 
    marginRight: theme.spacing.xs, 
    marginBottom: theme.spacing.xs,
  },
  primaryCategoryTag: {
    backgroundColor: theme.colors.primary + '30',
  },
  categoryTagOverdue: { 
    backgroundColor: theme.colors.error + '20',
  },
  categoryTagText: { 
    color: theme.colors.textSecondary, 
    fontSize: 11,
  },
  primaryCategoryTagText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  categoryTagTextOverdue: { 
    color: theme.colors.error, 
    fontWeight: '500',
  },
  
  // Empty state styles
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyAddButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Footer styles
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Loading and error states
  loadingText: { 
    color: theme.colors.textSecondary, 
    marginTop: theme.spacing.sm,
  },
  errorTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  errorText: { 
    color: theme.colors.textSecondary, 
    fontSize: theme.typography.body.fontSize, 
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DashboardScreen;
