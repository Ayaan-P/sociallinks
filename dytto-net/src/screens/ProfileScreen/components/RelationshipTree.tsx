import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Theme } from '../../../types/theme';
import { TreeData, getRelationshipTree, markInteractionAsMilestone } from '../../../services/api';

interface RelationshipTreeProps {
  relationshipId: number;
  theme: Theme;
  onError?: (error: Error) => void;
}

const RelationshipTree: React.FC<RelationshipTreeProps> = ({ 
  relationshipId, 
  theme,
  onError
}) => {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        setLoading(true);
        const data = await getRelationshipTree(relationshipId);
        setTreeData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching tree data:', err);
        setError('Failed to load tree data');
        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTreeData();
  }, [relationshipId, onError]);

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading relationship tree...</Text>
      </View>
    );
  }

  if (error || !treeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Could not load tree data'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Relationship Tree</Text>
      <Text style={styles.subtitle}>Level {treeData.level} • {treeData.trunk} {treeData.branches.length > 0 ? `+ ${treeData.branches.join(', ')}` : ''}</Text>
      
      {/* Tree Visualization (simplified non-SVG version) */}
      <View style={styles.treeContainer}>
        {/* Trunk */}
        <View style={styles.trunkContainer}>
          <View style={styles.trunk}>
            <Text style={styles.trunkText}>{treeData.trunk}</Text>
          </View>
          
          {/* Level Rings */}
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {treeData.level}</Text>
            <View style={styles.levelRings}>
              {Array.from({ length: treeData.level }).map((_, index) => (
                <View 
                  key={`ring-${index}`} 
                  style={[
                    styles.levelRing, 
                    { 
                      width: 20 + (index * 10), 
                      height: 20 + (index * 10),
                      opacity: 0.3 + (index * 0.07)
                    }
                  ]} 
                />
              ))}
            </View>
          </View>
        </View>
        
        {/* Branches */}
        {treeData.branches.length > 0 && (
          <View style={styles.branchesContainer}>
            <Text style={styles.sectionTitle}>Branches</Text>
            <View style={styles.branchItems}>
              {treeData.branches.map((branch, index) => (
                <View key={index} style={styles.branchItem}>
                  <View style={styles.branchLine} />
                  <Text style={styles.branchText}>{branch}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Buds (Potential Categories) */}
        {treeData.buds.length > 0 && (
          <View style={styles.budsSection}>
            <Text style={styles.sectionTitle}>Potential Categories</Text>
            <View style={styles.budsContainer}>
              {treeData.buds.map((bud, index) => (
                <View key={index} style={styles.budItem}>
                  <Text style={styles.budText}>{bud}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      
      {/* Leaves/Memories Section */}
      <View style={styles.memoriesSection}>
        <Text style={styles.sectionTitle}>Memories</Text>
        {treeData.leaves.length > 0 ? (
          treeData.leaves.map((leaf) => (
            <View key={leaf.id} style={styles.memoryItem}>
              <Text style={styles.memoryText}>{leaf.summary}</Text>
              <Text style={styles.memoryDate}>{new Date(leaf.date).toLocaleDateString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noMemoriesText}>No memories pinned yet. Mark important interactions as milestones to see them here.</Text>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  treeContainer: {
    marginVertical: theme.spacing.lg,
  },
  trunkContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  trunk: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  trunkText: {
    color: theme.isDark ? theme.colors.text : '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  levelRings: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  levelRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 100, // Make it a circle
  },
  branchesContainer: {
    marginBottom: theme.spacing.lg,
  },
  branchItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  branchItem: {
    alignItems: 'center',
    margin: theme.spacing.sm,
  },
  branchLine: {
    width: 3,
    height: 30,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  branchText: {
    color: theme.colors.text,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  budsSection: {
    marginBottom: theme.spacing.lg,
  },
  budsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  budItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.sm,
    margin: theme.spacing.xs,
    opacity: 0.7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  budText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: theme.colors.error,
  },
  memoriesSection: {
    marginTop: theme.spacing.lg,
  },
  memoryItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  memoryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  memoryDate: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  noMemoriesText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    padding: theme.spacing.md,
  },
});

export default RelationshipTree;
