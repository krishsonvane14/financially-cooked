import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/src/context/ThemeContext";
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
      <html lang="en">
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}