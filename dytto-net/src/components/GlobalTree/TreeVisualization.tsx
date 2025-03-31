import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Path,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  Line
} from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import {
  GlobalTreeData,
  GlobalRelationshipNode,
  GlobalBranch
} from '../../types/GlobalTree';
import {
  TREE_THEMES,
  ThemeKey,
  generateCurvedPath,
  calculateBranchPosition,
  calculateNodePosition,
  getBrightness,
  generateLeafPath,
  generateBlossomPath
} from '../../services/treeVisualizationService';

interface TreeVisualizationProps {
  treeData: GlobalTreeData;
  selectedTheme: ThemeKey;
  zoomLevel: number;
  panOffset: { x: number; y: number };
  onNodePress: (node: GlobalRelationshipNode) => void;
  showHealthMode: boolean;
}

const { width, height } = Dimensions.get('window');
const SVG_WIDTH = width;
const SVG_HEIGHT = height * 0.7;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const TRUNK_RADIUS = 40;
const BRANCH_START_RADIUS = TRUNK_RADIUS + 15;
const MAX_BRANCH_LENGTH = Math.min(CENTER_X, CENTER_Y) * 0.65;

const TreeVisualization: React.FC<TreeVisualizationProps> = ({
  treeData,
  selectedTheme,
  zoomLevel,
  panOffset,
  onNodePress,
  showHealthMode
}) => {
  const { theme } = useTheme();
  const currentTheme = TREE_THEMES[selectedTheme];
  const totalBranches = treeData.branches.length;

  // Apply zoom and pan transformations
  const transformedCenterX = CENTER_X * zoomLevel + panOffset.x;
  const transformedCenterY = CENTER_Y * zoomLevel + panOffset.y;

  // Calculate viewBox based on zoom and pan
  const viewBoxWidth = SVG_WIDTH / zoomLevel;
  const viewBoxHeight = SVG_HEIGHT / zoomLevel;
  const viewBoxX = -panOffset.x / zoomLevel;
  const viewBoxY = -panOffset.y / zoomLevel;

  // Helper function to render leaves for a branch
  const renderLeaves = (branch: GlobalBranch, startX: number, startY: number, endX: number, endY: number, angle: number) => {
    const leaves = [];
    const leafCount = Math.floor(branch.relationshipCount * 1.5);
    const branchLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    
    for (let i = 0; i < leafCount; i++) {
      // Position leaves along the branch
      const t = 0.3 + (i / leafCount) * 0.7; // Start leaves after 30% of branch length
      const leafX = startX + (endX - startX) * t;
      const leafY = startY + (endY - startY) * t;
      
      // Alternate leaf sides
      const sideAngle = angle + (i % 2 === 0 ? Math.PI / 2 : -Math.PI / 2);
      const leafSize = 5 + Math.random() * 5;
      
      // Random rotation for natural look
      const rotation = sideAngle + (Math.random() * 0.5 - 0.25);
      
      // Select leaf color
      const leafColorIndex = Math.floor(Math.random() * currentTheme.leafColors.length);
      const leafColor = currentTheme.leafColors[leafColorIndex];
      
      // Generate leaf path
      const leafPath = generateLeafPath(leafX, leafY, leafSize, rotation);
      
      leaves.push(
        <Path
          key={`leaf-${branch.id}-${i}`}
          d={leafPath}
          fill={leafColor}
          opacity={0.8 + Math.random() * 0.2}
        />
      );
    }
    
    return leaves;
  };

  // Helper function to render blossoms for active quests
  const renderBlossoms = (branch: GlobalBranch) => {
    const blossoms = [];
    
    // Find nodes with active quests
    const nodesWithQuests = branch.relationships.filter(node => node.hasActiveQuest);
    
    for (let i = 0; i < nodesWithQuests.length; i++) {
      const node = nodesWithQuests[i];
      const nodeIndex = branch.relationships.indexOf(node);
      
      // Calculate node position
      const { startX, startY, endX, endY, angle } = calculateBranchPosition(
        treeData.branches.indexOf(branch),
        totalBranches,
        CENTER_X,
        CENTER_Y,
        BRANCH_START_RADIUS,
        MAX_BRANCH_LENGTH,
        (branch.totalLevelSum / 20) + (branch.relationshipCount / 5)
      );
      
      const { nodeX, nodeY } = calculateNodePosition(
        startX, startY, endX, endY, nodeIndex, branch.relationships.length, node.level, angle
      );
      
      // Position blossom near the node
      const blossomX = nodeX + Math.cos(angle + Math.PI / 4) * 15;
      const blossomY = nodeY + Math.sin(angle + Math.PI / 4) * 15;
      
      // Select blossom color
      const blossomColorIndex = Math.floor(Math.random() * currentTheme.blossomColors.length);
      const blossomColor = currentTheme.blossomColors[blossomColorIndex];
      
      // Generate blossom path
      const blossomPath = generateBlossomPath(blossomX, blossomY, 10, 5);
      
      blossoms.push(
        <Path
          key={`blossom-${node.id}`}
          d={blossomPath}
          fill={blossomColor}
          opacity={0.9}
        />
      );
    }
    
    return blossoms;
  };

  return (
    <Svg 
      width={SVG_WIDTH} 
      height={SVG_HEIGHT} 
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
    >
      <Defs>
        {/* Trunk Gradient */}
        <RadialGradient id="trunkGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor={currentTheme.trunkColor} stopOpacity="1" />
          <Stop offset="90%" stopColor={currentTheme.trunkColor} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={currentTheme.trunkColor} stopOpacity="0.6" />
        </RadialGradient>
        
        {/* Branch Gradients for each category */}
        {treeData.branches.map((branch) => (
          <LinearGradient 
            key={`gradient-${branch.id}`} 
            id={`branch-gradient-${branch.id}`} 
            x1="0%" 
            y1="0%" 
            x2="100%" 
            y2="0%"
          >
            <Stop offset="0%" stopColor={branch.color} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={branch.color} stopOpacity="0.7" />
          </LinearGradient>
        ))}
      </Defs>
      
      {/* Background Grid (optional) */}
      {false && (
        <G>
          {Array.from({ length: 10 }).map((_, i) => (
            <Line
              key={`grid-h-${i}`}
              x1={0}
              y1={i * SVG_HEIGHT / 10}
              x2={SVG_WIDTH}
              y2={i * SVG_HEIGHT / 10}
              stroke={theme.colors.border}
              strokeWidth="0.5"
              opacity={0.2}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <Line
              key={`grid-v-${i}`}
              x1={i * SVG_WIDTH / 10}
              y1={0}
              x2={i * SVG_WIDTH / 10}
              y2={SVG_HEIGHT}
              stroke={theme.colors.border}
              strokeWidth="0.5"
              opacity={0.2}
            />
          ))}
        </G>
      )}
      
      {/* Central Trunk */}
      <G>
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={TRUNK_RADIUS}
          fill="url(#trunkGradient)"
          stroke={currentTheme.trunkColor}
          strokeWidth="3"
        />
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={TRUNK_RADIUS - 5}
          fill="none"
          stroke={theme.colors.background}
          strokeWidth="1"
          opacity={0.3}
        />
        <SvgText
          x={CENTER_X}
          y={CENTER_Y}
          fill={theme.colors.text}
          fontSize="16"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          You
        </SvgText>
      </G>

      {/* Render Branches, Leaves, and Nodes */}
      {treeData.branches.map((branch, index) => {
        const { startX, startY, endX, endY, angle } = calculateBranchPosition(
          index, 
          totalBranches,
          CENTER_X,
          CENTER_Y,
          BRANCH_START_RADIUS,
          MAX_BRANCH_LENGTH,
          (branch.totalLevelSum / 20) + (branch.relationshipCount / 5)
        );
        const brightness = getBrightness(branch.averageRecencyDays);
        const branchColor = branch.color || theme.colors.primary; // Fallback color
        const strokeOpacity = brightness; // Use brightness for opacity
        
        // Adjust thickness based on count/level sum
        const strokeWidth = 2 + Math.min(8, branch.relationshipCount / 2 + branch.totalLevelSum / 10);
        
        // Generate curved path for branch
        const branchPath = generateCurvedPath(startX, startY, endX, endY, 0.2);

        // Apply health mode highlighting if enabled
        const isHealthy = branch.averageRecencyDays !== null && branch.averageRecencyDays < 30;
        const isAtRisk = branch.averageRecencyDays !== null && branch.averageRecencyDays > 60;
        const healthModeOpacity = showHealthMode ? 
          (isHealthy ? 1.0 : (isAtRisk ? 0.3 : 0.6)) : 
          strokeOpacity;

        return (
          <G key={branch.id}>
            {/* Main Branch Path */}
            <Path
              d={branchPath}
              stroke={branchColor}
              strokeWidth={strokeWidth}
              strokeOpacity={healthModeOpacity}
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Leaves along the branch */}
            {renderLeaves(branch, startX, startY, endX, endY, angle)}
            
            {/* Branch Category Label */}
            <SvgText
              x={endX + 10 * Math.cos(angle)}
              y={endY + 10 * Math.sin(angle)}
              fill={theme.colors.text}
              fontSize="14"
              fontWeight="bold"
              textAnchor={Math.cos(angle) >= 0 ? "start" : "end"}
              alignmentBaseline="middle"
              opacity={showHealthMode && !isHealthy ? 0.5 : 1}
            >
              {branch.category} ({branch.relationshipCount})
            </SvgText>

            {/* Relationship Nodes on Branch */}
            {branch.relationships.map((node, nodeIndex) => {
              const { nodeX, nodeY, nodeRadius } = calculateNodePosition(
                startX, startY, endX, endY, nodeIndex, branch.relationships.length, node.level, angle
              );
              const nodeBrightness = getBrightness(node.lastInteractionDays);
              const nodeOpacity = node.isFading ? 0.4 : nodeBrightness;
              
              // Apply health mode highlighting
              const nodeHealthOpacity = showHealthMode ? 
                (node.isFading ? 0.3 : (node.lastInteractionDays !== null && node.lastInteractionDays < 14 ? 1.0 : 0.6)) : 
                nodeOpacity;

              return (
                <G key={node.id}>
                  {/* Node circle */}
                  <Circle
                    cx={nodeX}
                    cy={nodeY}
                    r={nodeRadius}
                    fill={branchColor}
                    opacity={nodeHealthOpacity}
                    onPress={() => onNodePress(node)}
                  />
                  
                  {/* XP progress ring */}
                  <Circle
                    cx={nodeX}
                    cy={nodeY}
                    r={nodeRadius + 2}
                    fill="none"
                    stroke={branchColor}
                    strokeWidth="1"
                    opacity={0.5}
                    strokeDasharray={[2 * Math.PI * (nodeRadius + 2) * (node.level / 10), 2 * Math.PI * (nodeRadius + 2)]}
                  />
                  
                  {/* Active quest indicator */}
                  {node.hasActiveQuest && (
                    <Circle
                      cx={nodeX}
                      cy={nodeY}
                      r={nodeRadius + 4}
                      fill="none"
                      stroke="#FFD700"
                      strokeWidth="1.5"
                      opacity={0.8}
                    />
                  )}
                </G>
              );
            })}
            
            {/* Blossoms for active quests */}
            {renderBlossoms(branch)}
          </G>
        );
      })}
    </Svg>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TreeVisualization;
