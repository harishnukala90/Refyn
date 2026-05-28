import React, { useState, useEffect, useRef } from "react";

interface TypewriterPromptProps {
  text: string;
  isDark: boolean;
}

export const TypewriterPrompt: React.FC<TypewriterPromptProps> = ({ text, isDark }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Reset and start typing when the original text changes
  useEffect(() => {
    // Clear any active timers
    if (timerRef.current) {
      window.cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }

    if (!text) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);
    indexRef.current = 0;

    const totalLength = text.length;
    // Scale typing speed: typing more characters per frame for longer files
    // so it always takes under 1.5 - 2 seconds to complete the animation
    const animate = () => {
      // Minimum 1 character per frame, scaling up for lengthy text chunks
      const speed = Math.max(1, Math.ceil(totalLength / 180)); 
      
      if (indexRef.current < totalLength) {
        indexRef.current = Math.min(totalLength, indexRef.current + speed);
        setDisplayedText(text.slice(0, indexRef.current));
        timerRef.current = window.requestAnimationFrame(animate);
      } else {
        setIsTyping(false);
      }
    };

    timerRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (timerRef.current) {
        window.cancelAnimationFrame(timerRef.current);
      }
    };
  }, [text]);

  const handleSkip = () => {
    if (timerRef.current) {
      window.cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setDisplayedText(text);
    setIsTyping(false);
  };

  return (
    <div className="relative group/typewriter">
      <pre 
        className={`text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-85 overflow-y-auto select-all pr-2 custom-scrollbar
          ${isDark ? "text-gray-100" : "text-sky-950"}`}
      >
        {displayedText}
        {isTyping && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-sky-500 animate-pulse align-middle" />
        )}
      </pre>

      {isTyping && (
        <button
          type="button"
          onClick={handleSkip}
          className={`absolute -bottom-1 right-0 px-2.5 py-1 rounded border text-[10px] font-sans font-semibold transition-all shadow-sm flex items-center gap-1 cursor-pointer hover:scale-[1.02]
            ${isDark 
              ? "bg-black/95 border-sky-500/30 text-sky-400 hover:text-white" 
              : "bg-white border-sky-200 text-sky-700 hover:text-sky-950 hover:bg-sky-50"
            }`}
        >
          <span>Skip typing</span>
          <span className="text-[9px] font-normal opacity-70">(instant output)</span>
        </button>
      )}
    </div>
  );
};
