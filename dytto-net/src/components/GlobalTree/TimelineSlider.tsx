import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface TimelineSliderProps {
  onValueChange: (value: number) => void;
  onPlayPress: () => void;
  isPlaying: boolean;
  minDate: string;
  maxDate: string;
  currentValue: number; // 0-100 percentage
}

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;
const THUMB_SIZE = 24;

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  onValueChange,
  onPlayPress,
  isPlaying,
  minDate,
  maxDate,
  currentValue
}) => {
  const { theme } = useTheme();
  const [sliderValue] = useState(new Animated.Value(currentValue));
  const [internalValue, setInternalValue] = useState(currentValue);
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };
  
  // Create pan responder for slider thumb
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Store the current value when the gesture starts
      sliderValue.extractOffset();
    },
    onPanResponderMove: (_, gestureState) => {
      // Calculate new value based on drag distance
      const newValue = Math.max(0, Math.min(100, internalValue + (gestureState.dx / SLIDER_WIDTH) * 100));
      setInternalValue(newValue);
      sliderValue.setValue(newValue);
      onValueChange(newValue);
    },
    onPanResponderRelease: () => {
      // Update the internal value when the gesture ends
      sliderValue.flattenOffset();
    }
  });
  
  // Calculate thumb position
  const thumbPosition = sliderValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, SLIDER_WIDTH]
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity 
        style={styles.playButton}
        onPress={onPlayPress}
      >
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={24} 
          color={theme.colors.primary} 
        />
      </TouchableOpacity>
      
      <View style={styles.sliderContainer}>
        <View style={[styles.sliderTrack, { backgroundColor: theme.colors.border }]}>
          <Animated.View 
            style={[
              styles.sliderFill, 
              { 
                backgroundColor: theme.colors.primary,
                width: thumbPosition 
              }
            ]} 
          />
        </View>
        
        <Animated.View 
          style={[
            styles.sliderThumb, 
            { 
              backgroundColor: theme.colors.primary,
              transform: [{ translateX: thumbPosition }] 
            }
          ]}
          {...panResponder.panHandlers}
        />
        
        <View style={styles.dateLabels}>
          <Text style={[styles.dateLabel, { color: theme.colors.text }]}>
            {formatDate(minDate)}
          </Text>
          <Text style={[styles.dateLabel, { color: theme.colors.text }]}>
            {formatDate(maxDate)}
          </Text>
        </View>
      </View>
      
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  playButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    marginVertical: 12,
  },
  sliderFill: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: -THUMB_SIZE / 2,
  },
  dateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 12,
  },
  spacer: {
    width: 40,
  }
});

export default TimelineSlider;
