import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../types/theme';
import { createInteraction } from '../services/api';
import { CreateInteractionPayload } from '../types/Interaction'; // Import payload type

// Define navigation props type
type LogInteractionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LogInteraction'>;

// Define route props to receive personId and personName
type LogInteractionScreenRouteProp = RouteProp<RootStackParamList, 'LogInteraction'>;

interface Props {
  navigation: LogInteractionScreenNavigationProp;
  route: LogInteractionScreenRouteProp;
}

// Predefined tone tags for quick selection
const TONE_TAGS = [
  'Happy', 'Deep', 'Fun', 'Business', 'Casual', 'Serious', 'Vulnerable', 'Draining'
];

const LogInteractionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = themedStyles(theme);
  const { personId = '', personName = 'Unknown' } = route.params;

  const [interactionLog, setInteractionLog] = useState('');
  const [toneTag, setToneTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update navigation options with themed styles
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `Interaction`, // Simplified title
      headerStyle: { backgroundColor: theme.colors.background },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { color: theme.colors.text }
    });
  }, [navigation, theme]); // Removed personName dependency as it's in subtitle

  const handleSubmit = async () => {
    if (!interactionLog.trim()) {
      setError('Please enter an interaction log');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure relationship_id is a number
      const relationshipIdNumber = Number(personId);
      if (isNaN(relationshipIdNumber)) {
        throw new Error("Invalid Relationship ID provided.");
      }

      // Create the interaction using the specific payload type
      const interactionData: CreateInteractionPayload = {
        relationship_id: relationshipIdNumber, // Pass the converted number
        interaction_log: interactionLog.trim(),
        tone_tag: toneTag.trim() || undefined // Send undefined if empty, matches optional type
      };

      console.log('Submitting interaction:', interactionData);

      // Call the API service
      const result = await createInteraction(interactionData);

      // Get XP gain from result
      const xpGain = result.xp_gain || 1; // Default to 1 if not provided

      // Show success message
      Alert.alert(
        'Success',
        `Interaction logged successfully! +${xpGain} XP`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the previous screen (likely Profile)
              navigation.goBack();
            }
          }
        ]
      );
    } catch (err) {
      console.error('Error logging interaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to log interaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectToneTag = (tag: string) => {
    setToneTag(tag === toneTag ? '' : tag); // Toggle if already selected
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100} // Adjust as needed
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Log Interaction</Text>
          <Text style={styles.headerSubtitle}>with {personName}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>What did you talk about?</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={6}
            placeholder="Describe your interaction..."
            placeholderTextColor={theme.colors.textSecondary}
            value={interactionLog}
            onChangeText={setInteractionLog}
          />

          <Text style={styles.label}>Tone Tag (optional)</Text>
          {/* Removed separate input, rely on buttons */}
          {/* <TextInput
            style={styles.toneInput}
            placeholder="e.g., Happy, Deep, Business, etc."
            placeholderTextColor={theme.colors.textSecondary}
            value={toneTag}
            onChangeText={setToneTag}
          /> */}

          <View style={styles.toneTagsContainer}>
            {TONE_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.toneTagButton,
                  toneTag === tag && styles.toneTagButtonSelected
                ]}
                onPress={() => selectToneTag(tag)}
              >
                <Text
                  style={[
                    styles.toneTagButtonText,
                    toneTag === tag && styles.toneTagButtonTextSelected
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Logging interaction...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, !interactionLog.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!interactionLog.trim() || loading} // Disable while loading too
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        )}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Function to generate themed styles
const themedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl, // Ensure space at bottom
  },
  headerSection: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  formSection: {
    // Removed marginBottom as paddingBottom on scroll content handles it
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  toneInput: { // Kept style definition if needed later
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  toneTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm, // Add margin after label
  },
  toneTagButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 16,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toneTagButtonSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  toneTagButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  toneTagButtonTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
     backgroundColor: theme.colors.border, // Use a disabled color
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.sm, // Match button padding
    height: 48, // Match button height approx
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
});

export default LogInteractionScreen;
