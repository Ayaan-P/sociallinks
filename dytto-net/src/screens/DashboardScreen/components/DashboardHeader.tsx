import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../../../types/theme';

interface DashboardHeaderProps {
  relationshipsCount: number;
  onGlobalTreePress: () => void;
  theme: Theme;
  height: Animated.AnimatedInterpolation<string | number>;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  relationshipsCount,
  onGlobalTreePress,
  theme,
  height
}) => {
  const styles = createStyles(theme);

  return (
    <Animated.View style={[styles.header, { height }]}>
      <View style={styles.headerContent}>
        <Text style={styles.headerSubtitle}>
          {relationshipsCount} {relationshipsCount === 1 ? 'Link' : 'Links'}
        </Text>
        {/* Global Tree Button */}
        <TouchableOpacity
          style={styles.globalTreeButton}
          onPress={onGlobalTreePress}
        >
          <MaterialCommunityIcons name="family-tree" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  },
  globalTreeButton: {
    position: 'absolute',
    right: 0,
    padding: theme.spacing.sm,
  },
});

export default DashboardHeader;
