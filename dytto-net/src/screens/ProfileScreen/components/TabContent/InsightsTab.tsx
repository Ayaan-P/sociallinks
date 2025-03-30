import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../../../types/theme';

interface InsightData {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface InsightsTabProps {
  insights: InsightData[];
  theme: Theme;
}

const InsightsTab: React.FC<InsightsTabProps> = ({
  insights,
  theme
}) => {
  const styles = createStyles(theme);

  return (
    <View style={styles.insightsSection}>
      <Text style={styles.sectionTitle}>AI Relationship Insights</Text>
      <Text style={styles.description}>
        Patterns and suggestions based on your interaction history.
      </Text>

      {insights.map(insight => (
        <View key={insight.id} style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <Text style={styles.insightTitle}>{insight.title}</Text>
          </View>
          <Text style={styles.insightDescription}>{insight.description}</Text>
        </View>
      ))}
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  insightsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  insightCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.isDark ? 0.2 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  insightDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});

export default InsightsTab;
