import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';

interface ProfileXpBarProps {
  currentXp: number;
  xpInLevel: number;
  xpForLevel: number;
  level: number;
  theme: Theme;
}

const ProfileXpBar: React.FC<ProfileXpBarProps> = ({ 
  currentXp, 
  xpInLevel, 
  xpForLevel, 
  level, 
  theme 
}) => {
  const styles = createStyles(theme);
  const progress = xpForLevel > 0 ? xpInLevel / xpForLevel : (level >= 10 ? 1 : 0); // Handle division by zero and max level

  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animation, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false
    }).start();
  }, [progress]);

  return (
    <View style={styles.xpBarContainer}>
      <View style={styles.xpBarBackground}>
        <Animated.View
          style={[
            styles.xpBarForeground,
            { width: animation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
      </View>
      <Text style={styles.xpText}>
        {level >= 10 ? `Level ${level} (Max)` : `${xpForLevel-xpInLevel} XP to Level ${level + 1}`}
      </Text>
      <Text style={styles.totalXpText}>Total XP: {currentXp}</Text>
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  xpBarContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    width: '90%',
    marginBottom: theme.spacing.xs / 2,
  },
  xpBarForeground: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  xpText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  totalXpText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

export default ProfileXpBar;
