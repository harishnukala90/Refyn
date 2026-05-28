import React, { useState, useEffect } from "react";
import { 
  History, Sparkles, Trash2, Search, X, RefreshCw,
  Code2, ImageIcon, FileText, Video, Briefcase, BookOpen, Terminal 
} from "lucide-react";
import { PromptHistoryItem, ExamplePrompt } from "../types";
import { EXAMPLE_PROMPTS } from "../data";

interface SidebarProps {
  history: PromptHistoryItem[];
  selectedHistoryId: string | null;
  onSelectHistory: (item: PromptHistoryItem) => void;
  onDeleteHistory: (id: string) => void;
  onClearAllHistory: () => void;
  onLoadExample: (example: ExamplePrompt) => void;
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isLoading?: boolean;
}

export function Sidebar({
  history,
  selectedHistoryId,
  onSelectHistory,
  onDeleteHistory,
  onClearAllHistory,
  onLoadExample,
  isOpen,
  onClose,
  isDark,
  isLoading = false,
}: SidebarProps) {
  const [searchHistory, setSearchHistory] = useState("");
  const [catalysts, setCatalysts] = useState<ExamplePrompt[]>([]);
  const [fadeState, setFadeState] = useState(true);

  // Periodic rotation of Example Catalysts
  useEffect(() => {
    // Select 4 random examples initially or slice
    setCatalysts(EXAMPLE_PROMPTS.slice(0, 4));

    const interval = setInterval(() => {
      setFadeState(false);
      setTimeout(() => {
        setCatalysts(() => {
          // Shuffle or select a random start index
          const maxStart = Math.max(0, EXAMPLE_PROMPTS.length - 4);
          const startIdx = Math.floor(Math.random() * (maxStart + 1));
          return EXAMPLE_PROMPTS.slice(startIdx, startIdx + 4);
        });
        setFadeState(true);
      }, 300);
    }, 12000); // Shift catalysts every 12 seconds

    return () => clearInterval(interval);
  }, []);

  const triggerManualCatalystCycle = () => {
    setFadeState(false);
    setTimeout(() => {
      setCatalysts(() => {
        const shuffled = [...EXAMPLE_PROMPTS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
      });
      setFadeState(true);
    }, 250);
  };

  const filteredHistory = history.filter((item) => {
    const rawMatch = item.rawPrompt.toLowerCase().includes(searchHistory.toLowerCase());
    const refinedMatch = item.refinedPrompt.toLowerCase().includes(searchHistory.toLowerCase());
    const intentMatch = item.intent.toLowerCase().includes(searchHistory.toLowerCase());
    return rawMatch || refinedMatch || intentMatch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "coding": return <Code2 className="w-3.5 h-3.5" />;
      case "image generation": return <ImageIcon className="w-3.5 h-3.5" />;
      case "writing": return <FileText className="w-3.5 h-3.5" />;
      case "video": return <Video className="w-3.5 h-3.5" />;
      case "business": return <Briefcase className="w-3.5 h-3.5" />;
      case "research": return <BookOpen className="w-3.5 h-3.5" />;
      default: return <Terminal className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category?.toLowerCase()) {
      default:
        return isDark 
          ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
          : "bg-sky-50 text-sky-600 border-sky-200";
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return "Just now";
    }
  };

  return (
    <div 
      className={`fixed top-0 bottom-0 left-0 z-40 w-80 flex flex-col transition-all duration-300 transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:relative lg:z-10 border-r
        ${isDark 
          ? "glass-fluid-dark text-gray-100" 
          : "glass-fluid-light text-sky-950"
        }`}
      id="app-sidebar"
    >
      {/* Brand Header */}
      <div className={`flex items-center justify-between p-5 border-b transition-colors duration-300
        ${isDark ? "border-sky-950/40 bg-black/40" : "border-sky-100/60 bg-sky-50/40"}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Sparkles className={`w-5 h-5 text-white ${isLoading ? "" : "animate-pulse"}`} />
          </div>
          <div>
            <span className={`text-xl font-bold tracking-tight font-sans ${isDark ? "text-white" : "text-sky-950"}`}>
              Refyn
            </span>
            <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? "text-sky-400" : "text-sky-600"}`}>
              Refine Your Prompts
            </p>
          </div>
        </div>
        
        {/* Mobile close button */}
        <button 
          onClick={onClose} 
          className={`lg:hidden p-1.5 rounded-lg border text-gray-400 hover:text-white transition-colors
            ${isDark ? "border-sky-950/30 hover:bg-gray-900" : "border-sky-200 hover:bg-sky-100"}`}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Sidebar Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
        
        {/* Local Prompt History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className={`flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase ${isDark ? "text-sky-400" : "text-sky-700"}`}>
              <History className="w-3.5 h-3.5" />
              <span>History ({history.length})</span>
            </div>
            {history.length > 0 && (
              <button 
                onClick={onClearAllHistory}
                className={`text-[10px] font-mono font-semibold hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors
                  ${isDark ? "text-gray-500" : "text-sky-500"}`}
                title="Clear all local history"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Search History */}
          <div className="relative">
            <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? "text-sky-500/40" : "text-sky-600/40"}`} />
            <input
              type="text"
              placeholder="Search past refinements..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className={`w-full border rounded-lg py-2 pl-9 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/20 transition-all
                ${isDark 
                  ? "bg-black/60 border-sky-950/40 text-white placeholder-gray-600 focus:border-sky-500/30" 
                  : "bg-white/80 border-sky-100 text-sky-950 placeholder-sky-400 focus:border-sky-400"
                }`}
            />
            {searchHistory && (
              <button 
                onClick={() => setSearchHistory("")}
                className={`absolute right-2 top-2 p-0.5 rounded transition-colors 
                  ${isDark ? "text-gray-500 hover:text-white" : "text-sky-700 hover:text-sky-950"}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* History List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  id={`history-${item.id}`}
                  className={`group relative flex items-start justify-between gap-2 p-2.5 rounded-lg border text-left transition-all duration-200 cursor-pointer 
                    ${selectedHistoryId === item.id 
                      ? isDark
                        ? "bg-sky-950/25 border-sky-500/40 text-white shadow-md shadow-sky-950/10"
                        : "bg-sky-100/50 border-sky-300 text-sky-950" 
                      : isDark
                        ? "bg-black/35 border-sky-950/20 hover:bg-sky-950/10 text-gray-300 hover:text-white"
                        : "bg-white/40 border-sky-100/60 hover:bg-sky-100/20 text-sky-900 hover:text-sky-950"
                    }`}
                  onClick={() => onSelectHistory(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold border rounded ${getCategoryTheme(item.category)}`}>
                        {getCategoryIcon(item.category)}
                        <span className="capitalize">{item.category}</span>
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 tracking-tight">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold truncate font-sans">
                      {item.intent || item.rawPrompt}
                    </p>
                    <p className={`text-[10px] font-mono mt-0.5 truncate leading-none ${isDark ? "text-gray-500" : "text-sky-600/70"}`}>
                      Score: <span className="text-sky-500 font-bold">{item.qualityScore}</span> | {item.targetModel}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistory(item.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/20 text-gray-400 hover:text-rose-400 transition-all self-center absolute right-2 border
                      ${isDark ? "bg-black border-sky-950/40" : "bg-white border-sky-100"}`}
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className={`text-[11px] text-center py-5 italic font-sans ${isDark ? "text-gray-600" : "text-sky-600/50"}`}>
                {searchHistory ? "No matching records" : "No prompt history yet"}
              </p>
            )}
          </div>
        </div>

        {/* Examples Library */}
        <div className="space-y-3 pb-3">
          <div className="flex items-center justify-between px-1">
            <div className={`flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase ${isDark ? "text-sky-400" : "text-sky-700"}`}>
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Example Catalysts</span>
            </div>
            <button 
              onClick={triggerManualCatalystCycle}
              className={`p-1 rounded-md border hover:rotate-180 transition-all duration-500 cursor-pointer
                ${isDark ? "border-sky-950/40 hover:bg-sky-950/20 text-sky-400" : "border-sky-100 hover:bg-sky-100 text-sky-700"}`}
              title="Shuffle catalysts now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`space-y-2 transition-all duration-300 ${fadeState ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            {catalysts.map((ex, idx) => (
              <button
                key={idx}
                id={`example-btn-${idx}`}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer group flex flex-col gap-1
                  ${isDark 
                    ? "bg-black/35 hover:bg-sky-950/10 border-sky-950/40 text-gray-300 hover:text-white hover:border-sky-500/20" 
                    : "bg-white/60 hover:bg-sky-50/50 border-sky-100 text-sky-900 hover:text-sky-950 hover:border-sky-300"
                  }`}
                onClick={() => onLoadExample(ex)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-semibold leading-none transition-colors ${isDark ? "group-hover:text-sky-400" : "group-hover:text-sky-600"}`}>
                    {ex.title}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 text-[8px] font-mono uppercase rounded border
                    ${isDark ? "bg-black/80 border-sky-950/40 text-sky-400" : "bg-sky-100/55 border-sky-200 text-sky-700"}`}>
                    {getCategoryIcon(ex.category)}
                  </span>
                </div>
                <p className={`text-[10px] leading-tight ${isDark ? "text-gray-500" : "text-sky-600/75"}`}>
                  {ex.description}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className={`p-4 border-t flex flex-col gap-1 text-[11px] font-mono text-center
        ${isDark ? "border-sky-900 bg-black text-gray-500" : "border-sky-100 bg-sky-50 text-sky-600/70"}`}>
        <span>Platform State: Dynamic</span>
        <span>Model Version: Gemini 3.5 Flash</span>
      </div>
    </div>
  );
}
