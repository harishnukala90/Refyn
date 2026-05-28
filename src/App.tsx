import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Code2, ImageIcon, FileText, Video, Briefcase, BookOpen, 
  Terminal, ArrowRight, Copy, Check, RefreshCw, AlertCircle, 
  Menu, Info, Download, Sun, Moon 
} from "lucide-react";
import { motion } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { PromptOptimizerMetric } from "./components/PromptOptimizerMetric";
import { LoadingSandbox } from "./components/LoadingSandbox";
import { TypewriterPrompt } from "./components/TypewriterPrompt";
import { PromptHistoryItem, ExamplePrompt } from "./types";
import { CATEGORIES, TARGET_MODELS, OUTPUT_FORMATS } from "./data";

export default function App() {
  const loadHistory = (): PromptHistoryItem[] => {
    try {
      const saved = localStorage.getItem("refyn_history_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [history, setHistory] = useState<PromptHistoryItem[]>(loadHistory);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  
  const [rawPrompt, setRawPrompt] = useState("");

  const typingTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  const simulateTyping = (text: string) => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }

    setRawPrompt("");
    let currentIdx = 0;
    const speed = Math.max(8, Math.min(25, Math.floor(650 / text.length)));

    typingTimerRef.current = setInterval(() => {
      setRawPrompt(() => {
        const nextText = text.slice(0, currentIdx + 1);
        currentIdx++;
        if (currentIdx >= text.length) {
          if (typingTimerRef.current) {
            clearInterval(typingTimerRef.current);
            typingTimerRef.current = null;
          }
        }
        return nextText;
      });
    }, speed);
  };
  const [category, setCategory] = useState("coding");
  const [targetModel, setTargetModel] = useState("gemini");
  const [format, setFormat] = useState("detailed");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("refyn_theme_v1");
    return savedTheme !== "light";
  });
  
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [intent, setIntent] = useState("");
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [missingSuggestions, setMissingSuggestions] = useState<string[]>([]);
  const [isOfflineEngine, setIsOfflineEngine] = useState(false);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  
  const [isCopiedRefined, setIsCopiedRefined] = useState(false);
  const [isCopiedNegative, setIsCopiedNegative] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [rippleActive, setRippleActive] = useState(false);
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const [rippleIsDark, setRippleIsDark] = useState(false);
  const outputSectionRef = useRef<HTMLElement | null>(null);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || 40;
    setRipplePos({ x, y });
    setRippleIsDark(!isDark);
    setRippleActive(true);
    
    setTimeout(() => {
      setIsDark(!isDark);
    }, 320);

    setTimeout(() => {
      setRippleActive(false);
    }, 850);
  };

  useEffect(() => {
    try {
      localStorage.setItem("refyn_history_v1", JSON.stringify(history));
    } catch (err) {
      console.error("Local storage sync error", err);
    }
  }, [history]);

  useEffect(() => {
    localStorage.setItem("refyn_theme_v1", isDark ? "dark" : "light");
  }, [isDark]);

  const focusOutputPanel = () => {
    requestAnimationFrame(() => {
      outputSectionRef.current?.focus({ preventScroll: true });
      outputSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleRefine = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rawPrompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setIsOfflineEngine(false);

    try {
      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawPrompt: rawPrompt.trim(),
          category,
          targetModel,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to refine prompt");
      }

      const data = await response.json();

      setRefinedPrompt(data.refinedPrompt);
      setNegativePrompt(data.negativePrompt || "");
      setIntent(data.intent || "");
      setQualityScore(data.qualityScore ?? 70);
      setImprovements(data.improvements || []);
      setMissingSuggestions(data.missingSuggestions || []);
      setSources(data.sources || []);

      const usedOffline = data.improvements?.some((imp: string) => imp.includes("Offline") || imp.includes("fallback") || imp.includes("Fallback")) || false;
      setIsOfflineEngine(usedOffline);

      const newItem: PromptHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        rawPrompt: rawPrompt.trim(),
        refinedPrompt: data.refinedPrompt,
        negativePrompt: data.negativePrompt || "",
        category: data.category || category,
        targetModel,
        format,
        intent: data.intent || "",
        qualityScore: data.qualityScore ?? 70,
        missingSuggestions: data.missingSuggestions || [],
        improvements: data.improvements || [],
        timestamp: new Date().toISOString(),
        sources: data.sources || [],
      };

      setHistory((prev) => [newItem, ...prev]);
      setSelectedHistoryId(newItem.id);
      focusOutputPanel();
      
      if (data.category && CATEGORIES.some(cat => cat.id === data.category)) {
        setCategory(data.category);
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong while connecting to the prompt refinement engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: PromptHistoryItem) => {
    setSelectedHistoryId(item.id);
    setRawPrompt(item.rawPrompt);
    setCategory(item.category);
    setTargetModel(item.targetModel);
    setFormat(item.format);
    
    setRefinedPrompt(item.refinedPrompt);
    setNegativePrompt(item.negativePrompt || "");
    setIntent(item.intent);
    setQualityScore(item.qualityScore);
    setImprovements(item.improvements);
    setMissingSuggestions(item.missingSuggestions);
    setSources(item.sources || []);
    
    setIsSidebarOpen(false);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
    }
  };

  const handleClearAllHistory = () => {
    if (confirm("Are you sure you want to clear all prompt refinement history?")) {
      setHistory([]);
      setSelectedHistoryId(null);
    }
  };

  const handleLoadExample = (example: ExamplePrompt) => {
    simulateTyping(example.rawPrompt);
    setCategory(example.category);
    setTargetModel(example.targetModel);
    setFormat(example.format);
    
    setRefinedPrompt("");
    setNegativePrompt("");
    setIntent("");
    setQualityScore(0);
    setImprovements([]);
    setMissingSuggestions([]);
    setSources([]);
    setError(null);
    setIsOfflineEngine(false);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSidebarOpen(false);
  };

  const handleApplyMissing = (suggestion: string) => {
    setRawPrompt((prev) => {
      const cleanPrev = prev.trim();
      const delimiter = cleanPrev.endsWith(".") || cleanPrev.endsWith("?") ? " " : ". ";
      return `${cleanPrev}${delimiter}[Context Addendum: ${suggestion.replace(/^[0-9.\-\s+]+/g, "")}]`;
    });
  };

  const copyToClipboard = async (text: string, type: "refined" | "negative") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Clipboard access was blocked by the browser. Select the prompt text and copy it manually.");
      return;
    }

    if (type === "refined") {
      setIsCopiedRefined(true);
      setTimeout(() => setIsCopiedRefined(false), 2000);
    } else {
      setIsCopiedNegative(true);
      setTimeout(() => setIsCopiedNegative(false), 2000);
    }
  };

  const handleDownload = (formatType: "txt" | "md") => {
    let content = "";
    let filename = `refyn-${category || "prompt"}-${Date.now()}.${formatType}`;

    if (formatType === "md") {
      content = `# Refined Prompt\n\nGenerated by **Refyn** for *${targetModel}* AI model in *${format}* format.\n\n`;
      content += `## Intent\n> ${intent || "Custom parsed intent"}\n\n`;
      content += `## Optimized Prompt\n\`\`\`\n${refinedPrompt}\n\`\`\`\n\n`;
      if (category === "image generation" && negativePrompt) {
        content += `## Negative Prompt (Attributes to exclude)\n\`\`\`\n${negativePrompt}\n\`\`\`\n\n`;
      }
      if (improvements && improvements.length > 0) {
        content += `## Applied Improvements\n`;
        improvements.forEach((imp) => {
          content += `- ${imp}\n`;
        });
      }
      if (missingSuggestions && missingSuggestions.length > 0) {
        content += `\n## Recommendations for Future Optimizations\n`;
        missingSuggestions.forEach((sug) => {
          content += `- ${sug}\n`;
        });
      }
    } else {
      content = `REFINED PROMPT (Refyn Platform):\n\n${refinedPrompt}\n`;
      if (category === "image generation" && negativePrompt) {
        content += `\nNEGATIVE PROMPT:\n\n${negativePrompt}\n`;
      }
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryTheme = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId)?.color || "from-gray-500 to-slate-600 bg-gray-50/10 text-gray-400 border-gray-500/20";
  };

  return (
    <div className={`min-h-screen flex overflow-hidden relative transition-colors duration-500
      ${isDark ? "bg-[#02040a] text-gray-200" : "bg-[#f3fafc] text-sky-950"}`} 
      id="refyn-app-root">
      
      {/* Dynamic Ambient Background Layer */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-700 pointer-events-none ${
        isDark 
          ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-black via-[#040c1a] to-black opacity-100"
          : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/40 via-white to-[#f0f9ff] opacity-100"
      }`} />
      
      {/* Brand Sidebar */}
      <Sidebar
        history={history}
        selectedHistoryId={selectedHistoryId}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onClearAllHistory={handleClearAllHistory}
        onLoadExample={handleLoadExample}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDark={isDark}
        isLoading={isLoading}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative z-10" id="main-workspace-frame">
        
        {/* Workspace Top Navigation Bar */}
        <header className={`sticky top-0 z-30 backdrop-blur-md px-4 py-4 lg:px-8 flex items-center justify-between border-b transition-colors duration-300
          ${isDark 
            ? "bg-black/30 border-sky-950/40" 
            : "bg-white/35 border-sky-100/60"
          }`}>
          <div className="flex items-center gap-3">
            {/* Mobile Toggle Drawer */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-lg border transition-colors
                ${isDark 
                  ? "border-sky-950/40 text-gray-400 hover:text-white hover:bg-gray-900" 
                  : "border-sky-100 text-sky-700 hover:text-sky-950 hover:bg-sky-50"
                }`}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg lg:text-xl font-bold tracking-tight flex items-center gap-2">
                <span className={isDark ? "text-white" : "text-sky-950"}>Refyn</span>
                <span className={`text-[10px] px-2 py-0.5 border rounded-full font-mono uppercase tracking-wider
                  ${isDark 
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                    : "bg-sky-50/70 text-sky-600 border-sky-200"
                  }`}>
                  Engine v1.0
                </span>
              </h1>
              <p className={`text-xs hidden sm:block ${isDark ? "text-gray-400" : "text-sky-800"}`}>
                Turn vague concepts into precise instructions for high-performance AI outputs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              className={`p-2 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-sm
                ${isDark 
                  ? "border-sky-950/40 bg-black/60 text-sky-300 hover:text-white hover:bg-sky-950/35" 
                  : "border-sky-200 bg-white text-sky-700 hover:text-sky-950 hover:bg-sky-50"
                }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isOfflineEngine ? (
              <span className={`text-[11px] font-mono inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                bg-amber-500/15 border-amber-500/30 text-amber-500`}>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Local Synthesis Active
              </span>
            ) : (
              <span className={`text-[11px] font-mono hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                ${isDark 
                  ? "bg-black/60 border-sky-950/40 text-gray-400" 
                  : "bg-white border-sky-100 text-sky-700"
                }`}>
                <span className={`w-2 h-2 rounded-full bg-sky-500 ${isLoading ? "" : "animate-pulse"}`}></span>
                Live Grid Connected
              </span>
            )}
          </div>
        </header>

        {/* Global Content Grid Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Editor Config & Actions */}
            <section className="xl:col-span-6 space-y-6" id="input-editor-section">
              <form onSubmit={handleRefine} className="space-y-6">
                
                {/* Editor Container */}
                <div className={`rounded-2xl border p-5 space-y-4 shadow-xl backdrop-blur-md transition-all duration-300
                  ${isDark 
                    ? "bg-black/40 border-sky-950/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]" 
                    : "bg-white/70 border-sky-100 shadow-[0_8px_32px_rgba(14,165,233,0.05)]"
                  }`}>
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-sans font-semibold tracking-tight flex items-center gap-2
                      ${isDark ? "text-white" : "text-sky-950"}`}>
                      <Terminal className={`w-4 h-4 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
                      Raw Prompt Input
                    </label>
                    <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-sky-500" : "text-sky-700/60"}`}>
                      {rawPrompt.trim().split(/\s+/).filter(Boolean).length} words | {rawPrompt.length} chars
                    </span>
                  </div>

                  {/* Textarea Editor */}
                  <div className="relative">
                    <textarea
                      placeholder="Type or paste your raw prompt here... (e.g. 'write a python function to scrape a web site and save as csv')"
                      value={rawPrompt}
                      onChange={(e) => {
                        if (typingTimerRef.current) {
                          clearInterval(typingTimerRef.current);
                          typingTimerRef.current = null;
                        }
                        setRawPrompt(e.target.value);
                      }}
                      rows={7}
                      className={`w-full text-sm p-4 rounded-xl leading-relaxed resize-y min-h-[140px] transition-all font-sans focus:outline-none focus:ring-1
                        ${isDark 
                          ? "bg-black/60 border-sky-950/40 text-gray-200 placeholder-gray-600 focus:border-sky-500/40 focus:ring-sky-500/10" 
                          : "bg-white/80 border-sky-100 text-sky-950 placeholder-sky-400 focus:border-sky-400 focus:ring-sky-300/20"
                        }`}
                      id="raw-prompt-textarea"
                      required
                    />
                    
                    <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
                      {rawPrompt && (
                        <button
                          type="button"
                          onClick={() => setRawPrompt("")}
                          className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-colors cursor-pointer font-medium
                            ${isDark 
                              ? "text-gray-400 hover:text-white bg-black/80 border-sky-950/60 hover:border-sky-500/30" 
                              : "text-sky-700 hover:text-sky-950 bg-sky-50 border-sky-200"
                            }`}
                        >
                          Clear
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={async () => {
                          if (isGeneratingExample) return;
                          setIsGeneratingExample(true);
                          try {
                            const response = await fetch("/api/generate-raw-prompt", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ category, seed: Math.random() }),
                            });
                            if (response.ok) {
                              const data = await response.json() as { rawPrompt?: string };
                              if (data.rawPrompt) {
                                simulateTyping(data.rawPrompt);
                              }
                            }
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsGeneratingExample(false);
                          }
                        }}
                        className={`text-[11px] font-sans px-2.5 py-1 rounded border transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm
                          ${isDark 
                            ? "bg-sky-950/40 text-sky-300 border-sky-500/20 hover:bg-sky-500/15 hover:text-white" 
                            : "bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100/80 hover:text-sky-950"
                          }`}
                        title="Generate a dynamic raw prompt model suggestion using Gemini"
                      >
                        {isGeneratingExample ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            <span>Generate Example</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Category Pill Selection */}
                  <div className="space-y-2">
                    <span className={`text-xs font-mono font-medium tracking-wider uppercase
                      ${isDark ? "text-sky-400/80" : "text-sky-700"}`}>
                      Prompt Category Style
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer 
                              ${isSelected 
                                ? isDark 
                                  ? `bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.15)]` 
                                  : `bg-sky-100/80 border-sky-400 text-sky-900 font-semibold shadow-[0_0_8px_rgba(14,165,233,0.1)]`
                                : isDark 
                                  ? "bg-black/30 border-sky-950/30 text-gray-400 hover:border-sky-500/20 hover:text-gray-200" 
                                  : "bg-white/40 border-sky-100 text-sky-700 hover:border-sky-300 hover:text-sky-950"
                              }`}
                          >
                            <span className="text-xs font-semibold">{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Parameters Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Target Engine Dropdown */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-mono font-medium uppercase ${isDark ? "text-sky-400/80" : "text-sky-700"}`}>
                        Target AI Engine
                      </label>
                      <select
                        value={targetModel}
                        onChange={(e) => setTargetModel(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none cursor-pointer leading-tight font-sans transition-all
                          ${isDark 
                            ? "bg-black border-sky-950/60 text-white focus:border-sky-500/45 focus:ring-1 focus:ring-sky-500/10" 
                            : "bg-white border-sky-100 text-sky-950 focus:border-sky-400 focus:ring-1 focus:ring-sky-300/20"
                          }`}
                      >
                        {TARGET_MODELS.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Output Format Style */}
                    <div className="space-y-1.5">
                      <label className={`text-xs font-mono font-medium uppercase ${isDark ? "text-sky-400/80" : "text-sky-700"}`}>
                        Structure Length / Mode
                      </label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none cursor-pointer leading-tight font-sans transition-all
                          ${isDark 
                            ? "bg-black border-sky-950/60 text-white focus:border-sky-500/45 focus:ring-1 focus:ring-sky-500/10" 
                            : "bg-white border-sky-100 text-sky-950 focus:border-sky-400 focus:ring-1 focus:ring-sky-300/20"
                          }`}
                      >
                        {OUTPUT_FORMATS.map((f) => (
                          <option key={f.id} value={f.id} title={f.description}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit Button Trigger */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isLoading || !rawPrompt.trim()}
                      className="w-full h-12 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-sky-500/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      id="submit-refinement-button"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Analysing Intent & Restructuring...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Refine Raw Prompt</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </form>

              {/* Informative Guidance */}
              <div className={`rounded-2xl border p-5 space-y-3 backdrop-blur-md transition-colors duration-300
                ${isDark 
                  ? "bg-black/20 border-sky-950/30" 
                  : "bg-white/50 border-sky-100"
                }`}>
              <h4 className={`text-xs font-mono font-medium uppercase tracking-wider flex items-center gap-1.5
                ${isDark ? "text-sky-400" : "text-sky-700"}`}>
                <Info className="w-4 h-4 shrink-0" /> Why prompt refinement?
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-sky-900"}`}>
                Refyn translates simple, ambiguous requests into highly structured prompts with deep domain expertise constraints, persona frameworks, and task-ready code specs. Standard models respond orders of magnitude better when supplied with structured intent constraints.
              </p>
            </div>

          </section>

          {/* Right Column: Refined Outputs & Metrics */}
          <section
            ref={outputSectionRef}
            tabIndex={-1}
            className="xl:col-span-6 space-y-6 outline-none"
            id="output-rendered-section"
          >
            
            {error && (
              <div className={`p-4 border rounded-xl text-xs flex gap-2.5 items-start
                ${isDark 
                  ? "bg-rose-950/20 border-rose-500/20 text-rose-400" 
                  : "bg-rose-50/85 border-rose-200 text-rose-800"
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold block">Refinement Error</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {isLoading ? (
                <LoadingSandbox isDark={isDark} />
              ) : refinedPrompt ? (
                <div className="space-y-6" id="optimized-data-board">
                  
                  {/* Prompt Results Box */}
                  <div className={`rounded-2xl border overflow-hidden shadow-2xl backdrop-blur-md transition-colors duration-300
                    ${isDark 
                      ? "bg-black/45 border-sky-950/40" 
                      : "bg-white/80 border-sky-100/80"
                    }`}>
                    
                    {/* Header */}
                    <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3
                      ${isDark ? "bg-black/50 border-sky-950/30" : "bg-sky-50/30 border-sky-100"}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full bg-sky-500 ${isLoading ? "" : "animate-pulse"}`}></div>
                        <span className={`text-xs font-mono uppercase font-semibold ${isDark ? "text-sky-300" : "text-sky-900"}`}>
                          Refined Target-Ready Prompt
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Download Markdown */}
                        <button
                          onClick={() => handleDownload("md")}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans font-medium
                            ${isDark 
                              ? "border-sky-950/40 bg-black text-gray-300 hover:text-white hover:border-sky-500/40" 
                              : "border-sky-200 bg-white text-sky-800 hover:text-sky-950 hover:border-sky-400"
                            }`}
                          title="Download as Markdown (.md)"
                        >
                          <Download className={`w-3.5 h-3.5 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
                          <span>.MD</span>
                        </button>

                        {/* Download Text */}
                        <button
                          onClick={() => handleDownload("txt")}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans font-medium
                            ${isDark 
                              ? "border-sky-950/40 bg-black text-gray-300 hover:text-white hover:border-sky-500/40" 
                              : "border-sky-200 bg-white text-sky-800 hover:text-sky-950 hover:border-sky-400"
                            }`}
                          title="Download as Plain Text (.txt)"
                        >
                          <Download className={`w-3.5 h-3.5 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
                          <span>.TXT</span>
                        </button>

                        <button
                          onClick={() => copyToClipboard(refinedPrompt, "refined")}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans font-semibold
                            ${isDark 
                              ? "bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/10" 
                              : "bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
                            }`}
                          title="Copy prompt"
                        >
                          {isCopiedRefined ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span className="text-white font-semibold text-[11px]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Code styled render box */}
                    <div className={`p-5 relative ${isDark ? "bg-black/20" : "bg-sky-50/10"}`}>
                      <TypewriterPrompt text={refinedPrompt} isDark={isDark} />
                    </div>
                    
                    {/* Google Search grounding sources */}
                    {sources && sources.length > 0 && (
                      <div className={`px-5 py-3 border-t text-xs transition-colors duration-300
                        ${isDark 
                          ? "border-sky-950/20 bg-sky-950/5 text-gray-400" 
                          : "border-sky-100/60 bg-sky-50/20 text-sky-800"}`}>
                        <div className="flex items-center gap-1.5 font-bold text-sky-500 mb-2 uppercase tracking-wider text-[10px] font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Search Grounding Sources
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all hover:scale-[1.02]
                                ${isDark 
                                  ? "bg-black/40 border-sky-950/60 hover:border-sky-500/30 text-sky-300 hover:text-white" 
                                  : "bg-white border-sky-200 hover:border-sky-400 text-sky-700 hover:text-sky-950"}`}
                            >
                              <span className="truncate max-w-[180px]">{src.title}</span>
                              <ArrowRight className="w-3 h-3 text-sky-500 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Warning */}
                    <div className={`px-5 py-3 border-t text-[10px] font-mono leading-relaxed
                      ${isDark 
                        ? "border-sky-950/30 bg-black/10 text-gray-500" 
                        : "border-sky-100/60 bg-sky-50/30 text-sky-700"}`}>
                      Copy the generated snippet above and paste it directly into your visual models, code assistants, or content generators.
                    </div>
                  </div>

                  {/* Prompt Analysis Metrics */}
                   <PromptOptimizerMetric
                    score={qualityScore}
                    intent={intent}
                    missingSuggestions={missingSuggestions}
                    improvements={improvements}
                    onApplyMissing={handleApplyMissing}
                    isLoading={isLoading}
                    isDark={isDark}
                    isOfflineEngine={isOfflineEngine}
                  />

                </div>
              ) : (
                <div 
                  className={`rounded-2xl border border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[460px] backdrop-blur-md transition-colors duration-300
                    ${isDark 
                      ? "border-sky-950/35 bg-black/10" 
                      : "border-sky-200 bg-white/40"
                    }`}
                  id="output-placeholder"
                >
                  <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-5 relative
                    ${isDark ? "bg-black border-sky-950/50" : "bg-white border-sky-200"}`}>
                    <Sparkles className={`w-6 h-6 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
                    <span className={`absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full ${isLoading ? "" : "animate-ping"}`}></span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full"></span>
                  </div>
                  
                  <h3 className={`text-base font-sans font-semibold mb-2 ${isDark ? "text-white" : "text-sky-950"}`}>
                    Awaiting Refinement Payload
                  </h3>
                  <p className={`text-xs max-w-sm mx-auto leading-relaxed mb-6 font-sans
                    ${isDark ? "text-gray-500" : "text-sky-700"}`}>
                    Once you provide a raw human input, Refyn's semantic parser will dissect original scoring, generate ready-to-use prompts, and surface gaps.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    <div className={`p-3 border rounded-lg text-left backdrop-blur-lg
                      ${isDark ? "bg-black/70 border-sky-950/40" : "bg-white border-sky-100/80 shadow-xs"}`}>
                      <span className="text-[10px] font-mono text-sky-400 uppercase block mb-1">Step 1</span>
                      <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-sky-900"}`}>Describe what you want to achieve simply on the left panel.</p>
                    </div>
                    <div className={`p-3 border rounded-lg text-left backdrop-blur-lg
                      ${isDark ? "bg-black/70 border-sky-950/40" : "bg-white border-sky-100/80 shadow-xs"}`}>
                      <span className="text-[10px] font-mono text-sky-400 uppercase block mb-1">Step 2</span>
                      <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-sky-900"}`}>Copy high-performance instructions structured for prompt success.</p>
                    </div>
                  </div>
                </div>
              )}

            </section>

          </div>
        </main>
      </div>

      {/* Spreading Theme Circle Ripple Overlay */}
      {rippleActive && (
        <motion.div
          key="theme-ripple-wave"
          initial={{ clipPath: `circle(0px at ${ripplePos.x}px ${ripplePos.y}px)` }}
          animate={{ clipPath: `circle(150% at ${ripplePos.x}px ${ripplePos.y}px)` }}
          transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
          className={`fixed inset-0 z-[1] pointer-events-none ${
            rippleIsDark
              ? "bg-[#02040a] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-black via-[#040c1a] to-black"
              : "bg-[#f3fafc] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/40 via-white to-[#f0f9ff]"
          }`}
        />
      )}

    </div>
  );
}
