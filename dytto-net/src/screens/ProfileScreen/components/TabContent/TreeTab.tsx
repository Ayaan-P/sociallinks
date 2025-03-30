import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '../../../../types/theme';
import RelationshipTree from '../RelationshipTree';

interface TreeTabProps {
  relationshipId: number;
  theme: Theme;
}

const TreeTab: React.FC<TreeTabProps> = ({
  relationshipId,
  theme
}) => {
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);

  const handleError = (err: Error) => {
    console.error('Tree error:', err);
    setError(err.message);
  };

  return (
    <View style={styles.treeViewSection}>
      <Text style={styles.description}>
        Categories evolve as your relationship grows. Unlock new branches by logging meaningful interactions.
      </Text>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <RelationshipTree 
          relationshipId={relationshipId}
          theme={theme}
          onError={handleError}
        />
      )}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  treeViewSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  description: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: theme.colors.error,
  }
});

export default TreeTab;
