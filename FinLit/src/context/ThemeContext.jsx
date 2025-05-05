/* eslint-disable import/no-extraneous-dependencies */
import { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Create a context for theme management using British English conventions
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialise the theme state from local storage, defaulting to 'light' if not set
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Update both local storage and the document's theme attribute when the theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  // Toggle the theme between 'light' and 'dark'
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Provide the current theme and toggle function to descendant components
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
