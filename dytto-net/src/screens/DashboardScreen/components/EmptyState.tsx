import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';

interface EmptyStateProps {
  onAddPress: () => void;
  theme: Theme;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddPress, theme }) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No relationships yet</Text>
      <Text style={styles.emptyText}>
        Start tracking your real-world relationships by adding your first connection.
      </Text>
      <TouchableOpacity
        style={styles.emptyAddButton}
        onPress={onAddPress}
      >
        <Text style={styles.emptyAddButtonText}>+ Add Your First Person</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
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
});

export default EmptyState;
