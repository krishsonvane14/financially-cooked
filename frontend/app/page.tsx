"use client";

import { useTheme } from "@/src/context/ThemeContext";

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">
        Current Theme: <span className="uppercase text-blue-500">{theme}</span>
      </h1>
      
      <div className="flex gap-4">
        <button 
          onClick={() => setTheme('vanilla')}
          className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 transition"
        >
          Vanilla UI
        </button>
        <button 
          onClick={() => setTheme('brainrot')}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-bold"
        >
          BRAINROT
        </button>
        <button 
          onClick={() => setTheme('girlmath')}
          className="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500 transition"
        >
          Girl Math
        </button>
      </div>
    </main>
  );
}