"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// The three holy states of your hackathon project
export type Theme = "vanilla" | "brainrot" | "girlmath";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("vanilla");

  // This automatically applies a class to the <body> tag whenever the theme changes.
  // This is how we will trigger global CSS changes and animations later.
  useEffect(() => {
    document.body.className = `theme-${theme} transition-colors duration-500`;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook so you don't have to write useContext everywhere
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};