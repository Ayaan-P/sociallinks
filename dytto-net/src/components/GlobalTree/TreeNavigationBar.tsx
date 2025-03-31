import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface TreeNavigationBarProps {
  onSearchChange: (text: string) => void;
  onShowInsight: () => void;
  onToggleHealthMode: () => void;
  onToggleTimelineView: () => void;
  onFilterPress: () => void;
  showHealthMode: boolean;
  showTimelineView: boolean;
  searchText: string;
}

const TreeNavigationBar: React.FC<TreeNavigationBarProps> = ({
  onSearchChange,
  onShowInsight,
  onToggleHealthMode,
  onToggleTimelineView,
  onFilterPress,
  showHealthMode,
  showTimelineView,
  searchText
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.text} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search people by name or tag..."
          placeholderTextColor={theme.colors.text + '80'}
          value={searchText}
          onChangeText={onSearchChange}
        />
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onShowInsight}
        >
          <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            showHealthMode && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={onToggleHealthMode}
        >
          <Ionicons 
            name="pulse" 
            size={24} 
            color={showHealthMode ? theme.colors.primary : theme.colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onFilterPress}
        >
          <Ionicons name="filter" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            showTimelineView && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={onToggleTimelineView}
        >
          <MaterialIcons 
            name="timeline" 
            size={24} 
            color={showTimelineView ? theme.colors.primary : theme.colors.text} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
});

export default TreeNavigationBar;
