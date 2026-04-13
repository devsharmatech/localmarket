'use client';

import { useEffect, useState } from 'react';
import { getAllThemes, getThemeCSS } from '../lib/themeUtils';

export default function ThemeProvider({ children }) {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadAndApplyTheme = async () => {
      let themeId = localStorage.getItem('selectedFestivalTheme') || 'diwali';

      // Try to get active theme from database
      try {
        const res = await fetch('/api/themes?active=true', { cache: 'no-store' });
        if (res.ok) {
          const themes = await res.json();
          if (Array.isArray(themes) && themes.length > 0) {
            const activeTheme = themes.find(t => t.is_active);
            if (activeTheme) {
              themeId = activeTheme.id;
              // Sync localStorage with database
              localStorage.setItem('selectedFestivalTheme', themeId);
            }
          }
        }
      } catch (error) {
        if (!error.message?.includes('fetch failed') && !error.message?.includes('ENOTFOUND')) {
          console.error('Error loading active theme from database:', error);
        }
        // Fallback to localStorage
      }

      // Load all themes (default + custom from localStorage)
      const allThemes = getAllThemes();

      // Also try to load custom themes from localStorage
      try {
        const customThemes = JSON.parse(localStorage.getItem('customFestivalThemes') || '{}');
        Object.values(customThemes).forEach(customTheme => {
          allThemes[customTheme.id] = customTheme;
        });
      } catch (e) {
        // Ignore localStorage errors
      }

      const theme = allThemes[themeId] || allThemes['diwali'];

      if (theme) {
        // Apply theme CSS
        const styleId = 'festival-theme-style';
        let styleElement = document.getElementById(styleId);

        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        // Generate CSS from theme
        const css = `
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
        styleElement.textContent = css;

        // Apply theme colors to root
        const root = document.documentElement;
        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-accent', theme.colors.accent);
        root.style.setProperty('--theme-background', theme.colors.background);
        root.style.setProperty('--theme-text', theme.colors.text);
        root.style.setProperty('--theme-header-gradient', `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`);
      }

      setThemeLoaded(true);
    };

    loadAndApplyTheme();
  }, []);

  return <>{children}</>;
}
