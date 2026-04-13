// Festival Themes Configuration
export const FESTIVAL_THEMES = {
  diwali: {
    id: 'diwali',
    name: 'Diwali',
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#FFD700',
      background: '#FFFBF0',
      text: '#1A1A1A'
    },
    icon: '🪔',
    description: 'Festival of Lights - Bright and vibrant colors'
  },
  holi: {
    id: 'holi',
    name: 'Holi',
    colors: {
      primary: '#FF1744',
      secondary: '#E91E63',
      accent: '#9C27B0',
      background: '#FFF5F9',
      text: '#1A1A1A'
    },
    icon: '🎨',
    description: 'Festival of Colors - Vibrant and playful'
  },
  eid: {
    id: 'eid',
    name: 'Eid',
    colors: {
      primary: '#2E7D32',
      secondary: '#4CAF50',
      accent: '#8BC34A',
      background: '#F0FDF4',
      text: '#1A1A1A'
    },
    icon: '🌙',
    description: 'Eid Celebration - Green and peaceful'
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    colors: {
      primary: '#C62828',
      secondary: '#2E7D32',
      accent: '#FFD700',
      background: '#FEF2F2',
      text: '#1A1A1A'
    },
    icon: '🎄',
    description: 'Christmas - Red, green and gold'
  },
  newYear: {
    id: 'newYear',
    name: 'New Year',
    colors: {
      primary: '#1976D2',
      secondary: '#42A5F5',
      accent: '#FFD700',
      background: '#F0F9FF',
      text: '#1A1A1A'
    },
    icon: '🎊',
    description: 'New Year - Blue and gold celebration'
  }
};

export const getThemeCSS = (themeId) => {
  const theme = FESTIVAL_THEMES[themeId];
  if (!theme) return '';

  return `
    :root {
      --theme-primary: ${theme.colors.primary};
      --theme-secondary: ${theme.colors.secondary};
      --theme-accent: ${theme.colors.accent};
      --theme-background: ${theme.colors.background};
      --theme-text: ${theme.colors.text};
      --theme-header-gradient: linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary});
    }
    .gradient-primary {
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
    }
    .header-gradient {
      background: var(--theme-header-gradient) !important;
    }
  `;
};
