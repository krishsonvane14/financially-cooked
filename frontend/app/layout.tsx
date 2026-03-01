import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { DarkModeProvider } from "@/src/context/DarkModeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financially Cooked",
  description: "A multiplayer budgeting game built for chaos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased">
          <ThemeProvider>
            <DarkModeProvider>
              {children}
            </DarkModeProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}