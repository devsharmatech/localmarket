'use client';

import { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { FESTIVAL_THEMES, getThemeCSS } from '@/lib/festivalThemes';

interface ThemeContextType {
  theme: string;
  setTheme: (themeId: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState('default');

  useEffect(() => {
    // Load theme from database (global default first, then user-specific)
    const loadTheme = async () => {
      let themeToUse = localStorage.getItem('selectedFestivalTheme') || 'default';
      let activeThemeFromDB: any = null;

      // Step 1: Check for global default theme (set by admin)
      try {
        console.log('[Theme] Fetching global active theme...');
        const globalThemeRes = await fetch('/api/themes?active=true', { cache: 'no-store' });
        if (globalThemeRes.ok) {
          const globalThemes = await globalThemeRes.json();
          if (Array.isArray(globalThemes) && globalThemes.length > 0) {
            const activeTheme = globalThemes.find((t: any) => t.is_active);
            if (activeTheme && activeTheme.id) {
              themeToUse = activeTheme.id;
              activeThemeFromDB = activeTheme;
            }
          }
        }
      } catch (error) {
        console.error('Error loading global default theme:', error);
      }

      // Step 2: Check for user-specific theme preference if logged in
      const userId = localStorage.getItem('userId');
      const phone = localStorage.getItem('userPhone');
      const email = localStorage.getItem('userEmail');

      if (userId || phone || email) {
        try {
          const query = new URLSearchParams();
          if (userId) query.set('userId', userId);
          if (phone) query.set('phone', phone);
          if (email) query.set('email', email);

          const userThemeRes = await fetch(`/api/user/theme?${query.toString()}`);
          if (userThemeRes.ok) {
            const data = await userThemeRes.json();
            if (data.theme && !data.isGlobalDefault) {
              console.log('[Theme] Applying user-specific theme:', data.theme);
              themeToUse = data.theme;
              // If it's a user theme, we might not have the full theme object 
              // unless it's one of the predefined ones in FESTIVAL_THEMES
            }
          }
        } catch (error) {
          console.error('Error loading user-specific theme:', error);
        }
      }

      // Apply the theme
      applyTheme(themeToUse, activeThemeFromDB);
    };

    loadTheme();
  }, []);

  const applyTheme = (themeId: string, customTheme: any = null) => {
    const festivalTheme = customTheme || FESTIVAL_THEMES[themeId as keyof typeof FESTIVAL_THEMES];

    if (themeId === 'default' || !festivalTheme) {
      // Remove theme styles if not default
      const styleElement = document.getElementById('festival-theme-style');
      if (styleElement) {
        styleElement.remove();
      }
      setThemeState('default');
      return;
    }

    // Apply theme CSS
    const styleId = 'festival-theme-style';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = getThemeCSS(themeId, festivalTheme);

    // Apply theme colors to root
    const root = document.documentElement;
    const colors = festivalTheme.colors;

    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-background', '#FFFFFF');
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-header-gradient', `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`);

    // Standard variables for Tailwind/Global
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--background', '#FFFFFF');

    setThemeState(themeId);
    localStorage.setItem('selectedFestivalTheme', themeId);
  };

  const setTheme = async (themeId: string) => {
    applyTheme(themeId);

    // Save to database if user is logged in
    const userId = localStorage.getItem('userId');
    const userPhone = localStorage.getItem('userPhone');
    const userEmail = localStorage.getItem('userEmail');

    if (userId || userPhone || userEmail) {
      try {
        const body: any = { theme: themeId };
        if (userId) body.userId = userId;
        else if (userPhone) body.phone = userPhone;
        else if (userEmail) body.email = userEmail;

        await fetch('/api/user/theme', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error('Error saving theme to database:', error);
        // Continue anyway - localStorage is already saved
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
