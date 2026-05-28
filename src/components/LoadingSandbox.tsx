import React, { useState, useEffect } from "react";
import { Sparkles, Terminal, Cpu, CheckSquare } from "lucide-react";

interface LoadingSandboxProps {
  isDark: boolean;
}

export function LoadingSandbox({ isDark }: LoadingSandboxProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  const steps = [
    { label: "Linguistic Parser", desc: "Deconstructing raw user constraints", color: "text-sky-400" },
    { label: "Persona Synthesis", desc: "Formulating elite AI authority roles", color: "text-purple-400" },
    { label: "Direct Constraint Injection", desc: "Injecting strict format instructions", color: "text-emerald-400" },
    { label: "Result Finalization", desc: "Compiling optimized target prompt payload", color: "text-amber-400" },
  ];

  const simulationLogs = [
    "INIT >> Connecting to Refyn semantic compiler...",
    "PARSE >> Tokenizing raw input string...",
    "METRICS >> Evaluating base clarity metrics...",
    "Intent detected: Complex automated generation task",
    "OPTIMIZATION >> Splicing target model criteria...",
    "Establishing system roles & target perspective guidelines...",
    "Directing response structuring format preferences...",
    "Removing redundant pre-amble parameters...",
    "Appending negative visual descriptors...",
    "Calculating original prompt quality score metrics...",
    "Preparing production-ready markdown snippet...",
    "Syncing results securely via server-side proxies...",
  ];

  // Progress bar ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98; // Hold near 100 until finished
        return prev + Math.floor(Math.random() * 8) + 2;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  // Step indicator switcher
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(stepTimer);
  }, [steps.length]);

  // Terminal line printer simulation
  useEffect(() => {
    let lineIdx = 0;
    const logInterval = setInterval(() => {
      if (lineIdx < simulationLogs.length) {
        setTerminalLines((prev) => [...prev, simulationLogs[lineIdx]].slice(-5));
        lineIdx++;
      } else {
        // Repeat random process logs when done
        const randomLogs = [
          `LINT >> Checking typescript token syntax...`,
          `ANALYSIS >> Intent variance minimized to <0.04`,
          `COMPILE >> Formulated detailed ${Math.random() > 0.5 ? "coding" : "creative"} instructions`,
          `STATE >> Readying data payload transfer`,
        ];
        const randomLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
        setTerminalLines((prev) => [...prev, randomLog].slice(-5));
      }
    }, 500);

    return () => clearInterval(logInterval);
  }, []);

  return (
    <div 
      className={`rounded-2xl border p-6 space-y-6 backdrop-blur-md transition-all duration-300
        ${isDark 
          ? "bg-black/45 border-sky-950/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
          : "bg-white/75 border-sky-100 shadow-[0_8px_32px_rgba(14,165,233,0.05)]"
        }`}
      id="loading-sandbox-card"
    >
      {/* Header Indicator */}
      <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-sky-950/30" : "border-sky-100"}`}>
        <div className="flex items-center gap-3">
          <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center border
            ${isDark ? "bg-sky-500/10 border-sky-500/20" : "bg-sky-50 border-sky-200"}`}>
            <Cpu className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"} animate-spin`} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-500 rounded-full"></span>
          </div>
          <div>
            <span className={`text-xs font-mono font-bold tracking-wider uppercase ${isDark ? "text-gray-400" : "text-sky-800"}`}>
              Semantic Compiler Active
            </span>
            <p className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${isDark ? "text-sky-400" : "text-sky-600"}`}>
              Synthesizing...
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xl font-bold font-mono tracking-tight ${isDark ? "text-white" : "text-sky-950"}`}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-2">
        <div className={`w-full rounded-full h-2.5 overflow-hidden border relative
          ${isDark ? "bg-black border-sky-950/50" : "bg-sky-50 border-sky-100"}`}>
          <div 
            className="bg-sky-550 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: '#0ea5e9' }}
          />
        </div>
        <div className={`flex justify-between text-[10px] font-mono ${isDark ? "text-gray-500" : "text-sky-700/60"}`}>
          <span>0% raw input</span>
          <span>100% production prompt</span>
        </div>
      </div>

      {/* Compiler pipeline steps */}
      <div className="space-y-3">
        <span className={`text-[10px] font-mono tracking-wider uppercase font-semibold ${isDark ? "text-sky-400/80" : "text-sky-700"}`}>
          Active Directives Pipeline
        </span>
        <div className="grid grid-cols-1 gap-2.5">
          {steps.map((s, idx) => {
            const isCompleted = step > idx;
            const isActive = step === idx;
            return (
              <div 
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-350
                  ${isActive 
                    ? isDark 
                      ? "bg-sky-950/15 border-sky-500/40 shadow-sm" 
                      : "bg-sky-50 border-sky-300 shadow-sm"
                    : isCompleted 
                      ? isDark 
                        ? "bg-black/20 border-sky-950/20 opacity-60" 
                        : "bg-sky-100/20 border-sky-100 opacity-60"
                      : "bg-transparent border-transparent opacity-30"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono border font-bold
                    ${isCompleted 
                      ? isDark 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : isActive 
                        ? isDark 
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/40" 
                          : "bg-sky-100 text-sky-700 border-sky-400"
                        : isDark 
                          ? "bg-black text-gray-700 border-sky-950/40" 
                          : "bg-sky-50 text-sky-300 border-sky-100"
                    }`}
                  >
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <div>
                    <h5 className={`text-xs font-sans font-semibold ${isDark ? "text-white" : "text-sky-950"}`}>
                      {s.label}
                    </h5>
                    <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-400" : "text-sky-800"}`}>
                      {s.desc}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <span className={`text-[10px] font-mono font-semibold uppercase ${isDark ? "text-sky-400" : "text-sky-600"}`}>
                    Processing
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Sandbox Console Logger */}
      <div className={`rounded-xl border p-4 font-mono text-[11px] space-y-2
        ${isDark 
          ? "border-sky-950/40 bg-black/70 text-gray-400" 
          : "border-sky-100 bg-white text-sky-900"
        }`}>
        <div className={`flex items-center gap-2 border-b pb-1.5 ${isDark ? "border-sky-950/30 text-gray-500" : "border-sky-100 text-sky-600"}`}>
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold">Console Logs</span>
        </div>
        <div className="space-y-1 select-none text-[10px] font-semibold leading-relaxed">
          {terminalLines.map((line, idx) => {
            const isSpecial = line.startsWith("INIT") || line.startsWith("PARSE");
            const isIntent = line.startsWith("Intent");
            return (
              <div 
                key={idx} 
                className={
                  isSpecial 
                    ? isDark ? "text-sky-400" : "text-sky-600"
                    : isIntent 
                      ? "text-emerald-550" 
                      : isDark ? "text-gray-400" : "text-sky-800"
                }
              >
                <span>{`> ${line}`}</span>
              </div>
            );
          })}
          <div className={`${isDark ? "text-sky-400" : "text-sky-600"} text-[10px] font-bold`}>● Compiling final payload...</div>
        </div>
      </div>

    </div>
  );
}

