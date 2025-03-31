import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Theme } from '../../../types/theme';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

interface CategoryTagProps {
  label: string;
  theme: Theme;
  onPress?: () => void;
  type?: 'category' | 'tag';
}

// Map of category names to their respective colors and icons
const categoryConfig: Record<string, { color: string, icon: string }> = {
  'Friend': { color: '#4CAF50', icon: 'people' }, // Green
  'Family': { color: '#FF9800', icon: 'family-restroom' }, // Orange
  'Business': { color: '#2196F3', icon: 'business' }, // Blue
  'Acquaintance': { color: '#9E9E9E', icon: 'person' }, // Gray
  'Romantic': { color: '#E91E63', icon: 'favorite' }, // Pink
  'Mentor': { color: '#673AB7', icon: 'school' }, // Purple
  'Colleague': { color: '#00BCD4', icon: 'work' }, // Cyan
  'Neighbor': { color: '#8BC34A', icon: 'home' }, // Light Green
  'Classmate': { color: '#FFC107', icon: 'class' }, // Amber
  'Community': { color: '#795548', icon: 'groups' }, // Brown
  // Default for any other categories
  'default': { color: '#9E9E9E', icon: 'label' } // Gray
};

const CategoryTag: React.FC<CategoryTagProps> = ({ 
  label, 
  theme, 
  onPress,
  type = 'category'
}) => {
  const styles = createStyles(theme);
  
  // Get the configuration for this category, or use default if not found
  const config = type === 'category' ? 
    (categoryConfig[label] || categoryConfig.default) : 
    { color: theme.colors.border, icon: 'local-offer' };
  
  return (
    <TouchableOpacity
      style={[
        styles.categoryTag,
        type === 'category' && { backgroundColor: config.color + '20' }, // Add transparency
        type === 'category' && { borderColor: config.color, borderWidth: 1 }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {type === 'category' && (
        <MaterialIcons 
          name={config.icon as any} 
          size={12} 
          color={config.color} 
          style={styles.icon} 
        />
      )}
      <Text 
        style={[
          styles.categoryTagText,
          type === 'category' && { color: config.color }
        ]}
      >
        {label}
      </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTagText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  icon: {
    marginRight: 4,
  }
});

export default CategoryTag;
