import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  SafeAreaView,
  PanResponder
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getGlobalTreeData } from '../services/api';
import {
  GlobalTreeData,
  GlobalRelationshipNode
} from '../types/GlobalTree';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import {
  TREE_THEMES,
  ThemeKey,
  generateInsights
} from '../services/treeVisualizationService';

// Import our custom components
import TreeVisualization from '../components/GlobalTree/TreeVisualization';
import TreeNavigationBar from '../components/GlobalTree/TreeNavigationBar';
import TimelineSlider from '../components/GlobalTree/TimelineSlider';
import FilterPanel from '../components/GlobalTree/FilterPanel';
import InsightCard from '../components/GlobalTree/InsightCard';

type GlobalTreeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GlobalTree'>;

const { width, height } = Dimensions.get('window');

const GlobalTreeScreen: React.FC = () => {
  const navigation = useNavigation<GlobalTreeScreenNavigationProp>();
  const { theme } = useTheme();
  const [treeData, setTreeData] = useState<GlobalTreeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tree visualization state
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('Oak');
  const [showThemeSelector, setShowThemeSelector] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<GlobalRelationshipNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  
  // Timeline state
  const [showTimelineView, setShowTimelineView] = useState<boolean>(false);
  const [timelineValue, setTimelineValue] = useState<number>(100); // 0-100 percentage
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);
  
  // Health mode state
  const [showHealthMode, setShowHealthMode] = useState<boolean>(false);
  
  // Insight state
  const [showInsightCard, setShowInsightCard] = useState<boolean>(false);
  const [currentInsight, setCurrentInsight] = useState<string>('');
  const [insights, setInsights] = useState<string[]>([]);
  const [currentInsightIndex, setCurrentInsightIndex] = useState<number>(0);
  
  // Pan gesture handler for tree panning
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store the current pan offset when the gesture starts
      },
      onPanResponderMove: (_, gestureState) => {
        // Update pan offset based on gesture movement
        setPanOffset({
          x: panOffset.x + gestureState.dx,
          y: panOffset.y + gestureState.dy
        });
      },
      onPanResponderRelease: () => {
        // Finalize the pan offset when the gesture ends
      }
    })
  ).current;
  
  // Initialize data and insights
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getGlobalTreeData();
        if (data) {
          setTreeData(data);
          
          // Initialize selected categories with all categories
          const allCategories = data.branches.map(branch => branch.category);
          setSelectedCategories(allCategories);
          
          // Generate insights
          const generatedInsights = generateInsights(data);
          setInsights(generatedInsights);
          
          // Set a random insight as the current one
          const randomIndex = Math.floor(Math.random() * generatedInsights.length);
          setCurrentInsightIndex(randomIndex);
          setCurrentInsight(generatedInsights[randomIndex]);
          
          // Show insight card after a delay
          setTimeout(() => {
            setShowInsightCard(true);
          }, 1500);
        } else {
          setError('Failed to load Global Tree data.');
        }
      } catch (err: any) {
        console.error('[GlobalTreeScreen] Error fetching data:', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Timeline animation effect
  useEffect(() => {
    let timelineInterval: NodeJS.Timeout | null = null;
    
    if (isTimelinePlaying && showTimelineView) {
      timelineInterval = setInterval(() => {
        setTimelineValue(prev => {
          const newValue = prev + 1;
          if (newValue > 100) {
            setIsTimelinePlaying(false);
            return 100;
          }
          return newValue;
        });
      }, 100);
    }
    
    return () => {
      if (timelineInterval) {
        clearInterval(timelineInterval);
      }
    };
  }, [isTimelinePlaying, showTimelineView]);
  
  // Handler functions
  const handleNodePress = (node: GlobalRelationshipNode) => {
    setSelectedNode(node === selectedNode ? null : node);
  };
  
  const handleShowInsight = () => {
    // Show a random insight
    const nextIndex = (currentInsightIndex + 1) % insights.length;
    setCurrentInsightIndex(nextIndex);
    setCurrentInsight(insights[nextIndex]);
    setShowInsightCard(true);
  };
  
  const handleNextInsight = () => {
    const nextIndex = (currentInsightIndex + 1) % insights.length;
    setCurrentInsightIndex(nextIndex);
    setCurrentInsight(insights[nextIndex]);
  };
  
  const handleToggleHealthMode = () => {
    setShowHealthMode(!showHealthMode);
  };
  
  const handleToggleTimelineView = () => {
    setShowTimelineView(!showTimelineView);
  };
  
  const handleTimelineValueChange = (value: number) => {
    setTimelineValue(value);
  };
  
  const handleTimelinePlayPress = () => {
    setIsTimelinePlaying(!isTimelinePlaying);
  };
  
  const handleFilterPress = () => {
    setShowFilterPanel(!showFilterPanel);
  };
  
  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(cat => cat !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };
  
  const handleSelectAllCategories = () => {
    if (treeData) {
      const allCategories = treeData.branches.map(branch => branch.category);
      setSelectedCategories(allCategories);
    }
  };
  
  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };
  
  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  // Render loading, error, and empty states
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.messageText, { color: theme.colors.text }]}>Loading Your Global Tree...</Text>
        <Text style={[styles.subMessageText, { color: theme.colors.text }]}>
          Preparing your relationship ecosystem visualization
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Error: {error}</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            setLoading(true);
            getGlobalTreeData().then(data => {
              setTreeData(data);
              setLoading(false);
            }).catch(err => {
              setError(err.message || 'Failed to reload');
              setLoading(false);
            });
          }}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!treeData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.messageText, { color: theme.colors.text }]}>No Global Tree data available.</Text>
        <Text style={[styles.subMessageText, { color: theme.colors.text }]}>
          Start building relationships to grow your tree.
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary, marginTop: 20 }]}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filter branches based on selected categories and search text
  const filteredBranches = treeData.branches.filter(branch => {
    // Filter by category
    if (!selectedCategories.includes(branch.category)) {
      return false;
    }
    
    // Filter by search text
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      // Check if branch category matches search
      if (branch.category.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Check if any relationship in the branch matches search
      return branch.relationships.some(node => 
        node.name.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Create a filtered tree data object
  const filteredTreeData = {
    ...treeData,
    branches: filteredBranches
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      {/* Navigation Bar */}
      <TreeNavigationBar
        onSearchChange={handleSearchChange}
        onShowInsight={handleShowInsight}
        onToggleHealthMode={handleToggleHealthMode}
        onToggleTimelineView={handleToggleTimelineView}
        onFilterPress={handleFilterPress}
        showHealthMode={showHealthMode}
        showTimelineView={showTimelineView}
        searchText={searchText}
      />
      
      {/* Main Tree Visualization */}
      <View style={styles.treeContainer} {...panResponder.panHandlers}>
        <TreeVisualization
          treeData={filteredTreeData}
          selectedTheme={selectedTheme}
          zoomLevel={zoomLevel}
          panOffset={panOffset}
          onNodePress={handleNodePress}
          showHealthMode={showHealthMode}
        />
      </View>
      
      {/* Theme Selector Dropdown */}
      {showThemeSelector && (
        <View style={[styles.themeSelector, { 
          backgroundColor: theme.colors.background, 
          borderColor: theme.colors.border, 
          borderWidth: 1,
          shadowColor: theme.isDark ? '#000' : '#888',
        }]}>
          {Object.entries(TREE_THEMES).map(([key, themeData]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.themeOption,
                selectedTheme === key && { backgroundColor: theme.colors.primary + '30' }
              ]}
              onPress={() => {
                setSelectedTheme(key as ThemeKey);
                setShowThemeSelector(false);
              }}
            >
              <View style={styles.themeOptionContent}>
                <View style={[styles.themeColorPreview, { backgroundColor: themeData.trunkColor }]} />
                <View style={styles.themeTextContainer}>
                  <Text style={[styles.themeOptionTitle, { color: theme.colors.text }]}>
                    {themeData.name}
                  </Text>
                  <Text style={[styles.themeOptionDescription, { color: theme.colors.text + '99' }]}>
                    {themeData.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Filter Panel */}
      {showFilterPanel && (
        <FilterPanel
          branches={treeData.branches}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          onClose={() => setShowFilterPanel(false)}
          onSelectAll={handleSelectAllCategories}
          onClearAll={handleClearAllCategories}
        />
      )}
      
      {/* Timeline Slider */}
      {showTimelineView && (
        <TimelineSlider
          onValueChange={handleTimelineValueChange}
          onPlayPress={handleTimelinePlayPress}
          isPlaying={isTimelinePlaying}
          minDate={treeData.generatedAt ? new Date(new Date(treeData.generatedAt).getTime() - 365 * 24 * 60 * 60 * 1000).toISOString() : '2023-01-01T00:00:00Z'}
          maxDate={treeData.generatedAt || new Date().toISOString()}
          currentValue={timelineValue}
        />
      )}
      
      {/* Insight Card */}
      <InsightCard
        insight={currentInsight}
        onClose={() => setShowInsightCard(false)}
        onNext={handleNextInsight}
        visible={showInsightCard}
      />
      
      {/* Root Strength Indicator */}
      <View style={styles.rootStrengthContainer}>
        <Text style={[styles.rootStrengthText, { color: theme.colors.text }]}>
          Root Strength: {treeData.rootStrength}%
        </Text>
        <View style={styles.rootStrengthBar}>
          <View 
            style={[
              styles.rootStrengthFill, 
              { 
                width: `${treeData.rootStrength}%`,
                backgroundColor: theme.colors.primary 
              }
            ]} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  treeContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    opacity: 0.8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  themeSelector: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: 8,
    padding: 8,
    zIndex: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  themeOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeColorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeOptionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  themeOptionDescription: {
    fontSize: 12,
  },
  rootStrengthContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  rootStrengthText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rootStrengthBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  rootStrengthFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default GlobalTreeScreen;
