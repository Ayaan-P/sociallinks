import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

interface PremiumCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'premium' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  animated?: boolean;
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
  borderRadius = 'lg',
  disabled = false,
  animated = true,
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;

  const styles = createStyles(theme);

  const handlePressIn = () => {
    if (!animated || disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: theme.animation.timing.quick,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (!animated || disabled) return;
    
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: theme.animation.timing.quick,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getCardStyle = () => {
    const baseStyle = [
      styles.card,
      styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`],
      styles[`radius${borderRadius.charAt(0).toUpperCase() + borderRadius.slice(1)}`],
      disabled && styles.disabled,
      style,
    ];

    switch (variant) {
      case 'elevated':
        return [...baseStyle, styles.cardElevated];
      case 'premium':
        return [...baseStyle, styles.cardPremium];
      case 'glass':
        return [...baseStyle, styles.cardGlass];
      default:
        return [...baseStyle, styles.cardDefault];
    }
  };

  const renderCard = () => {
    if (variant === 'premium') {
      return (
        <LinearGradient
          colors={theme.colors.premiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={getCardStyle()}
        >
          {children}
        </LinearGradient>
      );
    }

    if (variant === 'glass') {
      return (
        <BlurView intensity={20} style={getCardStyle()}>
          {children}
        </BlurView>
      );
    }

    return <View style={getCardStyle()}>{children}</View>;
  };

  if (onPress) {
    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleValue }], opacity: opacityValue },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={1}
        >
          {renderCard()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleValue }], opacity: opacityValue },
      ]}
    >
      {renderCard()}
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardDefault: {
    backgroundColor: theme.colors.card,
    ...theme.elevation.sm,
  },
  cardElevated: {
    backgroundColor: theme.colors.surfaceElevated,
    ...theme.elevation.md,
  },
  cardPremium: {
    borderWidth: 0,
    ...theme.elevation.lg,
  },
  cardGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...theme.elevation.md,
  },
  disabled: {
    opacity: 0.6,
  },
  // Padding variations
  paddingNone: {
    padding: 0,
  },
  paddingSm: {
    padding: theme.spacing.sm,
  },
  paddingMd: {
    padding: theme.spacing.md,
  },
  paddingLg: {
    padding: theme.spacing.lg,
  },
  // Border radius variations
  radiusSm: {
    borderRadius: theme.borderRadius.sm,
  },
  radiusMd: {
    borderRadius: theme.borderRadius.md,
  },
  radiusLg: {
    borderRadius: theme.borderRadius.lg,
  },
  radiusXl: {
    borderRadius: theme.borderRadius.xl,
  },
});

export default PremiumCard;