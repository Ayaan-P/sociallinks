import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { GlobalBranch } from '../../types/GlobalTree';

interface FilterPanelProps {
  branches: GlobalBranch[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  onClose: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  branches,
  selectedCategories,
  onCategoryToggle,
  onClose,
  onSelectAll,
  onClearAll
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border
    }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Filter by Category</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: theme.colors.border }]}
          onPress={onSelectAll}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Select All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { borderColor: theme.colors.border }]}
          onPress={onClearAll}
        >
          <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Clear All</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.categoriesList}>
        {branches.map(branch => (
          <TouchableOpacity
            key={branch.id}
            style={[
              styles.categoryItem,
              selectedCategories.includes(branch.category) && {
                backgroundColor: theme.colors.primary + '20'
              }
            ]}
            onPress={() => onCategoryToggle(branch.category)}
          >
            <View style={[styles.categoryColor, { backgroundColor: branch.color }]} />
            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
              {branch.category} ({branch.relationshipCount})
            </Text>
            {selectedCategories.includes(branch.category) && (
              <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
        onPress={onClose}
      >
        <Text style={styles.applyButtonText}>Apply Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 280,
    maxHeight: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    zIndex: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
  },
  categoriesList: {
    maxHeight: 250,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default FilterPanel;
