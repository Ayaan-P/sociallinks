import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';
import { RelationshipDashboardItem } from '../../../types/Relationship';
import { formatDaysSince } from '../utils/helpers';
import { ProfileXpBar, CategoryTag } from '../../ProfileScreen/components';

interface RelationshipCardProps {
  item: RelationshipDashboardItem & { isOverdue?: boolean };
  theme: Theme;
  onPress: () => void;
  onPhotoPress?: () => void;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  item,
  theme,
  onPress,
  onPhotoPress
}) => {
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        item.isOverdue && styles.overdueItemContainer
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Left section with photo */}
      <View style={styles.leftSection}>
        {/* Profile Picture / Initial */}
        <TouchableOpacity
          style={[
            styles.photoContainer,
            item.isOverdue && styles.photoContainerOverdue
          ]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the outer onPress
            if (onPhotoPress) onPhotoPress();
          }}
        >
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.photo} />
          ) : (
            <Text style={styles.photoInitial}>{item.name.charAt(0).toUpperCase()}</Text>
          )}

          {/* Level badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{item.level}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Details Section */}
      <View style={styles.itemDetails}>
        <View style={styles.nameAndDaysContainer}>
          <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>

          <Text style={[
            styles.daysSinceText,
            item.isOverdue && styles.daysSinceTextOverdue
          ]}>
            {formatDaysSince(item.days_since_interaction)}
          </Text>
        </View>

        {/* XP Bar - Using ProfileXpBar component with actual XP data */}
        <ProfileXpBar 
          currentXp={item.total_xp || 0}
          xpInLevel={item.xp_earned_in_level || 0}
          xpForLevel={item.xp_needed_for_level || 10}
          level={item.level || 1}
          theme={theme}
        />

        {/* Categories - Use item.categories array */}
        <View style={styles.categoriesContainer}>
          {item.categories && item.categories
            .filter((category, index, self) => self.indexOf(category) === index) // Remove duplicates if any
            .map((category, index) => (
              <CategoryTag
                key={index}
                label={category}
                theme={theme}
              />
            ))
          }
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  itemContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.4 : 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overdueItemContainer: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  leftSection: {
    marginRight: theme.spacing.md,
    alignItems: 'center',
  },
  photoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoContainerOverdue: {
    borderColor: theme.colors.error,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28
  },
  photoInitial: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.background,
    fontWeight: 'bold'
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  levelBadgeText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  nameAndDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    flex: 1, // Allow name to take available space
    marginRight: theme.spacing.sm, // Add margin to prevent overlap
  },
  daysSinceText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  daysSinceTextOverdue: {
    color: theme.colors.error,
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
});

export default RelationshipCard;
