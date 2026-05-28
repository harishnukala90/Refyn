import React from "react";
import { Sparkles, HelpCircle, ThumbsUp, AlertCircle, RefreshCw } from "lucide-react";

interface PromptOptimizerMetricProps {
  score: number;
  intent: string;
  missingSuggestions: string[];
  improvements: string[];
  onApplyMissing: (suggestion: string) => void;
  isLoading: boolean;
  isDark: boolean;
  isOfflineEngine?: boolean;
}

export function PromptOptimizerMetric({
  score,
  intent,
  missingSuggestions,
  improvements,
  onApplyMissing,
  isLoading,
  isDark,
  isOfflineEngine = false,
}: PromptOptimizerMetricProps) {
  // Determine color theme based on score value
  const getScoreColor = (val: number) => {
    if (isDark) {
      if (val >= 80) return { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-950/20", stroke: "#10b981" };
      if (val >= 50) return { text: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-950/20", stroke: "#f59e0b" };
      return { text: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-950/20", stroke: "#f43f5e" };
    } else {
      if (val >= 80) return { text: "text-emerald-600", border: "border-emerald-300", bg: "bg-emerald-50/70", stroke: "#059669" };
      if (val >= 50) return { text: "text-amber-600", border: "border-amber-300", bg: "bg-amber-50/70", stroke: "#d97706" };
      return { text: "text-rose-600", border: "border-rose-300", bg: "bg-rose-50/70", stroke: "#e11d48" };
    }
  };

  const scoreTheme = getScoreColor(score);
  const strokeDashoffset = 251.2 - (251.2 * score) / 100;

  return (
    <div className="space-y-6" id="prompt-optimizer-metric-container">
      {/* Top Banner - Score Gauges & Intent */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Score Indicator */}
        <div 
          id="score-card"
          className={`col-span-1 md:col-span-4 rounded-xl border p-5 flex flex-col items-center justify-center text-center backdrop-blur-md transition-all duration-300 ${scoreTheme.bg} ${scoreTheme.border}`}
        >
          <span className={`text-xs font-mono font-medium tracking-wider uppercase mb-3 ${isDark ? "text-sky-400/80" : "text-sky-700"}`}>
            Quality Score
          </span>
          <div className="relative w-24 h-24 flex items-center justify-center select-none">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                className={isDark ? "stroke-gray-900" : "stroke-sky-100/80"}
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={scoreTheme.stroke}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={isLoading ? 251.2 : strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`text-3xl font-bold font-sans tracking-tight ${scoreTheme.text}`}>
                {score}
              </span>
              <span className={`text-[10px] font-mono font-semibold ${isDark ? "text-gray-500" : "text-sky-600/60"}`}>/ 100</span>
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-xs font-semibold ${scoreTheme.text}`}>
              {score >= 80 ? "Perfect Prompt" : score >= 50 ? "Needs Specificity" : "Extremely Vague"}
            </span>
          </div>
        </div>

        {/* Detected Intent */}
        <div 
          id="intent-card"
          className={`col-span-1 md:col-span-8 rounded-xl border p-5 flex flex-col justify-between backdrop-blur-md
            ${isDark 
              ? "border-sky-950/40 bg-black/50" 
              : "border-sky-100 bg-white/75"
            }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
              <span className={`text-xs font-mono font-medium tracking-wider uppercase ${isDark ? "text-sky-400" : "text-sky-700"}`}>
                Detected Intent
              </span>
            </div>
            <p className={`text-base font-semibold leading-relaxed line-clamp-3 ${isDark ? "text-white" : "text-sky-950"}`}>
              {intent || "Enter a prompt on the left to analyze intent."}
            </p>
          </div>
          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs
            ${isDark ? "border-sky-950/30 text-gray-400" : "border-sky-100 text-sky-700"}`}>
            <span>Semantic understanding success</span>
            {isOfflineEngine ? (
              <span className="text-amber-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Autonomic Fallback Engine
              </span>
            ) : (
              <span className="text-emerald-500 font-mono flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLoading ? "" : "animate-pulse"}`}></span>
                Synchronized API
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Detail Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quality Improvements */}
        <div 
          id="improvements-container"
          className={`rounded-xl border p-5 flex flex-col backdrop-blur-md
            ${isDark 
              ? "border-sky-950/40 bg-black/45" 
              : "border-sky-100 bg-white/60"
            }`}
        >
          <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${isDark ? "border-sky-950/30" : "border-sky-100"}`}>
            <ThumbsUp className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
            <h3 className={`text-sm font-sans font-semibold ${isDark ? "text-white" : "text-sky-950"}`}>Improvements Applied</h3>
          </div>
          {improvements && improvements.length > 0 ? (
            <ul className="space-y-3 flex-1">
              {improvements.map((imp, idx) => (
                <li key={idx} className={`flex gap-3 text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-sky-900"}`} id={`imp-${idx}`}>
                  <span className={`mt-0.5 select-none font-extrabold ${isDark ? "text-sky-500" : "text-sky-600"}`}>✦</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={`py-8 text-center flex flex-col items-center justify-center ${isDark ? "text-gray-600" : "text-sky-500/50"}`}>
              <AlertCircle className="w-5 h-5 mb-2" />
              <p className="text-xs">No improvements applied yet.</p>
            </div>
          )}
        </div>

        {/* Missing Context Suggestions */}
        <div 
          id="suggestions-container"
          className={`rounded-xl border p-5 flex flex-col backdrop-blur-md
            ${isDark 
              ? "border-sky-950/40 bg-black/45" 
              : "border-sky-100 bg-white/60"
            }`}
        >
          <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${isDark ? "border-sky-950/30" : "border-sky-100"}`}>
            <HelpCircle className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
            <h3 className={`text-sm font-sans font-semibold ${isDark ? "text-white" : "text-sky-950"}`}>Missing Context Signals</h3>
          </div>
          {missingSuggestions && missingSuggestions.length > 0 ? (
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <ul className="space-y-2.5">
                {missingSuggestions.map((sug, idx) => (
                  <li key={idx} className="group relative" id={`sug-${idx}`}>
                    <button
                      onClick={() => onApplyMissing(sug)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs group-hover:text-white transition-all cursor-pointer flex items-start gap-2
                        ${isDark 
                          ? "border-sky-950/30 bg-black/60 hover:bg-sky-950/15 hover:border-sky-500/40 text-gray-300" 
                          : "border-sky-100 bg-white/80 hover:bg-sky-50 hover:border-sky-300 text-sky-800"
                        }`}
                    >
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-mono font-bold text-[10px] shrink-0 mt-0.5
                        ${isDark ? "bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20" : "bg-sky-100 text-sky-700"}`}>
                        +{idx + 1}
                      </span>
                      <span className={`flex-1 pr-4 leading-normal ${isDark ? "text-gray-300 group-hover:text-white" : "text-sky-900 group-hover:text-sky-950"}`}>{sug}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className={`text-[10px] font-mono mt-3 italic flex items-center gap-1 ${isDark ? "text-gray-500" : "text-sky-600"}`}>
                <AlertCircle className={`w-3 h-3 ${isDark ? "text-sky-400/60" : "text-sky-600"}`} /> Click a box to append its criteria automatically!
              </p>
            </div>
          ) : (
            <div className={`py-8 text-center flex flex-col items-center justify-center ${isDark ? "text-gray-500" : "text-sky-500/50"}`}>
              <AlertCircle className="w-5 h-5 mb-2" />
              <p className="text-xs">No missing suggestions discovered.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
