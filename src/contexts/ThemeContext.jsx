import { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { PLUGIN_BASE_URL } from '@/config';
import axios from 'axios';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { socket } = useSocket();
  const [theme, setTheme] = useState('skeuomorphic');

  useEffect(() => {
    // Initial fetch
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${PLUGIN_BASE_URL}/api/config`);
        if (response.data && response.data.theme) {
          setTheme(response.data.theme);
        }
      } catch (error) {
        console.error('Failed to fetch initial config:', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for updates
    const handleConfigUpdate = (data) => {
      if (data && data.theme) {
        setTheme(data.theme);
      }
    };

    socket.on('pushStylishPlayerConfig', handleConfigUpdate);

    return () => {
      socket.off('pushStylishPlayerConfig', handleConfigUpdate);
    };
  }, [socket]);

  useEffect(() => {
    // Dynamically inject/update CSS link
    const linkId = 'theme-stylesheet';
    let link = document.getElementById(linkId);

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    const revealRoot = () => {
      const root = document.getElementById('root');
      if (root) root.style.opacity = '1';
    };

    // If this theme is already loaded (cached), reveal immediately
    if (link.dataset.theme === theme && link.sheet) {
      revealRoot();
      return;
    }

    link.dataset.theme = theme;
    link.onload = revealRoot;
    // Reveal even if the stylesheet fails to load (don't leave a blank screen)
    link.onerror = revealRoot;

    // In dev, themes are in public/themes/
    // In prod, they are in /themes/ (relative to root)
    link.href = `/themes/${theme}.css`;

  }, [theme]);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
