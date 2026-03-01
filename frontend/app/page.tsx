"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useTheme } from "@/src/context/ThemeContext";

export default function Home() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 text-black transition-colors duration-500">
      
      {/* Navbar / Auth Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="font-black text-xl tracking-tighter">FINANCIALLY COOKED.</h1>
        <div>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-5 py-2 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition">
                Log In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-3xl text-center space-y-8 mt-16">
        <h2 className="text-6xl font-black leading-tight">
          Budgeting, but it <br/> actually hurts.
        </h2>
        <p className="text-xl text-gray-600 font-medium">
          Connect with friends, track your ridiculous spending habits, and sabotage each other when you inevitably break your budget.
        </p>

        {/* Call to Action */}
        <div className="flex justify-center gap-4 pt-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-red-500 text-white font-black text-lg rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/30">
                GET COOKED
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/quiz">
              <button className="px-8 py-4 bg-red-500 text-white font-black text-lg rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/30">
                ENTER THE DASHBOARD
              </button>
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Theme Debugger (Keep this for testing your hackathon features) */}
      <div className="absolute bottom-8 flex gap-4 p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-200">
        <button onClick={() => setTheme('vanilla')} className="px-3 py-1 text-sm font-bold bg-gray-200 rounded">Vanilla</button>
        <button onClick={() => setTheme('brainrot')} className="px-3 py-1 text-sm font-bold bg-gray-900 text-white rounded">Brainrot</button>
        <button onClick={() => setTheme('girlmath')} className="px-3 py-1 text-sm font-bold bg-pink-400 text-white rounded">Girl Math</button>
      </div>

    </main>
  );
}