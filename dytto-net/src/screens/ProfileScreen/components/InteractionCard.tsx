import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Theme } from '../../../types/theme';
import { Interaction } from '../../../types/Interaction';
import { getToneColor } from '../utils/helpers';

interface InteractionCardProps {
  interaction: Interaction;
  theme: Theme;
  expanded?: boolean;
  onPress?: () => void;
}

const InteractionCard: React.FC<InteractionCardProps> = ({ 
  interaction, 
  theme, 
  expanded = false, 
  onPress 
}) => {
  const styles = createStyles(theme);
  const interactionDate = new Date(interaction.created_at);
  const formattedDate = interactionDate.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const formattedTime = interactionDate.toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit'
  });

  // Animation for card expansion
  const [heightAnim] = useState(new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [expanded]);

  return (
    <TouchableOpacity
      style={[
        styles.interactionCard,
        expanded && styles.interactionCardExpanded
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.interactionCardHeader}>
        <Text style={styles.interactionDate}>{formattedDate} at {formattedTime}</Text>
        {interaction.tone_tag && (
          <View style={[
            styles.toneTag,
            { backgroundColor: getToneColor(interaction.tone_tag, theme) + '30' }
          ]}>
            <Text style={[
              styles.toneTagText,
              { color: getToneColor(interaction.tone_tag, theme) }
            ]}>{interaction.tone_tag}</Text>
          </View>
        )}
      </View>

      <Text style={styles.interactionLog} numberOfLines={expanded ? undefined : 3}>
        {interaction.interaction_log}
      </Text>

      {/* XP Badge */}
      {interaction.xp_gain !== undefined && (
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+{interaction.xp_gain} XP</Text>
        </View>
      )}

      {/* AI Insights - only shown when expanded */}
      <Animated.View style={{
        opacity: heightAnim,
        maxHeight: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 500]
        }),
        overflow: 'hidden'
      }}>
        {expanded && (
          <View style={styles.insightsContainer}>
            {interaction.sentiment_analysis && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Sentiment:</Text>
                <Text style={styles.insightValue}>{interaction.sentiment_analysis}</Text>
              </View>
            )}
            {interaction.ai_reasoning && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>AI Analysis:</Text>
                <Text style={styles.insightValue}>{interaction.ai_reasoning}</Text>
              </View>
            )}
            {interaction.evolution_suggestion && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Evolution Suggestion:</Text>
                <Text style={styles.insightValue}>Consider adding '{interaction.evolution_suggestion}'</Text>
              </View>
            )}
            {interaction.interaction_suggestion && (
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Next Step:</Text>
                <Text style={styles.insightValue}>{interaction.interaction_suggestion}</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Expand/collapse indicator */}
      <View style={styles.expandIndicator}>
        <Text style={styles.expandIndicatorText}>
          {expanded ? "Show less" : "Show more"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  interactionCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.3 : 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  interactionCardExpanded: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  interactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  interactionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  interactionLog: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  toneTag: {
    backgroundColor: theme.colors.secondary + '30',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  toneTagText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  xpBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  xpBadgeText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  insightsContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 6,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  insightItem: {
    marginBottom: theme.spacing.xs,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  expandIndicatorText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default InteractionCard;
