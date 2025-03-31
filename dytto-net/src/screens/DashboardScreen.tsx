import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RelationshipDashboardItem } from '../types/Relationship';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
import { getDashboardData, getGlobalTreeData } from '../services/api';
import { isOverdue, formatDaysSince } from './DashboardScreen/utils/helpers';
import { RelationshipCard, DashboardHeader, EmptyState } from './DashboardScreen/components';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define navigation props type
type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

// Main Component
const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = themedStyles(theme);

  // State management
  const [relationships, setRelationships] = useState<RelationshipDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalTreeAvailable, setGlobalTreeAvailable] = useState(false);

  // Animation value for header
  const scrollY = new Animated.Value(0);
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [theme.spacing.xl * 2, theme.spacing.lg],
    extrapolate: 'clamp'
  });

  // Check if global tree data is available
  const checkGlobalTreeAvailability = useCallback(async () => {
    try {
      const treeData = await getGlobalTreeData();
      setGlobalTreeAvailable(!!treeData);
    } catch (error) {
      console.error('[Dashboard] Error checking global tree availability:', error);
      setGlobalTreeAvailable(false);
    }
  }, []);

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch dashboard data from the API - returns RelationshipDashboardItem[]
      const dashboardData = await getDashboardData();

      if (!dashboardData || !Array.isArray(dashboardData)) {
        setError('Invalid data format received from server');
        return;
      }

      // Data already matches RelationshipDashboardItem, just need to calculate isOverdue
      const processedData = dashboardData.map((item) => {
        // Calculate isOverdue based on fetched data
        const overdue = isOverdue(
          item.days_since_interaction,
          // Need reminder_interval on dashboard item from backend
          // Assuming it's available (if not, backend needs adjustment or remove overdue logic here)
          (item as any).reminder_interval // Temporary cast if reminder_interval isn't in type yet
        );
        return { ...item, isOverdue: overdue }; // Add isOverdue flag
      });

      // Sort relationships: overdue first, then by level (descending)
      const sortedData = processedData.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return (b.level || 0) - (a.level || 0);
      });

      setRelationships(sortedData);
    } catch (error) {
      console.error('[API] Error fetching dashboard data:', error); // Log the actual error
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to connect to the server');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    fetchData(true);
  };

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
      checkGlobalTreeAvailability();
    }, [fetchData, checkGlobalTreeAvailability])
  );

  // Initial data loading
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isMounted) return;
      try {
        await fetchData();
        await checkGlobalTreeAvailability();
      } catch (e) {
        console.error('[Dashboard] Error in useEffect data loading:', e);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchData, checkGlobalTreeAvailability]);

  // Render relationship item
  const renderItem = ({ item }: { item: RelationshipDashboardItem & { isOverdue?: boolean } }) => (
    <RelationshipCard
      item={item}
      theme={theme}
      onPress={() => navigation.navigate('Profile', { personId: String(item.id) })}
      onPhotoPress={() => navigation.navigate('Profile', { personId: String(item.id) })}
    />
  );

  // Render header component for FlatList
  const renderHeader = () => (
    <DashboardHeader
      relationshipsCount={relationships.length}
      onGlobalTreePress={() => navigation.navigate('GlobalTree')}
      theme={theme}
      height={headerHeight}
    />
  );

  // Render empty state
  const renderEmptyComponent = () => (
    <EmptyState
      onAddPress={() => navigation.navigate('AddPerson')}
      theme={theme}
    />
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

  // List content styles
  listContentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  emptyListContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl,
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
    paddingHorizontal: theme.spacing.lg, // Add padding for better readability
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
