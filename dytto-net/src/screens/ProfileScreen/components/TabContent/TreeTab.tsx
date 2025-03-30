import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../../types/theme';
import TreeNode from '../TreeNode';

interface TreeData {
  id: number;
  label: string;
  level: number;
  active: boolean;
  locked: boolean;
}

interface TreeTabProps {
  treeData: TreeData[];
  theme: Theme;
}

const TreeTab: React.FC<TreeTabProps> = ({
  treeData,
  theme
}) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.treeViewSection}>
      <Text style={styles.sectionTitle}>Relationship Categories</Text>
      <Text style={styles.description}>
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
};

const createStyles = (theme: Theme) => StyleSheet.create({
  treeViewSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  treeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
});

export default TreeTab;
