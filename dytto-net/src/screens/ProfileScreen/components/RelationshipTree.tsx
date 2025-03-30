import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Theme } from '../../../types/theme';
import { 
  TreeData, 
  TreeCompletionData, 
  getRelationshipTree, 
  getTreeCompletionStatus, 
  markInteractionAsMilestone 
} from '../../../services/api';

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
      <View style={styles.header}>
        <Text style={styles.title}>Relationship Tree</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>Level {treeData.level}</Text>
        </View>
      </View>
      
      {/* <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Base Category:</Text>
          <Text style={styles.summaryValue}>{treeData.trunk}</Text>
        </View>
        
        {treeData.branches.length > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Evolved Into:</Text>
            <Text style={styles.summaryValue}>{treeData.branches.join(', ')}</Text>
          </View>
        )}
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Age:</Text>
          <Text style={styles.summaryValue}>{treeData.relationship_age_days} days</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Growth Progress:</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(treeData.level / 10) * 100}%` },
                treeData.is_complete && styles.progressBarComplete
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {treeData.is_complete ? 'Complete' : `${treeData.level}/10`}
          </Text>
        </View>
      </View> */}
      
      {/* Decision Tree Visualization */}
      <View style={styles.decisionTreeContainer}>
        
        {/* Tree Structure */}
        <View style={styles.treeStructure}>
          {/* Root Node (Base Category) */}
          <View style={styles.rootNodeRow}>
            <View style={styles.rootNode}>
              <Text style={styles.nodeText}>{treeData.trunk}</Text>
            </View>
          </View>
          
          {/* Connector Line */}
          {treeData.branches.length > 0 && (
            <View style={styles.verticalConnector} />
          )}
          
          {/* First Level Branches */}
          {treeData.branches.length > 0 && (
            <View style={styles.branchesRow}>
              {treeData.branches.map((branch, index) => (
                <View key={index} style={styles.branchNodeContainer}>
                  {/* Horizontal connector to branch */}
                  <View style={styles.horizontalConnector} />
                  
                  {/* Branch Node */}
                  <View style={styles.decisionTreeBranchNode}>
                    <Text style={styles.nodeText}>{branch}</Text>
                  </View>
                  
                  {/* Potential Categories under this branch */}
                  {treeData.fireflies.length > 0 && index === 0 && (
                    <>
                      <View style={styles.subBranchConnector} />
                      <View style={styles.subBranchesRow}>
                        {treeData.fireflies.slice(0, 2).map((firefly, fIndex) => (
                          <View key={fIndex} style={styles.fireflyNodeContainer}>
                            <View style={styles.horizontalDashedConnector} />
                            <View style={styles.decisionTreeFireflyNode}>
                              <Text style={styles.nodeText}>{firefly.category}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
          
          {/* If no branches yet, show potential categories directly */}
          {treeData.branches.length === 0 && treeData.fireflies.length > 0 && (
            <>
              <View style={styles.verticalConnector} />
              <View style={styles.branchesRow}>
                {treeData.fireflies.slice(0, 3).map((firefly, index) => (
                  <View key={index} style={styles.branchNodeContainer}>
                    <View style={styles.horizontalDashedConnector} />
                    <View style={styles.decisionTreeFireflyNode}>
                      <Text style={styles.nodeText}>{firefly.category}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </View>
      
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
  },
  headerBadge: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
  },
  headerBadgeText: {
    color: theme.isDark ? theme.colors.text : '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Summary card styles
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    width: '40%',
  },
  summaryValue: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    flex: 1,
  },
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: theme.colors.success,
  },
  progressText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  
  // Decision Tree Visualization styles
  decisionTreeContainer: {
    height: 350,
    marginVertical: theme.spacing.xl,
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    overflow: 'hidden',
  },
  levelIndicatorBar: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  treeStructure: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: theme.spacing.md,
  },
  rootNodeRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  rootNode: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 50,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  nodeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  verticalConnector: {
    width: 2,
    height: 30,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  branchesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  branchNodeContainer: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  horizontalConnector: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  decisionTreeBranchNode: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subBranchConnector: {
    width: 2,
    height: 20,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  subBranchesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  fireflyNodeContainer: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  horizontalDashedConnector: {
    width: 30,
    height: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginBottom: theme.spacing.sm,
  },
  decisionTreeFireflyNode: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Network Graph Visualization styles
  networkContainer: {
    height: 350,
    marginVertical: theme.spacing.xl,
    position: 'relative',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
    overflow: 'hidden',
  },
  centralNodeContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    zIndex: 10,
  },
  centralNode: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  centralNodeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  levelIndicator: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  levelCircle: {
    width: 80,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  levelText: {
    marginTop: theme.spacing.xs,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  categoryNodesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryNodeWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 5,
  },
  categoryNode: {
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trunkNode: {
    backgroundColor: '#FFEBC1', // Light beige for trunk node
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  branchNode: {
    backgroundColor: theme.colors.success + '20', // 20% opacity
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  fireflyNode: {
    backgroundColor: theme.colors.border + '50', // 50% opacity
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  categoryNodeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  connectionLine: {
    height: 2,
    backgroundColor: theme.colors.border,
    position: 'absolute',
    top: '50%',
    left: 0,
    transformOrigin: 'left center',
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  
  // Tree Visualization styles
  treeVisualization: {
    height: 400,
    marginVertical: theme.spacing.xl,
    position: 'relative',
  },
  branchesContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 200,
  },
  branchWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  branch: {
    position: 'absolute',
    width: 120,
    height: 3,
    backgroundColor: '#8B4513', // Brown color for branch
    top: 100,
    left: '50%',
    transformOrigin: 'left center',
  },
  branchLeft: {
    transform: [{ rotate: '-30deg' }],
  },
  branchRight: {
    transform: [{ rotate: '30deg' }],
  },
  branchLabel: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  branchLabelLeft: {
    top: 50,
    left: '25%',
  },
  branchLabelRight: {
    top: 50,
    right: '25%',
  },
  blossom: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF9AA2', // Pink color for blossom
  },
  blossomLeft: {
    top: 80,
    left: '30%',
  },
  blossomRight: {
    top: 80,
    right: '30%',
  },
  leaf: {
    position: 'absolute',
    width: 15,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B5EAD7', // Green color for leaf
    transform: [{ rotate: '45deg' }],
  },
  leafLeft: {
    transform: [{ rotate: '-30deg' }],
  },
  leafRight: {
    transform: [{ rotate: '30deg' }],
  },
  trunkContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  trunk: {
    width: 20,
    height: 100,
    backgroundColor: '#8B4513', // Brown color for trunk
  },
  trunkCircle: {
    position: 'absolute',
    bottom: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEBC1', // Light beige for trunk circle
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFD700', // Gold color for circle border
    borderStyle: 'solid',
  },
  trunkText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513', // Brown color for text
  },
  rootsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  root: {
    height: 30,
    width: 3,
    backgroundColor: '#8B4513', // Brown color for roots
    marginHorizontal: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  rootLeft: {
    transform: [{ rotate: '-30deg' }],
  },
  rootCenter: {
    height: 40,
  },
  rootRight: {
    transform: [{ rotate: '30deg' }],
  },
  
  // Tree container
  treeContainer: {
    marginVertical: theme.spacing.md,
  },
  treeSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  
  // Categories section
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
  },
  trunkCard: {
    borderLeftColor: theme.colors.primary,
  },
  branchCard: {
    borderLeftColor: theme.colors.success,
  },
  categoryType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  categoryDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  // Rings section
  ringsContainer: {
    marginTop: theme.spacing.sm,
  },
  ringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ringCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  ringCircleComplete: {
    backgroundColor: theme.colors.success,
  },
  ringCircleIncomplete: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    marginRight: theme.spacing.sm,
  },
  ringInfo: {
    flex: 1,
  },
  ringLevel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  ringDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  ringProgress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  // Fireflies section
  firefliesSection: {
    marginBottom: theme.spacing.lg,
  },
  firefliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fireflyCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  fireflyCardSuggested: {
    borderColor: theme.colors.primary,
    borderStyle: 'solid',
  },
  fireflyName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  aiSuggestedBadge: {
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  aiSuggestedText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // Achievements section
  achievementsContainer: {
    marginTop: theme.spacing.sm,
  },
  achievementCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  achievementDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.colors.text,
  },
  
  // Memories section
  memoriesContainer: {
    marginTop: theme.spacing.sm,
  },
  memoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  memoryText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sentimentBadge: {
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  sentimentText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  memoryDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  
  // Empty state
  emptyStateContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    alignItems: 'center',
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Loading and error states
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
});

export default RelationshipTree;
