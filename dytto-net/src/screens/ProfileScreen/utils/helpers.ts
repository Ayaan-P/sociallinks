import { TabType } from '../components/TabButton';

/**
 * Returns the appropriate icon name for a given tab
 */
export const getTabIcon = (tab: TabType): string => {
  switch (tab) {
    case 'Overview':
      return 'home-outline';
    case 'Thread':
      return 'chatbubbles-outline';
    case 'Tree':
      return 'git-branch-outline';
    case 'Insights':
      return 'bar-chart-outline';
    default:
      return '';
  }
};

/**
 * Returns a color based on the interaction tone
 */
export const getToneColor = (tone: string, theme: any): string => {
  const toneColors: Record<string, string> = {
    'Happy': theme.colors.success,
    'Deep': theme.colors.primary,
    'Draining': theme.colors.error,
    'Exciting': '#FF9500',
    'Vulnerable': '#9C27B0',
    'Casual': '#03A9F4',
    'Serious': '#607D8B',
    'Tense': '#FF5722',
    'Supportive': '#4CAF50'
  };

  return toneColors[tone] || theme.colors.secondary;
};
