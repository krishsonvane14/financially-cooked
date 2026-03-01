import type { Metadata } from "next";
import { ThemeProvider } from "@/src/context/ThemeContext";
import "./globals.css"; // Assuming your standard Tailwind imports are here

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
    <html lang="en">
      {/* We leave the body class empty here because the ThemeProvider manages it */}
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}