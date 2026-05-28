export interface PromptHistoryItem {
  id: string;
  rawPrompt: string;
  refinedPrompt: string;
  negativePrompt?: string;
  category: string;
  targetModel: string;
  format: string;
  intent: string;
  qualityScore: number;
  missingSuggestions: string[];
  improvements: string[];
  timestamp: string;
  sources?: { title: string; uri: string }[];
}

export interface ExamplePrompt {
  title: string;
  rawPrompt: string;
  category: string;
  targetModel: string;
  format: string;
  description: string;
}

export type CategoryType = "coding" | "image generation" | "writing" | "video" | "business" | "research" | "general";
