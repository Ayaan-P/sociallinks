import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  StatusBar
} from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
// Corrected import name for interaction thread API call
import { getRelationshipOverview, getRelationshipInteractionsThread, deleteRelationship } from '../services/api';
import { RelationshipOverview } from '../types/Relationship';
import { Interaction } from '../types/Interaction';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
// Removed Icon import as it causes errors - can be added back if dependency is fixed
// import Icon from 'react-native-vector-icons/Ionicons';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define route and navigation props type
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  route: ProfileScreenRouteProp;
  navigation: ProfileScreenNavigationProp;
}

// Tab type definition
type TabType = 'Overview' | 'Thread' | 'Tree' | 'Insights';

// --- Reusable Components ---

// Enhanced XP Bar for Profile Screen
const ProfileXpBar: React.FC<{
  currentXp: number;
  xpInLevel: number;
  xpForLevel: number;
  level: number;
  theme: Theme;
}> = ({ currentXp, xpInLevel, xpForLevel, level, theme }) => {
  const styles = themedStyles(theme);
  const progress = xpForLevel > 0 ? xpInLevel / xpForLevel : (level >= 10 ? 1 : 0); // Handle division by zero and max level

  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animation, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [progress]);

  return (
    <View style={styles.xpBarContainer}>
     
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
      <Text style={styles.xpText}>
        {level >= 10 ? `Level ${level} (Max)` : `${xpForLevel-xpInLevel} XP to Level ${level + 1}`}
      </Text>
      <Text style={styles.totalXpText}>Total XP: {currentXp}</Text>
      
    </View>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  label: TabType;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}> = ({ label, active, onPress, theme }) => {
  const styles = themedStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.activeTabButtonText]}>
        {label}
      </Text>
      {active && <View style={styles.activeTabIndicator} />}
    </TouchableOpacity>
  );
};

// Category Tag Component (similar to Dashboard)
const CategoryTag: React.FC<{
  label: string;
  theme: Theme;
  onPress?: () => void;
}> = ({ label, theme, onPress }) => {
  const styles = themedStyles(theme);
  return (
    <TouchableOpacity
      style={styles.categoryTag}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.categoryTagText}>{label}</Text>
    </TouchableOpacity>
  );
};

// Interaction Card Component
const InteractionCard: React.FC<{
  interaction: Interaction;
  theme: Theme;
  expanded?: boolean;
  onPress?: () => void;
}> = ({ interaction, theme, expanded = false, onPress }) => {
  const styles = themedStyles(theme);
  const interactionDate = new Date(interaction.created_at);
  const formattedDate = interactionDate.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const formattedTime = interactionDate.toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit'
  });

  // Animation for card expansion
  const [heightAnim] = useState(new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [expanded]);

  return (
    <TouchableOpacity
      style={[
        styles.interactionCard,
        expanded && styles.interactionCardExpanded
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.interactionCardHeader}>
        <Text style={styles.interactionDate}>{formattedDate} at {formattedTime}</Text>
        {interaction.tone_tag && (
          <View style={[
            styles.toneTag,
            { backgroundColor: getToneColor(interaction.tone_tag, theme) + '30' }
          ]}>
            <Text style={[
              styles.toneTagText,
              { color: getToneColor(interaction.tone_tag, theme) }
            ]}>{interaction.tone_tag}</Text>
          </View>
        )}
      </View>

      <Text style={styles.interactionLog} numberOfLines={expanded ? undefined : 3}>
        {interaction.interaction_log}
      </Text>

      {/* XP Badge */}
      {interaction.xp_gain !== undefined && (
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+{interaction.xp_gain} XP</Text>
        </View>
      )}

      {/* AI Insights - only shown when expanded */}
      <Animated.View style={{
        opacity: heightAnim,
        maxHeight: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 500]
        }),
        overflow: 'hidden'
      }}>
        {expanded && (
          <View style={styles.insightsContainer}>
            {interaction.sentiment_analysis && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Sentiment:</Text>
                <Text style={styles.insightValue}>{interaction.sentiment_analysis}</Text>
              </View>
            )}
            {interaction.ai_reasoning && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>AI Analysis:</Text>
                <Text style={styles.insightValue}>{interaction.ai_reasoning}</Text>
              </View>
            )}
            {interaction.evolution_suggestion && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Evolution Suggestion:</Text>
                <Text style={styles.insightValue}>Consider adding '{interaction.evolution_suggestion}'</Text>
              </View>
            )}
            {interaction.interaction_suggestion && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Next Step:</Text>
                <Text style={styles.insightValue}>{interaction.interaction_suggestion}</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Expand/collapse indicator */}
      <View style={styles.expandIndicator}>
        <Text style={styles.expandIndicatorText}>
          {expanded ? "Show less" : "Show more"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Helper function to get color based on tone
const getToneColor = (tone: string, theme: Theme): string => {
  const toneColors: Record<string, string> = {
    'Happy': theme.colors.success,
    'Deep': theme.colors.primary,
    'Draining': theme.colors.error,
    'Exciting': '#FF9500',
    'Vulnerable': '#9C27B0',
    'Casual': '#03A9F4',
    'Serious': '#607D8B',
    'Tense': '#FF5722',
    'Supportive': '#4CAF50'
  };

  return toneColors[tone] || theme.colors.secondary;
};

// Quest Card Component
const QuestCard: React.FC<{
  title: string;
  description: string;
  completed: boolean;
  theme: Theme;
  onPress: () => void;
}> = ({ title, description, completed, theme, onPress }) => {
  const styles = themedStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.questCard, completed && styles.questCardCompleted]}
      onPress={onPress}
    >
      <View style={styles.questStatusIndicator}>
        <View style={[
          styles.questStatusDot,
          completed && styles.questStatusDotCompleted
        ]} />
      </View>
      <View style={styles.questContent}>
        <Text style={[
          styles.questTitle,
          completed && styles.questTitleCompleted
        ]}>
          {title}
        </Text>
        <Text style={styles.questDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Tree Node Component for Tree View
const TreeNode: React.FC<{
  label: string;
  level: number;
  active: boolean;
  locked: boolean;
  theme: Theme;
}> = ({ label, level, active, locked, theme }) => {
  const styles = themedStyles(theme);

  return (
    <View style={[
      styles.treeNode,
      active && styles.treeNodeActive,
      locked && styles.treeNodeLocked
    ]}>
      <Text style={[
        styles.treeNodeLevel,
        active && styles.treeNodeLevelActive,
        locked && styles.treeNodeLevelLocked
      ]}>
        Lv.{level}
      </Text>
      <Text style={[
        styles.treeNodeLabel,
        active && styles.treeNodeLabelActive,
        locked && styles.treeNodeLabelLocked
      ]}>
        {label}
      </Text>
    </View>
  );
};


// --- Main Profile Screen Component ---

const ProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { personId } = route.params;
  const { theme } = useTheme();
  const styles = themedStyles(theme);

  // State
  const [profileData, setProfileData] = useState<RelationshipOverview | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [expandedInteractionId, setExpandedInteractionId] = useState<number | null>(null);

  // Removed animation values (scrollY, headerHeight) as header is now static

  // Sample quests data (would come from API in real implementation)
  const [quests] = useState([
    {
      id: 1,
      title: 'Ask about childhood',
      description: 'Learn about their formative years to deepen your connection',
      completed: false
    },
    {
      id: 2,
      title: 'Share a personal belief',
      description: 'Open up about something meaningful to you',
      completed: true
    },
    {
      id: 3,
      title: 'Plan a new activity together',
      description: 'Try something neither of you have done before',
      completed: false
    }
  ]);

  // Sample tree data (would come from API in real implementation)
  const [treeData] = useState([
    { id: 1, label: 'Friend', level: 3, active: true, locked: false },
    { id: 2, label: 'Business', level: 2, active: true, locked: false },
    { id: 3, label: 'Mentor', level: 1, active: false, locked: true },
    { id: 4, label: 'Creative Partner', level: 1, active: false, locked: true }
  ]);

  // Sample insights data (would come from API in real implementation)
  const [insights] = useState([
    {
      id: 1,
      title: 'Conversation Patterns',
      description: 'Your conversations tend to be deep and meaningful, often focusing on personal growth.',
      icon: '📊'
    },
    {
      id: 2,
      title: 'Emotional Impact',
      description: 'This relationship has a positive impact on your mood, with 80% of interactions rated as energizing.',
      icon: '😊'
    },
    {
      id: 3,
      title: 'Growth Opportunity',
      description: 'Consider sharing more vulnerable topics to deepen your connection further.',
      icon: '🌱'
    }
  ]);

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // First fetch the overview data which is critical
      const overviewResult = await getRelationshipOverview(Number(personId));
      
      if (!overviewResult) {
        throw new Error("Failed to load profile overview.");
      }
      
      setProfileData(overviewResult);
      
      // Then try to fetch interactions, but handle 404 gracefully
      try {
        const interactionsResult = await getRelationshipInteractionsThread(Number(personId));
        setInteractions(interactionsResult || []);
      } catch (interactionErr) {
        console.log("[API] Error fetching interactions:", interactionErr);
        // If it's a 404 "No interactions found" error, just set empty interactions
        // This is expected for new relationships
        setInteractions([]);
      }
    } catch (err) {
      console.error("[API] Error fetching profile data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [personId]); // Dependency on personId

  // useFocusEffect to refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    fetchData(true);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Relationship",
      `Are you sure you want to delete your connection with ${profileData?.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRelationship(Number(personId));
              Alert.alert("Success", `${profileData?.name} has been deleted.`);
              navigation.goBack(); // Or navigate to Dashboard
            } catch (err) {
              Alert.alert("Error", `Failed to delete relationship: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const toggleInteractionExpand = (id: number) => {
    setExpandedInteractionId(expandedInteractionId === id ? null : id);
  };

  const handleQuestToggle = (id: number) => {
    // In a real implementation, this would update the quest status via API
    Alert.alert(
      "Quest Status",
      "Would you like to mark this quest as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            // Update quest status logic would go here
            Alert.alert("Success", "Quest status updated!");
          }
        }
      ]
    );
  };

  // --- Render Logic ---

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profileData) {
    // This case might occur briefly or if fetch fails silently
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Could not load profile data.</Text>
      </View>
    );
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <>
            {/* Details Section */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Details</Text>
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>
                  Last interaction: {profileData.last_interaction ? new Date(profileData.last_interaction.created_at).toLocaleDateString() : 'Never'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailText}>Reminder: {profileData.reminder_settings || 'Not set'}</Text>
              </View>
            </View>

            {/* Quests Section */}
            <View style={styles.questsSection}>
              <Text style={styles.sectionTitle}>Relationship Quests</Text>
              {quests.map(quest => (
                <QuestCard
                  key={quest.id}
                  title={quest.title}
                  description={quest.description}
                  completed={quest.completed}
                  theme={theme}
                  onPress={() => handleQuestToggle(quest.id)}
                />
              ))}
            </View>

            {/* Recent Interactions Preview */}
            <View style={styles.interactionsSection}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm}}>
                <Text style={styles.sectionTitle}>Recent Interactions</Text>
                <TouchableOpacity onPress={() => setActiveTab('Thread')}>
                  <Text style={{color: theme.colors.primary, fontSize: 14}}>See all</Text>
                </TouchableOpacity>
              </View>

              {interactions.length > 0 ? (
                interactions.slice(0, 2).map(interaction => (
                  <InteractionCard
                    key={interaction.id}
                    interaction={interaction}
                    theme={theme}
                    onPress={() => toggleInteractionExpand(interaction.id)}
                    expanded={expandedInteractionId === interaction.id}
                  />
                ))
              ) : (
                <Text style={styles.noInteractionsText}>No interactions logged yet.</Text>
              )}
            </View>
          </>
        );

      case 'Thread':
        return (
          <View style={styles.interactionsSection}>
            <Text style={styles.sectionTitle}>Interaction History</Text>
            {interactions.length > 0 ? (
              interactions.map(interaction => (
                <InteractionCard
                  key={interaction.id}
                  interaction={interaction}
                  theme={theme}
                  onPress={() => toggleInteractionExpand(interaction.id)}
                  expanded={expandedInteractionId === interaction.id}
                />
              ))
            ) : (
              <Text style={styles.noInteractionsText}>No interactions logged yet.</Text>
            )}
          </View>
        );

      case 'Tree':
        return (
          <View style={styles.treeViewSection}>
            <Text style={styles.sectionTitle}>Relationship Categories</Text>
            <Text style={{color: theme.colors.textSecondary, marginBottom: theme.spacing.md}}>
              Categories evolve as your relationship grows. Unlock new branches by logging meaningful interactions.
            </Text>

            <View style={styles.treeContainer}>
              {treeData.map(node => (
                <TreeNode
                  key={node.id}
                  label={node.label}
                  level={node.level}
                  active={node.active}
                  locked={node.locked}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        );

      case 'Insights':
        return (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>AI Relationship Insights</Text>
            <Text style={{color: theme.colors.textSecondary, marginBottom: theme.spacing.md}}>
              Patterns and suggestions based on your interaction history.
            </Text>

            {insights.map(insight => (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.surface} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header Section with inline XP Bar */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
            {profileData?.photo_url ? (
              <Image source={{ uri: profileData.photo_url }} style={styles.profilePhoto} />
            ) : (
              <View style={[styles.profilePhoto, styles.profileInitialContainer]}>
                <Text style={styles.profileInitial}>{profileData?.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
            )}
            
            {/* XP Bar moved next to profile image */}
            <View style={{flex: 1}}>
            <Text style={styles.profileName}>{profileData?.name}</Text>
              <ProfileXpBar
                currentXp={profileData?.total_xp || 0}
                xpInLevel={profileData?.xp_earned_in_level || 0}
                xpForLevel={profileData?.xp_needed_for_level || 0}
                level={profileData?.level || 0}
                theme={theme}
              />
              {/* Categories */}
          <View style={styles.categoriesContainer}>
            {profileData?.categories?.map((category, index) => (
              <CategoryTag key={index} label={category} theme={theme} />
            ))}
          </View>
            </View>
            
          </View>

        

          
        </View>
      </View>

      {/* Tab Navigation - Outside ScrollView */}
      <View style={styles.tabsContainer}>
        {(['Overview', 'Thread', 'Tree', 'Insights'] as TabType[]).map(tab => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onPress={() => setActiveTab(tab)}
            theme={theme}
          />
        ))}
      </View>

      {/* Action Buttons - Outside ScrollView */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('LogInteraction', { personId: String(personId), personName: profileData.name })}
        >
          <Text style={styles.actionButtonText}>+ Log Interaction</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView
        refreshControl={ // Keep refresh control if desired for the content area
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary}/>
        }
        contentContainerStyle={styles.scrollContentContainer} // Keep padding for content
      >
        {/* Tab Content */}
        {renderTabContent()}

        {/* Delete Button Section */}
        <View style={styles.deleteSection}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Relationship</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// --- Styles ---
const themedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md, // Use lg padding for all sides, including bottom
    // Removed paddingBottom override
    alignItems: "flex-start",
    // No border/margin needed here now
  },
  headerContent: {
     alignItems: 'flex-start',
     // Removed marginBottom as XP bar is no longer directly below
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,

    backgroundColor: theme.colors.secondary, // Fallback bg
  },
  profileInitialContainer: {
     justifyContent: 'center',
     alignItems: 'center',
  },
  profileInitial: {
     fontSize: 40,
     fontWeight: 'bold',
     color: theme.colors.background,
  },
  profileName: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center'
  },
  levelText: {
    fontSize: theme.typography.h4.fontSize,
    color: theme.colors.primary,
    fontWeight: '600',
    
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end', // Center tags
     // Add space below tags
  },
  categoryTag: {
    backgroundColor: theme.colors.border,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12, // More rounded
    margin: theme.spacing.xs / 2,
  },
  categoryTagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  xpBarContainer: {
    width: '100%', // Take full width of header padding
    alignItems: 'flex-end',
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    width: '90%', // Make bar slightly narrower than container
    marginBottom: theme.spacing.xs / 2,
  },
  xpBarForeground: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  xpText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    
  },
  totalXpText: {
     fontSize: 10,
     color: theme.colors.textSecondary,
     marginTop: 2,
  },
  // Tab navigation styles
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    // Removed marginBottom as Action Buttons follow directly
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: theme.colors.surface,
  },
  tabButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  actionsContainer: {
     flexDirection: 'row',
     justifyContent: 'space-around', // Space out buttons
     paddingHorizontal: theme.spacing.lg,
     paddingVertical: theme.spacing.sm,
     borderBottomWidth: 0,
     borderBottomColor: theme.colors.border,
     backgroundColor: theme.colors.background,
     // Add margin below actions before scroll content starts
  },
  actionButton: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: theme.spacing.sm,
  },
  actionButtonText: {
     color: theme.colors.primary,
     marginLeft: theme.spacing.xs,
     fontSize: 14,
     fontWeight: '500',
  },
  detailsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: theme.spacing.sm,
  },
  detailIcon: {
     marginRight: theme.spacing.sm,
  },
  detailText: {
     fontSize: theme.typography.body.fontSize,
     color: theme.colors.text,
  },
  interactionsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  interactionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.3 : 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  interactionCardExpanded: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  interactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  interactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  interactionLog: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  toneTag: {
     backgroundColor: theme.colors.secondary + '30', // Example styling
     paddingVertical: 2,
     paddingHorizontal: 6,
     borderRadius: 4,
     alignSelf: 'flex-start', // Don't take full width
     marginBottom: theme.spacing.xs,
  },
  toneTagText: {
     color: theme.colors.secondary, // Example styling
     fontSize: 11,
     fontWeight: '500',
  },
  xpBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  xpBadgeText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  insightsContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 6,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  insightItem: {
    marginBottom: theme.spacing.xs,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  expandIndicatorText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  aiInsightText: {
     fontSize: 12,
     color: theme.colors.textSecondary,
     marginTop: theme.spacing.sm,
     fontStyle: 'italic',
  },
  noInteractionsText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  // Quest styles
  questsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  questCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  questCardCompleted: {
    opacity: 0.7,
  },
  questStatusIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  questStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  questStatusDotCompleted: {
    backgroundColor: theme.colors.primary,
  },
  questContent: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  questTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  questDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  // Tree view styles
  treeViewSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  treeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  treeNode: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  treeNodeActive: {
    borderLeftColor: theme.colors.primary,
  },
  treeNodeLocked: {
    opacity: 0.5,
    borderLeftColor: theme.colors.border,
  },
  treeNodeLevel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  treeNodeLevelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  treeNodeLevelLocked: {
    color: theme.colors.textSecondary,
  },
  treeNodeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  treeNodeLabelActive: {
    color: theme.colors.text,
  },
  treeNodeLabelLocked: {
    color: theme.colors.textSecondary,
  },
  // Insights styles
  insightsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  insightCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  deleteSection: {
     paddingHorizontal: theme.spacing.lg,
     marginTop: theme.spacing.lg,
     borderTopWidth: 1,
     borderTopColor: theme.colors.border,
     paddingTop: theme.spacing.lg,
  },
  deleteButton: {
     backgroundColor: theme.colors.error + '20', // Light error bg
     paddingVertical: theme.spacing.sm,
     borderRadius: 8,
     alignItems: 'center',
  },
  deleteButtonText: {
     color: theme.colors.error,
     fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
    margin: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: 5,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
  },
  xpBarWrapper: { // Style for the container holding the moved XP bar
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md, // Add some space below the bar
    backgroundColor: theme.colors.surface, // Match header background
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    // Removed marginBottom as it's now part of the fixed section
  },
});

export default ProfileScreen;
