import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar
} from 'react-native';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';
import { getRelationshipOverview, getRelationshipInteractionsThread, deleteRelationship, getRelationshipQuests, updateQuest, generateQuest } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { createStyles } from './styles';
import { 
  ProfileXpBar, 
  TabButton, 
  CategoryTag,
  OverviewTab,
  ThreadTab,
  TreeTab,
  InsightsTab
} from './components';
import { TabType } from './components/TabButton';

// Define route and navigation props type
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'Profile'>;
type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  route: ProfileScreenRouteProp;
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { personId } = route.params;
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // State
  const [profileData, setProfileData] = useState<any | null>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [expandedInteractionId, setExpandedInteractionId] = useState<number | null>(null);

  // Quests data from API
  const [quests, setQuests] = useState<any[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [questError, setQuestError] = useState<string | null>(null);

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

  // Function to fetch quests
  const fetchQuests = useCallback(async () => {
    if (!personId) return;
    
    setLoadingQuests(true);
    setQuestError(null);
    
    try {
      const questsResult = await getRelationshipQuests(Number(personId));
      setQuests(questsResult || []);
    } catch (err) {
      console.log("[API] Error fetching quests:", err);
      // If it's a 404 "No quests found" error, just set empty quests
      setQuests([]);
      setQuestError(err instanceof Error ? err.message : "Failed to load quests.");
    } finally {
      setLoadingQuests(false);
    }
  }, [personId]);

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
      
      // Also fetch quests
      await fetchQuests();
      
    } catch (err) {
      console.error("[API] Error fetching profile data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [personId, fetchQuests]); // Dependencies

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
    // Find the quest to determine its current status
    const quest = quests.find(q => Number(q.id) === id);
    if (!quest) return;
    
    const isCompleted = quest.quest_status === 'completed';
    const newStatus = isCompleted ? 'pending' : 'completed';
    const actionText = isCompleted ? 'mark as pending' : 'mark as completed';
    
    Alert.alert(
      "Quest Status",
      `Would you like to ${actionText}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              // Update quest status via API
              await updateQuest(id, { quest_status: newStatus });
              
              // Update local state
              setQuests(prevQuests => 
                prevQuests.map(q => 
                  Number(q.id) === id ? { ...q, quest_status: newStatus } : q
                )
              );
              
              // Show success message
              Alert.alert(
                "Success", 
                `Quest ${isCompleted ? 'marked as pending' : 'completed'}!${!isCompleted ? ' You earned XP for completing this quest.' : ''}`
              );
              
              // If we completed a quest, refresh the profile data to get updated XP
              if (!isCompleted) {
                fetchData(true);
              }
            } catch (err) {
              console.error("[API] Error updating quest:", err);
              Alert.alert("Error", `Failed to update quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        }
      ]
    );
  };

  const handleGenerateQuest = async () => {
    try {
      setLoadingQuests(true);
      // Call the API to generate a new quest using the service function
      const newQuest = await generateQuest(personId);
      
      // Add the new quest to the list
      setQuests(prevQuests => [newQuest, ...prevQuests]);
      
      Alert.alert("Success", "New quest generated!");
    } catch (err) {
      console.error("[API] Error generating quest:", err);
      Alert.alert("Error", `Failed to generate quest: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingQuests(false);
    }
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
                {profileData?.categories?.map((category: string, index: number) => (
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary}/>
        }
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Tab Content */}
        {activeTab === 'Overview' && (
          <OverviewTab
            profileData={profileData}
            interactions={interactions}
            quests={quests}
            loadingQuests={loadingQuests}
            expandedInteractionId={expandedInteractionId}
            theme={theme}
            onInteractionPress={toggleInteractionExpand}
            onQuestPress={handleQuestToggle}
            onGenerateQuest={handleGenerateQuest}
            onSeeAllInteractions={() => setActiveTab('Thread')}
          />
        )}

        {activeTab === 'Thread' && (
          <ThreadTab
            interactions={interactions}
            expandedInteractionId={expandedInteractionId}
            theme={theme}
            onInteractionPress={toggleInteractionExpand}
          />
        )}

        {activeTab === 'Tree' && (
          <TreeTab
            relationshipId={Number(personId)}
            theme={theme}
          />
        )}

        {activeTab === 'Insights' && (
          <InsightsTab
            insights={insights}
            theme={theme}
          />
        )}

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

export default ProfileScreen;
