import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';

interface CategoryTagProps {
  label: string;
  theme: Theme;
  onPress?: () => void;
}

const CategoryTag: React.FC<CategoryTagProps> = ({ 
  label, 
  theme, 
  onPress 
}) => {
  const styles = createStyles(theme);
  
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

const createStyles = (theme: Theme) => StyleSheet.create({
  categoryTag: {
    backgroundColor: theme.colors.border,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    margin: theme.spacing.xs / 2,
  },
  categoryTagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});

export default CategoryTag;
