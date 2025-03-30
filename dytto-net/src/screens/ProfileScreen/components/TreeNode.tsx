import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';

interface TreeNodeProps {
  label: string;
  level: number;
  active: boolean;
  locked: boolean;
  theme: Theme;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  label, 
  level, 
  active, 
  locked, 
  theme 
}) => {
  const styles = createStyles(theme);

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

const createStyles = (theme: Theme) => StyleSheet.create({
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
});

export default TreeNode;
