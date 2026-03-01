"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/src/context/ThemeContext";
import { useAuth } from "@clerk/nextjs";

export default function QuizPage() {
  const { theme, setTheme } = useTheme();
  const { userId } = useAuth(); // Grabbing the Clerk User ID for Krish's DB
  const router = useRouter();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  
  // Matching Krish's exact API contract
  const [answers, setAnswers] = useState({ 
    takeout_frequency: 1, 
    impulse_buy_score: 1, 
    entertainment_spend: 10 
  });
  const [username, setUsername] = useState("");
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("You must be logged in to take the vibe check!");
      return;
    }

    setLoading(true);

    try {
      // 1. The Exact Payload Krish Requested
      const payload = {
        user_id: userId,
        username: username.trim() || undefined,
        takeout_frequency: answers.takeout_frequency,
        impulse_buy_score: answers.impulse_buy_score,
        entertainment_spend: answers.entertainment_spend,
        selected_theme: theme,
      };

      console.log("🚀 SENDING TO BACKEND:", payload);

      const res = await fetch(`${apiBaseUrl}/api/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📥 RECEIVED FROM BACKEND:", data);

      // 2. Catch the Silent Failures
      if (!res.ok) {
        console.error("❌ BACKEND REJECTED IT. Status:", res.status);
        alert(`API Error! Check the browser console. \nServer says: ${JSON.stringify(data.detail || data)}`);
        setLoading(false);
        return; // Stop here so we don't render the $0.00 screen
      }

      // 3. Success Path
      setResult(data);
      if (data.recommended_theme) {
        setTheme(data.recommended_theme);
      }

    } catch (error) {
      console.error("🔥 NETWORK CRASH:", error);
      alert("Failed to reach the server entirely. Is the Render URL correct?");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-black mb-6 text-center">Financial Vibe Check</h1>
        
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-bold">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. BudgetBandit"
                className="w-full rounded-md border border-gray-300 bg-white/80 px-3 py-2 text-black placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-bold">1. Takeout Frequency (Meals/Week)</label>
              <input type="range" min="0" max="14" value={answers.takeout_frequency} onChange={(e) => handleChange('takeout_frequency', parseInt(e.target.value))} className="w-full" />
              <div className="text-center font-mono">{answers.takeout_frequency}</div>
            </div>
            
            <div>
              <label className="block mb-2 font-bold">2. Impulse Buy Score (1-10)</label>
              <input type="range" min="1" max="10" value={answers.impulse_buy_score} onChange={(e) => handleChange('impulse_buy_score', parseInt(e.target.value))} className="w-full" />
              <div className="text-center font-mono">{answers.impulse_buy_score}/10</div>
            </div>

            <div>
              <label className="block mb-2 font-bold">3. Entertainment Spend ($/Month)</label>
              <input type="range" min="0" max="500" step="10" value={answers.entertainment_spend} onChange={(e) => handleChange('entertainment_spend', parseInt(e.target.value))} className="w-full" />
              <div className="text-center font-mono">${answers.entertainment_spend}</div>
            </div>

            <button type="submit" disabled={loading || !userId} className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition disabled:opacity-50">
              {loading ? "Analyzing Delusions..." : "Diagnose Me"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-red-500">Diagnosis: {result.persona}</h2>
            <div className="p-4 bg-gray-100 rounded-lg text-black">
              <p className="text-sm uppercase tracking-widest text-gray-500">Monthly Budget Allowed</p>
              <p className="text-4xl font-black">${result.monthly_limit?.toFixed(2) || "0.00"}</p>
            </div>
            <p className="italic text-sm">Theme forced to: {result.recommended_theme}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-red-500 text-white font-black text-lg rounded-lg hover:bg-red-600 transition shadow-lg shadow-red-500/30"
            >
              GO TO DASHBOARD →
            </button>
            <button onClick={() => window.location.reload()} className="mt-2 underline text-sm opacity-60 hover:opacity-100 transition-opacity">Retake Quiz</button>
          </div>
        )}
      </div>
    </main>
  );
}