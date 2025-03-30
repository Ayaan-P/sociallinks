import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../../types/theme';
import { getTabIcon } from '../utils/helpers';

// Tab type definition
export type TabType = 'Overview' | 'Thread' | 'Tree' | 'Insights';

interface TabButtonProps {
  label: TabType;
  active: boolean;
  onPress: () => void;
  theme: Theme;
}

const TabButton: React.FC<TabButtonProps> = ({ 
  label, 
  active, 
  onPress, 
  theme 
}) => {
  const styles = createStyles(theme);
  
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTabButton]}
      onPress={onPress}
    >
      <Icon 
        name={getTabIcon(label)} 
        size={24} 
        color={active ? theme.colors.primary : theme.colors.textSecondary} 
      />
      {active && <View style={styles.activeTabIndicator} />}
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: theme.colors.surface,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default TabButton;
