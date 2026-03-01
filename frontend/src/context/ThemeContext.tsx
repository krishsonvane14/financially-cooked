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

  // Apply the raw theme name as a class on <body> so CSS variables kick in.
  // Preserves any other classes (e.g. dark mode, antialiased).
  useEffect(() => {
    const body = document.body;
    body.classList.remove("vanilla", "brainrot", "girlmath");
    body.classList.add(theme);
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