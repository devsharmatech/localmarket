// Theme utility functions
import { FESTIVAL_THEMES } from '../constants/festivalThemes';

// Get all themes (default + custom)
export const getAllThemes = () => {
  const customThemes = getCustomThemes();
  return { ...FESTIVAL_THEMES, ...customThemes };
};

// Get custom themes from localStorage
export const getCustomThemes = () => {
  try {
    const customThemesJson = localStorage.getItem('customThemes');
    return customThemesJson ? JSON.parse(customThemesJson) : {};
  } catch (error) {
    console.error('Error loading custom themes:', error);
    return {};
  }
};

// Save custom theme
export const saveCustomTheme = (theme) => {
  try {
    const customThemes = getCustomThemes();
    customThemes[theme.id] = theme;
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
    return true;
  } catch (error) {
    console.error('Error saving custom theme:', error);
    return false;
  }
};

// Delete custom theme
export const deleteCustomTheme = (themeId) => {
  try {
    const customThemes = getCustomThemes();
    delete customThemes[themeId];
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
    return true;
  } catch (error) {
    console.error('Error deleting custom theme:', error);
    return false;
  }
};

// Get theme CSS (works with both default and custom themes)
export const getThemeCSS = (themeId) => {
  const allThemes = getAllThemes();
  const theme = allThemes[themeId];
  if (!theme) return '';

  return `
    :root {
      --theme-primary: ${theme.colors.primary};
      --theme-secondary: ${theme.colors.secondary};
      --theme-accent: ${theme.colors.accent};
      --theme-background: #ffffff;
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

// Check if theme is custom
export const isCustomTheme = (themeId) => {
  return !FESTIVAL_THEMES[themeId];
};
