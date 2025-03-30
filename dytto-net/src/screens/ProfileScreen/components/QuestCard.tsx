import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';
import { Quest } from '../../../types/Quest';

interface QuestCardProps {
  quest: Quest;
  theme: Theme;
  onPress: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ 
  quest, 
  theme, 
  onPress 
}) => {
  const styles = createStyles(theme);
  const completed = quest.quest_status === 'completed';

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
          {quest.quest_description}
        </Text>
        <Text style={styles.questDescription}>
          {completed ? 'Completed' : 'Pending'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});

export default QuestCard;
