import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface InsightCardProps {
  insight: string;
  onClose: () => void;
  onNext: () => void;
  visible: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  onClose,
  onNext,
  visible
}) => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    if (visible) {
      // Animate card in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate card out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="bulb" size={20} color={theme.colors.primary} style={styles.icon} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Relationship Insight</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.insightText, { color: theme.colors.text }]}>
        {insight}
      </Text>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={onNext}
        >
          <Text style={styles.nextButtonText}>Next Insight</Text>
          <Ionicons name="arrow-forward" size={16} color="white" style={styles.nextIcon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  nextIcon: {
    marginLeft: 4,
  }
});

export default InsightCard;
