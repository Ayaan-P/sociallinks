import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Relationship } from '../types/Relationship';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
import { 
  getRelationship, 
  getRelationshipOverview, 
  getRelationshipInteractionsThread,
  getRelationshipQuests
} from '../services/api';
import { Interaction } from '../types/Interaction';
import { Quest } from '../types/Quest';

// Get screen dimensions for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define navigation props type
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

// Define route props to receive personId
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
}

// Interface for profile overview data from the API
interface ProfileOverview {
  photo_url?: string;
  name: string;
  level: number;
  reminder_settings?: string;
  xp_bar: number;
  last_interaction?: Interaction;
  relationship_tags?: string[];
}

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

// Format days since last interaction in a user-friendly way
const formatDaysSince = (days: number): string => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

// Enhanced XP Bar component with animation
const XpBar: React.FC<{ currentXp: number; level: number; theme: Theme }> = ({ currentXp, level, theme }) => {
  const styles = themedStyles(theme);
  const xpToNextLevel = 100;
  const progress = (currentXp % xpToNextLevel) / xpToNextLevel;
  
  // Create animated value for progress
  const [animation] = useState(new Animated.Value(0));
  
  React.useEffect(() => {
    // Animate the XP bar when it changes
    Animated.timing(animation, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [progress]);

  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpLabelContainer}>
        <Text style={styles.xpLevel}>Level {level}</Text>
        <Text style={styles.xpText}>{Math.floor(currentXp % xpToNextLevel)}/{xpToNextLevel} XP</Text>
      </View>
      <View style={styles.xpBarBackground}>
        <Animated.View 
          style={[
            styles.xpBarForeground, 
            { width: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              }) 
            }
          ]} 
        />
      </View>
    </View>
  );
};

// Category tag component
const CategoryTag: React.FC<{ 
  label: string; 
  isPrimary?: boolean;
  theme: Theme;
}> = ({ label, isPrimary, theme }) => {
  const styles = themedStyles(theme);
  
  return (
    <View style={[
      styles.categoryTag,
      isPrimary && styles.primaryCategoryTag
    ]}>
      <Text style={[
        styles.categoryTagText,
        isPrimary && styles.primaryCategoryTagText
      ]}>
        {label}
      </Text>
    </View>
  );
};

// Tab interface
interface TabData {
  key: string;
  title: string;
}

// Main component
const ProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = themedStyles(theme);
  const { personId } = route.params;
  
  const [person, setPerson] = useState<Relationship | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Animation value for header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp'
  });

  // Tabs data
  const tabs: TabData[] = [
    { key: 'overview', title: 'Overview' },
    { key: 'thread', title: 'Thread' },
    { key: 'quests', title: 'Quests' }
  ];

  // Use useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          // Fetch relationship overview data from the API
          const overview = await getRelationshipOverview(personId);
          
          // Convert API data to our Relationship format
          const relationshipData: Relationship = {
            id: personId,
            name: overview.name,
            photo_url: overview.photo_url,
            photo: overview.photo_url, // For backward compatibility
            level: overview.level || 1,
            xp: overview.xp_bar || 0,
            category: overview.relationship_tags?.[0] || 'Friend', // Use first tag as primary category
            relationship_type: '', // Not provided in overview
            reminder_interval: overview.reminder_settings || '',
            reminderInterval: overview.reminder_settings, // For backward compatibility
            categories: overview.relationship_tags || [], // Use tags as categories
            daysSinceLastInteraction: overview.last_interaction ? 
              calculateDaysSince(overview.last_interaction.created_at) : 0
          };
          
          setPerson(relationshipData);
          
          // Fetch interactions thread
          const interactionsData = await getRelationshipInteractionsThread(personId);
          setInteractions(interactionsData);
          
          // Fetch quests
          try {
            const questsData = await getRelationshipQuests(personId);
            setQuests(questsData);
          } catch (error) {
            console.log('Quests not available yet:', error);
            setQuests([]);
          }
          
          // Update navigation options with themed styles
          navigation.setOptions({
            title: relationshipData.name,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            headerTitleStyle: { color: theme.colors.text }
          });
        } catch (error) {
          console.error('Error loading relationship data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
      
      // Return a cleanup function (optional)
      return () => {
        // Any cleanup code here
      };
    }, [personId, navigation, theme])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!person) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>Could not load profile information.</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the overview tab content
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Relationship Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Interaction:</Text>
          <Text style={styles.detailValue}>
            {formatDaysSince(person.daysSinceLastInteraction || 0)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Reminder:</Text>
          <Text style={styles.detailValue}>{person.reminderInterval || 'Not set'}</Text>
        </View>
        
        <Text style={styles.categoriesLabel}>Categories:</Text>
        <View style={styles.categoriesContainer}>
          {person.categories && person.categories.map((category, index) => (
            <CategoryTag 
              key={index} 
              label={category} 
              isPrimary={category === person.category}
              theme={theme} 
            />
          ))}
        </View>
      </View>
      
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Relationship Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{person.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{interactions.length}</Text>
            <Text style={styles.statLabel}>Interactions</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{quests.filter(q => q.quest_status === 'completed').length}</Text>
            <Text style={styles.statLabel}>Quests</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Render the thread tab content
  const renderThreadTab = () => (
    <View style={styles.tabContent}>
      {interactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No interactions yet</Text>
          <Text style={styles.emptyStateText}>
            Start building your relationship by logging your first interaction.
          </Text>
        </View>
      ) : (
        interactions.map((interaction, index) => (
          <View key={index} style={styles.interactionItem}>
            <View style={styles.interactionHeader}>
              <Text style={styles.interactionDate}>
                {new Date(interaction.created_at).toLocaleDateString()}
              </Text>
              {interaction.tone_tag && (
                <View style={styles.toneTag}>
                  <Text style={styles.toneTagText}>{interaction.tone_tag}</Text>
                </View>
              )}
            </View>
            <Text style={styles.interactionText}>{interaction.interaction_log}</Text>
            {interaction.sentiment_analysis && (
              <View style={styles.sentimentContainer}>
                <Text style={styles.sentimentLabel}>AI Analysis:</Text>
                <Text style={styles.sentimentText}>{interaction.sentiment_analysis}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </View>
  );

  // Render the quests tab content
  const renderQuestsTab = () => (
    <View style={styles.tabContent}>
      {quests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No quests available</Text>
          <Text style={styles.emptyStateText}>
            Quests will appear here as your relationship grows.
          </Text>
        </View>
      ) : (
        quests.map((quest, index) => (
          <View 
            key={index} 
            style={[
              styles.questItem,
              quest.quest_status === 'completed' && styles.questItemCompleted
            ]}
          >
            <View style={styles.questContent}>
              <Text style={styles.questDescription}>{quest.quest_description}</Text>
              <Text style={styles.questStatus}>{quest.quest_status}</Text>
            </View>
            {quest.quest_status !== 'completed' && (
              <TouchableOpacity 
                style={styles.completeQuestButton}
                onPress={() => {
                  // This would be implemented to mark a quest as complete
                  console.log('Complete quest:', quest.id);
                }}
              >
                <Text style={styles.completeQuestButtonText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'thread':
        return renderThreadTab();
      case 'quests':
        return renderQuestsTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.header, 
          { 
            height: headerHeight,
            opacity: headerOpacity
          }
        ]}
      >
        <View style={styles.profilePicContainer}>
          {person.photo_url ? (
            <Image source={{ uri: person.photo_url }} style={styles.profilePic} />
          ) : (
            <Text style={styles.profilePicInitial}>{person.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.name}>{person.name}</Text>
        <XpBar currentXp={person.xp || 0} level={person.level || 1} theme={theme} />
      </Animated.View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text 
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderTabContent()}
      </ScrollView>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.logButton}
          onPress={() => navigation.navigate('LogInteraction', { 
            personId: String(person.id), 
            personName: person.name 
          })}
        >
          <Text style={styles.logButtonText}>Log Interaction</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Function to generate themed styles
const themedStyles = (theme: Theme) => StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  
  // Header styles
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  profilePicContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profilePic: {
    width: 94,
    height: 94,
    borderRadius: 47,
  },
  profilePicInitial: {
    fontSize: 40,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  name: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  
  // XP Bar styles
  xpContainer: {
    width: '80%',
    marginBottom: theme.spacing.sm,
  },
  xpLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  xpLevel: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  xpText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  xpBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarForeground: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  
  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
  },
  activeTabButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: theme.spacing.md,
  },
  
  // Details section styles
  detailsSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 2,
    textAlign: 'right',
  },
  categoriesLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryTag: {
    backgroundColor: theme.colors.border,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  primaryCategoryTag: {
    backgroundColor: theme.colors.primary + '30',
  },
  categoryTagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  primaryCategoryTagText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // Stats section styles
  statsSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  
  // Interaction thread styles
  interactionItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  interactionDate: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  toneTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 4,
  },
  toneTagText: {
    fontSize: 10,
    color: theme.colors.primary,
  },
  interactionText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sentimentContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 4,
    marginTop: theme.spacing.xs,
  },
  sentimentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  sentimentText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Quest styles
  questItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  questItemCompleted: {
    borderLeftColor: theme.colors.success,
    opacity: 0.8,
  },
  questContent: {
    flex: 1,
  },
  questDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: 4,
  },
  questStatus: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  completeQuestButton: {
    backgroundColor: theme.colors.success + '30',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 4,
    marginLeft: theme.spacing.sm,
  },
  completeQuestButtonText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  emptyStateTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Action button styles
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  logButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
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

export default ProfileScreen;
