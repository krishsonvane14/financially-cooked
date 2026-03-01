"use client";

import { useState } from "react";
import { useTheme } from "@/src/context/ThemeContext";

export default function QuizPage() {
  const { setTheme } = useTheme();
  const [answers, setAnswers] = useState({ q1: 1, q2: 1, q3: 1 });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calls your FastAPI backend
      const res = await fetch("http://localhost:8000/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answers),
      });

      const data = await res.json();
      setResult(data);

      // This is the magic: The backend decides their theme fate
      if (data.recommended_theme) {
        setTheme(data.recommended_theme);
      }
    } catch (error) {
      console.error("Failed to reach the Brain:", error);
      alert("Is the FastAPI backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (q: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [q]: val }));
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl border border-gray-200">
        <h1 className="text-3xl font-black mb-6 text-center">Financial Vibe Check</h1>
        
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-2 font-bold">1. How many times did you order food this week?</label>
              <input type="range" min="0" max="10" value={answers.q1} onChange={(e) => handleChange('q1', parseInt(e.target.value))} className="w-full" />
              <div className="text-center font-mono">{answers.q1}</div>
            </div>
            
            <div>
              <label className="block mb-2 font-bold">2. How much of your income goes to iced coffee?</label>
              <input type="range" min="0" max="100" value={answers.q2} onChange={(e) => handleChange('q2', parseInt(e.target.value))} className="w-full" />
              <div className="text-center font-mono">{answers.q2}%</div>
            </div>

            <div>
              <label className="block mb-2 font-bold">3. Number of unused subscriptions?</label>
              <input type="range" min="0" max="5" value={answers.q3} onChange={(e) => handleChange('q3', parseInt(e.target.value))} className="w-full" />
              <div className="text-center font-mono">{answers.q3}</div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition">
              {loading ? "Analyzing Delusions..." : "Diagnose Me"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-red-500">Diagnosis: {result.persona}</h2>
            <div className="p-4 bg-gray-100 rounded-lg text-black">
              <p className="text-sm uppercase tracking-widest text-gray-500">Monthly Budget Allowed</p>
              <p className="text-4xl font-black">${result.monthly_limit.toFixed(2)}</p>
            </div>
            <p className="italic text-sm">Theme forced to: {result.recommended_theme}</p>
            <button onClick={() => window.location.reload()} className="mt-4 underline text-sm">Retake Quiz</button>
          </div>
        )}
      </div>
    </main>
  );
}