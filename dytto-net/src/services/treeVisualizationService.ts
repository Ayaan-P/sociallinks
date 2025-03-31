import { GlobalTreeData, GlobalBranch, GlobalRelationshipNode } from '../types/GlobalTree';

// Tree theme options with sophisticated color palettes
export const TREE_THEMES = {
  Oak: {
    trunkColor: '#8B4513',
    trunkGradient: ['#A0522D', '#8B4513', '#654321'],
    leafColors: ['#228B22', '#32CD32', '#006400', '#90EE90', '#2E8B57'],
    blossomColors: ['#FFB6C1', '#FFC0CB', '#FF69B4', '#DB7093'],
    groundColor: '#5D4037',
    skyColor: '#E3F2FD',
    name: 'Oak',
    description: 'Strong, grounded, and reliable'
  },
  Sakura: {
    trunkColor: '#A0522D',
    trunkGradient: ['#C4A484', '#A0522D', '#8B4513'],
    leafColors: ['#FFB7C5', '#FFC0CB', '#FF69B4', '#DB7093', '#FFD1DC'],
    blossomColors: ['#FFFFFF', '#FFF0F5', '#FFBBFF', '#FFDDF4'],
    groundColor: '#D7CCC8',
    skyColor: '#FCEAE3',
    name: 'Sakura',
    description: 'Delicate, beautiful, and ephemeral'
  },
  Willow: {
    trunkColor: '#556B2F',
    trunkGradient: ['#6B8E23', '#556B2F', '#4B5320'],
    leafColors: ['#9ACD32', '#6B8E23', '#ADFF2F', '#7CFC00', '#8FBC8F'],
    blossomColors: ['#87CEFA', '#1E90FF', '#00BFFF', '#B0E0E6'],
    groundColor: '#33691E',
    skyColor: '#E8F5E9',
    name: 'Willow',
    description: 'Flowing, adaptable, and resilient'
  },
  Autumn: {
    trunkColor: '#8B4513',
    trunkGradient: ['#A0522D', '#8B4513', '#654321'],
    leafColors: ['#FF8C00', '#FF4500', '#FF6347', '#CD5C5C', '#F4A460'],
    blossomColors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'],
    groundColor: '#795548',
    skyColor: '#FFF8E1',
    name: 'Autumn',
    description: 'Vibrant, transformative, and reflective'
  }
};

export type ThemeKey = keyof typeof TREE_THEMES;

// Helper functions for tree visualization with more organic shapes
export const generateCurvedPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  curvature: number = 0.3,
  variation: number = 0.1
): string => {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  // Calculate control point offset based on distance and direction
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Add slight randomization for more natural look
  const randomOffset = (Math.random() * variation * 2 - variation) * distance;
  
  // Perpendicular offset for control point
  const perpX = -dy / distance * distance * curvature + randomOffset;
  const perpY = dx / distance * distance * curvature + randomOffset;
  
  // Control point coordinates
  const cpX = midX + perpX;
  const cpY = midY + perpY;
  
  return `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
};

// More detailed and realistic leaf shape
export const generateLeafPath = (
  x: number,
  y: number,
  size: number,
  rotation: number,
  variation: number = 0.2
): string => {
  // Create a more detailed leaf shape with serrated edges
  const baseSize = size * 0.8;
  const tipX = x + Math.cos(rotation) * baseSize;
  const tipY = y + Math.sin(rotation) * baseSize;
  
  // Randomize size slightly for natural variation
  const widthFactor = 0.3 * (1 + (Math.random() * variation * 2 - variation));
  
  // Create control points for the leaf shape
  const leftX = x + Math.cos(rotation + Math.PI/2) * (baseSize * widthFactor);
  const leftY = y + Math.sin(rotation + Math.PI/2) * (baseSize * widthFactor);
  
  const rightX = x + Math.cos(rotation - Math.PI/2) * (baseSize * widthFactor);
  const rightY = y + Math.sin(rotation - Math.PI/2) * (baseSize * widthFactor);
  
  // Create a more complex leaf shape with a midrib
  const midX1 = x + Math.cos(rotation) * (baseSize * 0.3);
  const midY1 = y + Math.sin(rotation) * (baseSize * 0.3);
  
  const midX2 = x + Math.cos(rotation) * (baseSize * 0.6);
  const midY2 = y + Math.sin(rotation) * (baseSize * 0.6);
  
  // Control points for the curves
  const leftCP1X = x + Math.cos(rotation + Math.PI/4) * (baseSize * 0.4);
  const leftCP1Y = y + Math.sin(rotation + Math.PI/4) * (baseSize * 0.4);
  
  const leftCP2X = midX1 + Math.cos(rotation + Math.PI/3) * (baseSize * 0.3);
  const leftCP2Y = midY1 + Math.sin(rotation + Math.PI/3) * (baseSize * 0.3);
  
  const leftCP3X = midX2 + Math.cos(rotation + Math.PI/4) * (baseSize * 0.25);
  const leftCP3Y = midY2 + Math.sin(rotation + Math.PI/4) * (baseSize * 0.25);
  
  const rightCP1X = x + Math.cos(rotation - Math.PI/4) * (baseSize * 0.4);
  const rightCP1Y = y + Math.sin(rotation - Math.PI/4) * (baseSize * 0.4);
  
  const rightCP2X = midX1 + Math.cos(rotation - Math.PI/3) * (baseSize * 0.3);
  const rightCP2Y = midY1 + Math.sin(rotation - Math.PI/3) * (baseSize * 0.3);
  
  const rightCP3X = midX2 + Math.cos(rotation - Math.PI/4) * (baseSize * 0.25);
  const rightCP3Y = midY2 + Math.sin(rotation - Math.PI/4) * (baseSize * 0.25);
  
  // Create the path
  return `
    M ${x} ${y}
    C ${leftCP1X} ${leftCP1Y} ${leftCP2X} ${leftCP2Y} ${midX1} ${midY1}
    C ${leftCP3X} ${leftCP3Y} ${tipX} ${tipY} ${tipX} ${tipY}
    C ${rightCP3X} ${rightCP3Y} ${rightCP2X} ${rightCP2Y} ${midX1} ${midY1}
    C ${rightCP1X} ${rightCP1Y} ${x} ${y} ${x} ${y}
  `;
};

// More detailed flower blossom
export const generateBlossomPath = (
  x: number,
  y: number,
  size: number,
  petals: number = 5,
  variation: number = 0.2
): string => {
  let path = '';
  const innerRadius = size * 0.2;
  const outerRadius = size;
  
  // Add slight randomization to petal size for natural look
  for (let i = 0; i < petals; i++) {
    const startAngle = (i / petals) * 2 * Math.PI;
    const endAngle = ((i + 1) / petals) * 2 * Math.PI;
    const midAngle = (startAngle + endAngle) / 2;
    
    // Randomize petal size slightly
    const petalSize = outerRadius * (1 + (Math.random() * variation * 2 - variation));
    
    const innerStartX = x + innerRadius * Math.cos(startAngle);
    const innerStartY = y + innerRadius * Math.sin(startAngle);
    
    const outerX = x + petalSize * Math.cos(midAngle);
    const outerY = y + petalSize * Math.sin(midAngle);
    
    const innerEndX = x + innerRadius * Math.cos(endAngle);
    const innerEndY = y + innerRadius * Math.sin(endAngle);
    
    // Control points for more natural petal shape
    const cp1X = x + (innerRadius + petalSize) * 0.3 * Math.cos(startAngle + 0.2);
    const cp1Y = y + (innerRadius + petalSize) * 0.3 * Math.sin(startAngle + 0.2);
    
    const cp2X = x + petalSize * 0.8 * Math.cos(midAngle - 0.2);
    const cp2Y = y + petalSize * 0.8 * Math.sin(midAngle - 0.2);
    
    const cp3X = x + petalSize * 0.8 * Math.cos(midAngle + 0.2);
    const cp3Y = y + petalSize * 0.8 * Math.sin(midAngle + 0.2);
    
    const cp4X = x + (innerRadius + petalSize) * 0.3 * Math.cos(endAngle - 0.2);
    const cp4Y = y + (innerRadius + petalSize) * 0.3 * Math.sin(endAngle - 0.2);
    
    path += `
      M ${innerStartX} ${innerStartY}
      C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${outerX} ${outerY}
      C ${cp3X} ${cp3Y} ${cp4X} ${cp4Y} ${innerEndX} ${innerEndY}
    `;
  }
  
  // Add center circle
  path += `M ${x + innerRadius} ${y} A ${innerRadius} ${innerRadius} 0 1 0 ${x - innerRadius} ${y} A ${innerRadius} ${innerRadius} 0 1 0 ${x + innerRadius} ${y}`;
  
  return path;
};

export const calculateBranchPosition = (
  index: number,
  totalBranches: number,
  centerX: number,
  centerY: number,
  branchStartRadius: number,
  maxBranchLength: number,
  strength: number = 1
) => {
  // Distribute branches evenly around the trunk, with some randomization for natural look
  const baseAngle = (index / totalBranches) * 2 * Math.PI;
  const randomOffset = (Math.random() * 0.2 - 0.1) * (Math.PI / totalBranches);
  const angle = baseAngle + randomOffset;
  
  // Scale branch length based on strength (level sum, relationship count)
  const branchLength = maxBranchLength * Math.min(1, 0.4 + (strength * 0.6));
  
  // Add slight curve to branch end positions for more organic look
  const endX = centerX + branchLength * Math.cos(angle);
  const endY = centerY + branchLength * Math.sin(angle);
  const startX = centerX + branchStartRadius * Math.cos(angle);
  const startY = centerY + branchStartRadius * Math.sin(angle);
  
  return { startX, startY, endX, endY, angle };
};

export const calculateNodePosition = (
  branchStartX: number,
  branchStartY: number,
  branchEndX: number,
  branchEndY: number,
  nodeIndex: number,
  totalNodes: number,
  nodeLevel: number,
  branchAngle: number
) => {
  // More organic distribution along the branch
  const baseFraction = (nodeIndex + 1) / (totalNodes + 1);
  // Add slight randomization for natural distribution
  const fraction = baseFraction + (Math.random() * 0.1 - 0.05);
  
  // Scale position by level (higher level = further along branch)
  const levelScale = Math.max(0.3, Math.min(1, nodeLevel / 10));
  
  // Calculate position along the curved path
  const t = fraction * levelScale;
  const cpX = (branchEndX + branchStartX) / 2 + Math.sin(branchAngle) * 50; // Control point
  const cpY = (branchEndY + branchStartY) / 2 - Math.cos(branchAngle) * 50;
  
  // Quadratic Bezier formula
  const nodeX = (1-t)*(1-t)*branchStartX + 2*(1-t)*t*cpX + t*t*branchEndX;
  const nodeY = (1-t)*(1-t)*branchStartY + 2*(1-t)*t*cpY + t*t*branchEndY;
  
  // Size based on level and slight randomization
  const baseRadius = 4 + nodeLevel * 0.8;
  const nodeRadius = baseRadius * (0.9 + Math.random() * 0.2);

  return { nodeX, nodeY, nodeRadius };
};

export const getBrightness = (averageRecencyDays: number | null): number => {
  if (averageRecencyDays === null || averageRecencyDays > 90) return 0.4; // Dimmer for old/never
  if (averageRecencyDays < 7) return 1.0; // Bright for recent
  return 1.0 - (averageRecencyDays / 90) * 0.6; // Fade gradually
};

// Generate random insights based on tree data
export const generateInsights = (data: GlobalTreeData): string[] => {
  if (!data) return [];
  
  const insights = [
    `Your most emotionally active category this month: ${data.branches[0]?.category || 'Friend'}`,
    `You've formed ${Math.floor(Math.random() * 5) + 1} new bonds this quarter`,
    `Your ${data.branches[1]?.category || 'Romantic'} connections are evolving well`,
    `Consider nurturing your ${data.branches[data.branches.length - 1]?.category || 'Work'} relationships`,
    `Your root strength has increased by ${Math.floor(Math.random() * 10) + 5}% this month`,
    `You're most rooted in ${data.identityTags[0] || 'emotional support'}`,
    `You've maintained ${Math.floor(Math.random() * 3) + 2} relationships weekly for ${Math.floor(Math.random() * 6) + 3} weeks`
  ];
  
  return insights;
};
