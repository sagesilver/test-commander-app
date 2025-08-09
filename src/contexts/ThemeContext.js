import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { updateUser } from '../services/userService';

const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

const getInitialTheme = (userData) => {
  // 1) Firestore user preference
  const userPref = userData?.preferences?.theme;
  if (userPref === 'light' || userPref === 'dark') return userPref;

  // 2) localStorage
  const stored = typeof window !== 'undefined' ? localStorage.getItem('tc_theme') : null;
  if (stored === 'light' || stored === 'dark') return stored;

  // 3) system preference
  const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const { currentUserData } = useAuth();
  const [theme, setTheme] = useState(() => getInitialTheme(currentUserData));

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Persist to localStorage and Firestore when user changes
  useEffect(() => {
    localStorage.setItem('tc_theme', theme);
    // Persist to user profile if available
    const persist = async () => {
      try {
        if (currentUserData?.id) {
          await updateUser(currentUserData.id, {
            preferences: { ...(currentUserData.preferences || {}), theme },
          });
        }
      } catch (e) {
        // non-blocking
        console.warn('Failed to save theme preference', e);
      }
    };
    persist();
  }, [theme, currentUserData?.id]);

  // If userData arrives later, sync from it once
  useEffect(() => {
    const desired = getInitialTheme(currentUserData);
    setTheme(desired);
  }, [currentUserData?.preferences?.theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};


