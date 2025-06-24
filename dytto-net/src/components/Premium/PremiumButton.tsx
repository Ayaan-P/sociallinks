import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  Animated,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const styles = createStyles(theme);

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[`button${size.charAt(0).toUpperCase() + size.slice(1)}`],
      styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      fullWidth && styles.buttonFullWidth,
      (disabled || loading) && styles.buttonDisabled,
      style,
    ];

    return baseStyle;
  };

  const getTextStyle = () => {
    return [
      styles.text,
      styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}`],
      styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      (disabled || loading) && styles.textDisabled,
      textStyle,
    ];
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  const getIconColor = () => {
    if (disabled || loading) return theme.colors.textTertiary;
    
    switch (variant) {
      case 'primary':
      case 'premium':
        return theme.colors.textInverse;
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.textPrimary;
      default:
        return theme.colors.textInverse;
    }
  };

  const renderContent = () => {
    return (
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={getIconColor()}
            style={styles.loader}
          />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <Ionicons
            name={icon as any}
            size={getIconSize()}
            color={getIconColor()}
            style={styles.iconLeft}
          />
        )}
        
        <Text style={getTextStyle()}>{title}</Text>
        
        {!loading && icon && iconPosition === 'right' && (
          <Ionicons
            name={icon as any}
            size={getIconSize()}
            color={getIconColor()}
            style={styles.iconRight}
          />
        )}
      </View>
    );
  };

  const renderButton = () => {
    if (variant === 'premium') {
      return (
        <LinearGradient
          colors={theme.colors.premiumGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={getButtonStyle()}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    return (
      <View style={getButtonStyle()}>
        {renderContent()}
      </View>
    );
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {renderButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Size variations
  buttonSm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  buttonMd: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  buttonLg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 52,
  },
  
  // Variant styles
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    ...theme.elevation.sm,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonPremium: {
    ...theme.elevation.md,
    borderWidth: 0,
  },
  
  buttonFullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  
  // Text styles
  text: {
    fontFamily: theme.typography.fontFamilyMedium,
    textAlign: 'center',
  },
  textSm: {
    fontSize: theme.typography.labelMedium.fontSize,
    fontWeight: theme.typography.labelMedium.fontWeight,
  },
  textMd: {
    fontSize: theme.typography.labelLarge.fontSize,
    fontWeight: theme.typography.labelLarge.fontWeight,
  },
  textLg: {
    fontSize: theme.typography.titleSmall.fontSize,
    fontWeight: theme.typography.titleSmall.fontWeight,
  },
  
  textPrimary: {
    color: theme.colors.textInverse,
  },
  textSecondary: {
    color: theme.colors.textPrimary,
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textGhost: {
    color: theme.colors.primary,
  },
  textPremium: {
    color: theme.colors.textInverse,
  },
  textDisabled: {
    color: theme.colors.textTertiary,
  },
  
  // Content layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: theme.spacing.sm,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});

export default PremiumButton;