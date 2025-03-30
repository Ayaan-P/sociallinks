import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Divider, ProgressBar } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { fetchRelationshipInsights, InsightData } from '../../../../services/api';
import { useTheme } from '../../../../context/ThemeContext';
import { Theme } from '../../../../types/theme';

interface InsightsTabProps {
  relationshipId: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  card: {
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  insightContainer: {
    marginTop: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emotionalSummaryContainer: {
    padding: 4,
  },
  emotionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emotionalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  emotionalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 16,
  },
  keywordBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  keywordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  depthRatioContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  depthRatioItem: {
    marginBottom: 12,
  },
  depthRatioValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  depthRatioLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  depthRatioBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  depthRatioBar: {
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  forecastsIntro: {
    fontSize: 14,
    marginBottom: 16,
  },
  forecastItem: {
    marginBottom: 16,
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastPath: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forecastReasoning: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionItem: {
    marginBottom: 16,
  },
  suggestionHeader: {
    marginBottom: 8,
  },
  suggestionTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  suggestionTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionContent: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  generatedAtContainer: {
    padding: 16,
    alignItems: 'center',
  },
  generatedAtText: {
    fontSize: 12,
  },
  timeoutText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    paddingHorizontal: 20,
  },
});

const InsightsTab: React.FC<InsightsTabProps> = ({ relationshipId }) => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<{
    trends: boolean;
    emotional: boolean;
    forecasts: boolean;
    suggestions: boolean;
  }>({
    trends: true,
    emotional: false,
    forecasts: false,
    suggestions: false,
  });
  const { theme } = useTheme();

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const data = await fetchRelationshipInsights(relationshipId);
        setInsights(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching insights:', err);
        setError('Failed to load insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [relationshipId]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Analyzing relationship data...
        </Text>
      </View>
    );
  }

  if (error) {
    // Check if it's a timeout error or no insights error
    const isTimeoutError = error.toString().includes('taking longer than expected') || 
                          error.toString().includes('timed out') ||
                          error.toString().includes('timeout');
    
    const isNoInsightsError = error.toString().includes('Failed to generate insights') ||
                             error.toString().includes('No insights available');
    
    if (isNoInsightsError) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={48} color={theme.colors.primary} />
          <Text style={[styles.noDataText, { color: theme.colors.text, marginTop: 16 }]}>
            No insights available yet. Log more interactions to generate insights.
          </Text>
          <Text style={[styles.timeoutText, { color: theme.colors.text }]}>
            Insights are automatically generated after logging interactions or completing quests.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.errorContainer}>
        <Ionicons 
          name={isTimeoutError ? "time-outline" : "alert-circle-outline"} 
          size={48} 
          color={theme.colors.error} 
        />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        
        {isTimeoutError && (
          <Text style={[styles.timeoutText, { color: theme.colors.text }]}>
            AI insights require significant processing time. The server might be busy processing other requests.
          </Text>
        )}
        
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            setLoading(true);
            fetchRelationshipInsights(relationshipId)
              .then((data) => {
                setInsights(data);
                setError(null);
              })
              .catch((err) => {
                console.error('Error retrying insights fetch:', err);
                setError(err instanceof Error ? err.message : 'Failed to load insights. Please try again later.');
              })
              .finally(() => setLoading(false));
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.noDataContainer}>
        <Ionicons name="analytics-outline" size={48} color={theme.colors.primary} />
        <Text style={[styles.noDataText, { color: theme.colors.text, marginTop: 16 }]}>
          No insights available yet. Log more interactions to generate insights.
        </Text>
        <Text style={[styles.timeoutText, { color: theme.colors.text }]}>
          Insights are automatically generated after logging interactions or completing quests.
        </Text>
      </View>
    );
  }

  // Render the insights data
  return (
    <ScrollView style={styles.container}>
      {/* Interaction Trends Section */}
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}
        onPress={() => toggleSection('trends')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
             Interaction Trends
          </Text>
        </View>
        <Ionicons
          name={expandedSections.trends ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      {expandedSections.trends && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {insights.interaction_trends.total_interactions}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Total Interactions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {insights.interaction_trends.weekly_frequency}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Weekly</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {insights.interaction_trends.monthly_frequency}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Monthly</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {insights.interaction_trends.longest_streak}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Longest Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {insights.interaction_trends.longest_gap}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Longest Gap</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {insights.interaction_trends.average_xp}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text }]}>Avg XP</Text>
              </View>
            </View>

            <View style={styles.insightContainer}>
              <Text style={[styles.insightText, { color: theme.colors.text }]}>
                {insights.interaction_trends.trend_insight}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Emotional Summary Section */}
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}
        onPress={() => toggleSection('emotional')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialCommunityIcons name="emoticon-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
             Emotional Summary
          </Text>
        </View>
        <Ionicons
          name={expandedSections.emotional ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      {expandedSections.emotional && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.emotionalSummaryContainer}>
              <View style={styles.emotionalHeader}>
                <Text style={[styles.emotionalLabel, { color: theme.colors.text }]}>Common Tone:</Text>
                <Text style={[styles.emotionalValue, { color: theme.colors.primary }]}>
                  {insights.emotional_summary.common_tone}
                </Text>
              </View>

              {insights.emotional_summary.tone_shift && (
                <View style={styles.emotionalHeader}>
                  <Text style={[styles.emotionalLabel, { color: theme.colors.text }]}>Tone Shift:</Text>
                  <Text style={[styles.emotionalValue, { color: theme.colors.primary }]}>
                    {insights.emotional_summary.tone_shift}
                  </Text>
                </View>
              )}

              <Divider style={styles.divider} />

              <Text style={[styles.emotionalLabel, { color: theme.colors.text }]}>Emotional Keywords:</Text>
              <View style={styles.keywordsContainer}>
                {insights.emotional_summary.emotional_keywords.map((keyword, index) => (
                  <View
                    key={index}
                    style={[styles.keywordBadge, { backgroundColor: theme.colors.primary + '20' }]}
                  >
                    <Text style={[styles.keywordText, { color: theme.colors.primary }]}>{keyword}</Text>
                  </View>
                ))}
              </View>

              <Divider style={styles.divider} />

              <Text style={[styles.emotionalLabel, { color: theme.colors.text }]}>Depth Ratio:</Text>
              <View style={styles.depthRatioContainer}>
                <View style={styles.depthRatioItem}>
                  <Text style={[styles.depthRatioValue, { color: theme.colors.primary }]}>
                    {insights.emotional_summary.depth_ratio.high}%
                  </Text>
                  <Text style={[styles.depthRatioLabel, { color: theme.colors.text }]}>High</Text>
                  <View style={styles.depthRatioBarContainer}>
                    <ProgressBar
                      progress={insights.emotional_summary.depth_ratio.high / 100}
                      color={theme.colors.primary}
                      style={styles.depthRatioBar}
                    />
                  </View>
                </View>
                <View style={styles.depthRatioItem}>
                  <Text style={[styles.depthRatioValue, { color: theme.colors.primary }]}>
                    {insights.emotional_summary.depth_ratio.medium}%
                  </Text>
                  <Text style={[styles.depthRatioLabel, { color: theme.colors.text }]}>Medium</Text>
                  <View style={styles.depthRatioBarContainer}>
                    <ProgressBar
                      progress={insights.emotional_summary.depth_ratio.medium / 100}
                      color={theme.colors.primary}
                      style={styles.depthRatioBar}
                    />
                  </View>
                </View>
                <View style={styles.depthRatioItem}>
                  <Text style={[styles.depthRatioValue, { color: theme.colors.primary }]}>
                    {insights.emotional_summary.depth_ratio.low}%
                  </Text>
                  <Text style={[styles.depthRatioLabel, { color: theme.colors.text }]}>Low</Text>
                  <View style={styles.depthRatioBarContainer}>
                    <ProgressBar
                      progress={insights.emotional_summary.depth_ratio.low / 100}
                      color={theme.colors.primary}
                      style={styles.depthRatioBar}
                    />
                  </View>
                </View>
              </View>

              <Divider style={styles.divider} />

              <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                {insights.emotional_summary.summary}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Relationship Forecasts Section */}
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}
        onPress={() => toggleSection('forecasts')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialCommunityIcons name="crystal-ball" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
             Relationship Forecasts
          </Text>
        </View>
        <Ionicons
          name={expandedSections.forecasts ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      {expandedSections.forecasts && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {insights.relationship_forecasts.not_enough_data ? (
              <Text style={[styles.noDataText, { color: theme.colors.text }]}>
                Not enough data to generate forecasts. Log more interactions to see predictions.
              </Text>
            ) : (
              <View>
                <Text style={[styles.forecastsIntro, { color: theme.colors.text }]}>
                  Based on your interaction patterns, here are potential paths for this relationship:
                </Text>
                {insights.relationship_forecasts.forecasts.map((forecast, index) => (
                  <View key={index} style={styles.forecastItem}>
                    <View style={styles.forecastHeader}>
                      <Text style={[styles.forecastPath, { color: theme.colors.primary }]}>
                        {forecast.path}
                      </Text>
                      <View
                        style={[
                          styles.confidenceBadge,
                          {
                            backgroundColor:
                              forecast.confidence > 75
                                ? theme.colors.success + '20'
                                : forecast.confidence > 50
                                ? theme.colors.primary + '20'
                                : theme.colors.warning + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.confidenceText,
                            {
                              color:
                                forecast.confidence > 75
                                  ? theme.colors.success
                                  : forecast.confidence > 50
                                  ? theme.colors.primary
                                  : theme.colors.warning,
                            },
                          ]}
                        >
                          {forecast.confidence}% confidence
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.forecastReasoning, { color: theme.colors.text }]}>
                      {forecast.reasoning}
                    </Text>
                    {index < insights.relationship_forecasts.forecasts.length - 1 && (
                      <Divider style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Smart Suggestions Section */}
      <TouchableOpacity
        style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}
        onPress={() => toggleSection('suggestions')}
      >
        <View style={styles.sectionHeaderContent}>
          <MaterialCommunityIcons name="lightbulb-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>
             Smart Suggestions
          </Text>
        </View>
        <Ionicons
          name={expandedSections.suggestions ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={theme.colors.text}
        />
      </TouchableOpacity>

      {expandedSections.suggestions && (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {insights.smart_suggestions.suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <View style={styles.suggestionHeader}>
                  <View
                    style={[
                      styles.suggestionTypeBadge,
                      {
                        backgroundColor:
                          suggestion.type === 'Reflection Prompt'
                            ? theme.colors.primary + '20'
                            : suggestion.type === 'Memory Reminder'
                            ? theme.colors.success + '20'
                            : suggestion.type === 'Reconnection Nudge'
                            ? theme.colors.warning + '20'
                            : theme.colors.secondary + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.suggestionTypeText,
                        {
                          color:
                            suggestion.type === 'Reflection Prompt'
                              ? theme.colors.primary
                              : suggestion.type === 'Memory Reminder'
                              ? theme.colors.success
                              : suggestion.type === 'Reconnection Nudge'
                              ? theme.colors.warning
                              : theme.colors.secondary,
                        },
                      ]}
                    >
                      {suggestion.type}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.suggestionContent, { color: theme.colors.text }]}>
                  {suggestion.content}
                </Text>
                {index < insights.smart_suggestions.suggestions.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={styles.generatedAtContainer}>
        <Text style={[styles.generatedAtText, { color: theme.colors.text + '80' }]}>
          Insights generated: {new Date(insights.generated_at).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
};

export default InsightsTab;
