import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface PremiumInputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
  required?: boolean;
}

const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'default',
  size = 'md',
  containerStyle,
  required = false,
  value,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderColorValue = useRef(new Animated.Value(0)).current;
  
  const styles = createStyles(theme);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: theme.animation.timing.base,
        useNativeDriver: false,
      }),
      Animated.timing(borderColorValue, {
        toValue: 1,
        duration: theme.animation.timing.base,
        useNativeDriver: false,
      }),
    ]).start();
    
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    
    if (!hasValue) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: theme.animation.timing.base,
        useNativeDriver: false,
      }).start();
    }
    
    Animated.timing(borderColorValue, {
      toValue: 0,
      duration: theme.animation.timing.base,
      useNativeDriver: false,
    }).start();
    
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(!!text);
    textInputProps.onChangeText?.(text);
  };

  const getLabelStyle = () => {
    if (!label) return {};
    
    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -28],
    });
    
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.85],
    });
    
    return {
      transform: [{ translateY }, { scale }],
    };
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    
    return borderColorValue.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colors.border, theme.colors.primary],
    });
  };

  const getInputContainerStyle = () => {
    const baseStyle = [
      styles.inputContainer,
      styles[`input${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
      styles[`inputSize${size.charAt(0).toUpperCase() + size.slice(1)}`],
      error && styles.inputError,
    ];

    return baseStyle;
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 18;
      case 'lg': return 24;
      default: return 20;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Top Label */}
      {label && !isFocused && !hasValue && (
        <View style={styles.topLabelContainer}>
          <Text style={styles.topLabel}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      {/* Input Container */}
      <Animated.View
        style={[
          getInputContainerStyle(),
          { borderColor: getBorderColor() },
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon as any}
              size={getIconSize()}
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        )}
        
        {/* Input with Floating Label */}
        <View style={styles.inputWrapper}>
          {label && (
            <Animated.Text
              style={[
                styles.floatingLabel,
                getLabelStyle(),
                {
                  color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
                },
                error && { color: theme.colors.error },
              ]}
            >
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Animated.Text>
          )}
          
          <TextInput
            {...textInputProps}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            style={[
              styles.input,
              styles[`inputText${size.charAt(0).toUpperCase() + size.slice(1)}`],
              { color: theme.colors.textPrimary },
              label && styles.inputWithLabel,
            ]}
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
        
        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon as any}
              size={getIconSize()}
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {/* Helper Text */}
      {(hint || error) && (
        <View style={styles.helperContainer}>
          <Text style={[styles.helperText, error && styles.errorText]}>
            {error || hint}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  
  topLabelContainer: {
    marginBottom: theme.spacing.xs,
  },
  
  topLabel: {
    fontSize: theme.typography.labelMedium.fontSize,
    fontWeight: theme.typography.labelMedium.fontWeight,
    color: theme.colors.textSecondary,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  
  // Variant styles
  inputDefault: {
    backgroundColor: theme.colors.surface,
  },
  inputFilled: {
    backgroundColor: theme.colors.surfaceHighlight,
    borderColor: 'transparent',
  },
  inputOutline: {
    backgroundColor: 'transparent',
  },
  
  // Size styles
  inputSizeSm: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.sm,
  },
  inputSizeMd: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
  },
  inputSizeLg: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.lg,
  },
  
  inputError: {
    borderColor: theme.colors.error,
  },
  
  leftIconContainer: {
    marginRight: theme.spacing.sm,
  },
  
  rightIconContainer: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  
  floatingLabel: {
    position: 'absolute',
    left: 0,
    fontSize: theme.typography.bodyMedium.fontSize,
    fontWeight: theme.typography.labelMedium.fontWeight,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    zIndex: 1,
  },
  
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.bodyMedium.fontSize,
    paddingVertical: theme.spacing.sm,
  },
  
  inputWithLabel: {
    paddingTop: theme.spacing.md,
  },
  
  inputTextSm: {
    fontSize: theme.typography.bodySmall.fontSize,
  },
  inputTextMd: {
    fontSize: theme.typography.bodyMedium.fontSize,
  },
  inputTextLg: {
    fontSize: theme.typography.bodyLarge.fontSize,
  },
  
  helperContainer: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  
  helperText: {
    fontSize: theme.typography.labelSmall.fontSize,
    color: theme.colors.textSecondary,
  },
  
  errorText: {
    color: theme.colors.error,
  },
  
  required: {
    color: theme.colors.error,
  },
});

export default PremiumInput;