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
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RelationshipDashboardItem } from '../types/Relationship';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { getDashboardData, getGlobalTreeData } from '../services/api';
import { isOverdue, formatDaysSince } from './DashboardScreen/utils/helpers';
import PremiumCard from '../components/Premium/PremiumCard';
import PremiumButton from '../components/Premium/PremiumButton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

interface DashboardHeaderProps {
  relationshipsCount: number;
  onGlobalTreePress: () => void;
  onAddPress: () => void;
  theme: any;
  scrollY: Animated.Value;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  relationshipsCount,
  onGlobalTreePress,
  onAddPress,
  theme,
  scrollY,
}) => {
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View 
      style={[
        styles.headerContainer,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Header Content */}
        <View style={styles.headerContent}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.welcomeText, { color: theme.colors.textInverse }]}>
              Welcome back
            </Text>
            <Text style={[styles.appTitle, { color: theme.colors.textInverse }]}>
              Your Network
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textInverse + 'CC' }]}>
              {relationshipsCount} {relationshipsCount === 1 ? 'connection' : 'connections'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={onGlobalTreePress}
            >
              <MaterialCommunityIcons 
                name="family-tree" 
                size={24} 
                color={theme.colors.textInverse} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.headerActionButton, styles.addButton]}
              onPress={onAddPress}
            >
              <Ionicons 
                name="add" 
                size={24} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.textInverse }]}>
              {relationshipsCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textInverse + 'CC' }]}>
              Total
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.textInverse }]}>
              {Math.ceil(relationshipsCount * 0.3)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textInverse + 'CC' }]}>
              Active
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.textInverse }]}>
              {Math.floor(relationshipsCount * 0.2)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textInverse + 'CC' }]}>
              Due
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

interface RelationshipCardProps {
  item: RelationshipDashboardItem & { isOverdue?: boolean };
  theme: any;
  onPress: () => void;
  index: number;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  item,
  theme,
  onPress,
  index,
}) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <PremiumCard
        onPress={onPress}
        variant={item.isOverdue ? 'elevated' : 'default'}
        borderRadius="lg"
        style={[
          styles.relationshipCard,
          item.isOverdue && {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.warning,
          },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: theme.colors.textInverse }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
                {item.name}
              </Text>
              <Text style={[styles.lastInteraction, { 
                color: item.isOverdue ? theme.colors.warning : theme.colors.textSecondary 
              }]}>
                {formatDaysSince(item.days_since_interaction)}
              </Text>
            </View>
          </View>

          {/* Level Badge */}
          <View style={[styles.levelBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.levelText, { color: theme.colors.textInverse }]}>
              {item.level}
            </Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
              Progress to Level {item.level + 1}
            </Text>
            <Text style={[styles.progressText, { color: theme.colors.textTertiary }]}>
              {item.xp_earned_in_level}/{item.xp_needed_for_level} XP
            </Text>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: theme.colors.borderLight }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${item.xp_bar_percentage}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          {item.categories?.slice(0, 2).map((category, index) => (
            <View
              key={index}
              style={[
                styles.categoryTag,
                { backgroundColor: theme.colors.primary + '20' },
              ]}
            >
              <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
                {category}
              </Text>
            </View>
          ))}
          
          {item.categories && item.categories.length > 2 && (
            <Text style={[styles.moreCategories, { color: theme.colors.textTertiary }]}>
              +{item.categories.length - 2} more
            </Text>
          )}
        </View>
      </PremiumCard>
    </Animated.View>
  );
};

const EmptyState: React.FC<{ onAddPress: () => void; theme: any }> = ({
  onAddPress,
  theme,
}) => (
  <View style={styles.emptyState}>
    <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceHighlight }]}>
      <MaterialCommunityIcons
        name="account-heart"
        size={64}
        color={theme.colors.primary}
      />
    </View>
    
    <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
      Start Building Connections
    </Text>
    
    <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
      Add your first person to begin tracking and growing your meaningful relationships.
    </Text>
    
    <PremiumButton
      title="Add Your First Person"
      onPress={onAddPress}
      variant="primary"
      size="lg"
      icon="add"
      style={styles.emptyButton}
    />
  </View>
);

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [relationships, setRelationships] = useState<RelationshipDashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollY = new Animated.Value(0);

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const dashboardData = await getDashboardData();

      if (!dashboardData || !Array.isArray(dashboardData)) {
        setError('Invalid data format received from server');
        return;
      }

      const processedData = dashboardData.map((item) => ({
        ...item,
        isOverdue: isOverdue(item.days_since_interaction, (item as any).reminder_interval),
      }));

      const sortedData = processedData.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return (b.level || 0) - (a.level || 0);
      });

      setRelationships(sortedData);
    } catch (error) {
      console.error('[API] Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to the server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    fetchData(true);
  };

  const renderItem = ({ item, index }: { item: RelationshipDashboardItem & { isOverdue?: boolean }; index: number }) => (
    <RelationshipCard
      item={item}
      theme={theme}
      onPress={() => navigation.navigate('Profile', { personId: String(item.id) })}
      index={index}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.primary} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your connections...
          </Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar 
          barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.primary} 
        />
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
            Connection Error
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <PremiumButton
            title="Try Again"
            onPress={() => fetchData()}
            variant="primary"
            icon="refresh"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary} 
      />
      
      <FlatList
        data={relationships}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <DashboardHeader
            relationshipsCount={relationships.length}
            onGlobalTreePress={() => navigation.navigate('GlobalTree')}
            onAddPress={() => navigation.navigate('AddPerson')}
            theme={theme}
            scrollY={scrollY}
          />
        }
        ListEmptyComponent={
          <EmptyState
            onAddPress={() => navigation.navigate('AddPerson')}
            theme={theme}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          relationships.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Styles
  headerContainer: {
    marginBottom: 8,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: 'white',
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },

  // List Styles
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyListContent: {
    flexGrow: 1,
  },

  // Card Styles
  cardContainer: {
    marginBottom: 16,
  },
  relationshipCard: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  lastInteraction: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Progress Styles
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Categories Styles
  categoriesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreCategories: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    width: '100%',
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});

export default DashboardScreen;