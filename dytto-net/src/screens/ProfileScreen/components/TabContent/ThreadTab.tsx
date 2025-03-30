import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../../types/theme';
import { Interaction } from '../../../../types/Interaction';
import InteractionCard from '../InteractionCard';

interface ThreadTabProps {
  interactions: Interaction[];
  expandedInteractionId: number | null;
  theme: Theme;
  onInteractionPress: (id: number) => void;
}

const ThreadTab: React.FC<ThreadTabProps> = ({
  interactions,
  expandedInteractionId,
  theme,
  onInteractionPress
}) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.interactionsSection}>
      <Text style={styles.sectionTitle}>Interaction History</Text>
      {interactions.length > 0 ? (
        interactions.map(interaction => (
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
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  interactionsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  noInteractionsText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

export default ThreadTab;
