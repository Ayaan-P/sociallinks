import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Theme } from '../../../../types/theme';
import { RelationshipOverview } from '../../../../types/Relationship';
import { Interaction } from '../../../../types/Interaction';
import { Quest } from '../../../../types/Quest';
import InteractionCard from '../InteractionCard';
import QuestCard from '../QuestCard';

interface OverviewTabProps {
  profileData: RelationshipOverview;
  interactions: Interaction[];
  quests: Quest[];
  loadingQuests: boolean;
  expandedInteractionId: number | null;
  theme: Theme;
  onInteractionPress: (id: number) => void;
  onQuestPress: (id: number) => void;
  onGenerateQuest: () => Promise<void>;
  onSeeAllInteractions: () => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  profileData,
  interactions,
  quests,
  loadingQuests,
  expandedInteractionId,
  theme,
  onInteractionPress,
  onQuestPress,
  onGenerateQuest,
  onSeeAllInteractions
}) => {
  const styles = createStyles(theme);

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
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm}}>
          <Text style={styles.sectionTitle}>Relationship Quests</Text>
          <TouchableOpacity 
            style={styles.generateQuestButton}
            onPress={onGenerateQuest}
          >
            <Text style={{color: theme.colors.primary, fontSize: 14}}>+ New Quest</Text>
          </TouchableOpacity>
        </View>
        
        {loadingQuests ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{marginVertical: theme.spacing.md}} />
        ) : quests.length > 0 ? (
          quests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              theme={theme}
              onPress={() => onQuestPress(Number(quest.id))}
            />
          ))
        ) : (
          <Text style={styles.noInteractionsText}>No quests available yet.</Text>
        )}
      </View>

      {/* Recent Interactions Preview */}
      <View style={styles.interactionsSection}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm}}>
          <Text style={styles.sectionTitle}>Recent Interactions</Text>
          <TouchableOpacity onPress={onSeeAllInteractions}>
            <Text style={{color: theme.colors.primary, fontSize: 14}}>See all</Text>
          </TouchableOpacity>
        </View>

        {interactions.length > 0 ? (
          interactions.slice(0, 2).map(interaction => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              theme={theme}
              onPress={() => onInteractionPress(interaction.id)}
              expanded={expandedInteractionId === interaction.id}
            />
          ))
        ) : (
          <Text style={styles.noInteractionsText}>No interactions logged yet.</Text>
        )}
      </View>
    </>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
  detailText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  questsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  generateQuestButton: {
    padding: theme.spacing.xs,
  },
  interactionsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  noInteractionsText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

export default OverviewTab;
