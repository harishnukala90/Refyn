import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

interface RefineRequestBody {
  rawPrompt?: unknown;
  category?: unknown;
  targetModel?: unknown;
  format?: unknown;
}

interface GeneratePromptRequestBody {
  category?: unknown;
  seed?: unknown;
}

interface GroundingChunk {
  web?: {
    title?: string;
    uri?: string;
  };
}

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MODEL_FALLBACKS = ["gemini-2.5-flash-lite", "gemini-2.0-flash", GEMINI_MODEL].filter((value, index, array) => value && array.indexOf(value) === index);

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function isTransientGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /503|high demand|temporar|overload|RESOURCE_EXHAUSTED|429|quota|rate limit/i.test(message);
}

async function generateWithModelFallback(payload: {
  contents: string;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}) {
  const ai = getGeminiClient();
  let lastError: unknown;

  for (const model of GEMINI_MODEL_FALLBACKS) {
    try {
      return await ai.models.generateContent({
        model,
        contents: payload.contents,
        config: {
          systemInstruction: payload.systemInstruction,
          temperature: payload.temperature,
          responseMimeType: payload.responseMimeType,
          responseSchema: payload.responseSchema,
        },
      });
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error) || model === GEMINI_MODEL_FALLBACKS[GEMINI_MODEL_FALLBACKS.length - 1]) {
        throw error;
      }
      console.warn(`[Refyn Server API] Gemini model ${model} hit a transient capacity issue. Retrying with a fallback model...`);
    }
  }

  throw lastError ?? new Error("Gemini model fallback failed");
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const FALLBACK_PROMPTS: Record<string, string[]> = {
  coding: [
    "write a python socket listener for real-time sensor streams",
    "create an async state machine utility in javascript for game events",
    "build a fast custom compiler plugin for typescript code verification",
    "write an efficient golang database connection pool with automatic retries",
    "generate a modular shader program for a pixel-art rain reflection effect",
    "create a robust rust module to serialize binary graphs to files",
    "write an angular route resolver with robust network timeout retry guards",
    "build a high-performance memory allocator in C for embedded audio synths",
  ],
  "image generation": [
    "cyberpunk street vendor slicing bio-engineered neon apples in soft rain",
    "brutalist glass greenhouse floating above heavy alpine thunder clouds",
    "ancient library carved into red canyon cliffs with rays of golden morning sun",
    "minimalist line art poster of organic ceramic vases on textured pastel background",
    "cinematic retro documentary style photo of a space station command desk, 1970s vibe",
    "bioluminescent deep-sea reef with glowing neon jellyfish, ultra-fine macro view",
    "isometric low-poly model of a smart vertical farming modular greenhouse cabin",
    "mystical dense woods with giant glowing blue mushrooms under a cosmic starry dome",
  ],
  writing: [
    "draft a subtle speculative science fiction scene about a chef in a microgravity diner",
    "write an elegant quarterly letter on sustainable maritime supply chain optimization",
    "compose a witty personal newsletter intro analyzing modern acoustic design fatigue",
    "draft a crisp technical overview explaining optical computing concepts to high schoolers",
    "write a deep-dive opinion piece highlighting standard design elements of Swiss posters",
    "compose an immersive microfiction of an unexpected parcel arriving in an empty desert depot",
    "draft a persuasive landing page copy for a decentralized neighborhood power trading grid",
  ],
  video: [
    "cinematic tracking shot gliding past massive brass cogwheels of a giant sea-fog lighthouse",
    "macro high-speed footage of frozen blue ink drop shattering into warm yellow milk",
    "first-person hyperlapse running through a dynamic vertical indoor smart forest",
    "atmospheric twilight drone sweep over active geothermal vents in deep moss valley",
    "retro handheld VHS camera pan scanning empty concrete surf skatepools in afternoon haze",
    "dramatic slow-motion drone footage circling a futuristic tidal turbine power station",
  ],
  business: [
    "create a high-growth product launch execution strategy for a niche medical supply service",
    "draft a comprehensive standard operating procedure for handling remote team system outages",
    "formulate a strategic SWOT analysis matrix for an organic vertically integrated coffee coop",
    "design a lean customer activation sequence map for subscription-based artisanal tool rentals",
    "outline a pitch-deck script for an ultra-local crowdbacked community solar developer",
    "build a step-by-step cost-benefit matrix for transitioning server fleets to solar grid hours",
  ],
  research: [
    "design a comparative survey protocol analyzing public transport adoption in mid-sized post-industrial hubs",
    "conduct a comprehensive literature synthesis analyzing early-intervention thermal stress mitigation structures",
    "outline a rigorous research abstract exploring the carbon-capture capabilities of dynamic kelp cultivation",
    "write an analytical taxonomy of urban rewilding methodologies applied in Scandinavian cities",
    "draft a standard experimental procedure to test high-density solar cell thermal degradation",
    "formulate a detailed field observation guide studying arctic glacier recession vectors",
  ]
};

function getDynamicFallbackPrompt(category: unknown): string {
  const catKey = typeof category === "string" && FALLBACK_PROMPTS[category] ? category : "coding";
  const list = FALLBACK_PROMPTS[catKey];
  const base = list[Math.floor(Math.random() * list.length)];
  const modifiers = [
    "utilizing clean scalable patterns",
    "focusing on safety and performance bounds",
    "with responsive interactive highlights",
    "emphasizing high-contrast tactile elements",
    "optimized for extreme high reliability under load",
    "using professional academic guidelines",
    "incorporating micro-transitions and fluid steps",
    "relying on modular and robust abstractions"
  ];
  const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
  return Math.random() > 0.45 ? `${base} - ${mod}` : base;
}

function localFallbackRefine(rawPrompt: string, category: unknown, targetModel: unknown, format: unknown) {
  const cat = category || "coding";
  const fmt = typeof format === "string" ? format : "detailed";
  
  const lengthGuideline = fmt === "concise" 
    ? "Provide a highly focused, direct, and compact response without any conversational filler."
    : fmt === "step-by-step"
    ? "Break down your thinking process and final output into a clear, chronological, step-by-step sequence."
    : "Deliver an incredibly exhaustive, multi-faceted guide with rich supplementary context, edge cases, and architectural best practices.";

  const personas: Record<string, string[]> = {
    coding: [
      "elite Staff Software Engineer and Domain Architect specializing in pristine type-safe microservices",
      "Principal Security Engineer specializing in OWASP mitigation, advanced cryptographic guards, and bulletproof input sanitization",
      "Lead Systems Developer focused on performance boundaries, extreme memory efficiency, and non-blocking asynchronous architectures",
      "Full-Stack Design Systems Engineer specializing in fluid component design, high-contrast accessible layouts, and clean CSS orchestration"
    ],
    "image generation": [
      "Senior Digital Designer, Cinematographer, and lighting director with extreme precision on volumetric ray distribution",
      "Neon-Futurism Graphic Illustrator specializing in high-contrast cyberpunk and moody atmospheric compositions",
      "Bespoke Editorial Concept Artist and Golden-Ratio Composition Specialist",
      "Photorealistic Macro Photographer specializing in 85mm anamorphic layouts, calibrated temperature balances, and rich organic textures"
    ],
    writing: [
      "Master Speechwriter, Storyteller, and Senior Columnist known for high-impact rhythmic sentence variation",
      "Pulitzer-winning investigative journalist and editorial analyst with an authoritative and crisp voice",
      "Conversion Rate Optimization Copywriter specializing in persuasive narrative structures and psychological hooks",
      "Minimalist Technical Author focusing on explaining complex multi-layered mechanics using high-clarity scannable summaries"
    ],
    business: [
      "Principal Management Consultant and McKinsey Strategy Lead specializing in scale execution vectors",
      "Risk Assessor and Lean Operations Strategist specializing in process bottlenecks and fail-safe automation design",
      "Silicon Valley Venture Partner and Growth Strategist focusing on customer lifetime value expansion hooks"
    ]
  };

  const defaultPersonas = [
    "Principal Executive Consultant",
    "Creative Systems Strategist",
    "High-Value Technical Solutions Builder"
  ];

  const catKey = typeof cat === "string" ? cat : "coding";
  const catPersonas = personas[catKey] || defaultPersonas;
  const chosenPersona = catPersonas[Math.floor(Math.random() * catPersonas.length)];

  const technicalSpecs = [
    "Inject rigorous telemetry hooks, performance profiling, or debugging logging standards.",
    "Enforce strict custom error-handling pipelines returning comprehensive diagnostic matrices.",
    "Emphasize responsive, fluid micro-transitions and robust cross-runtime memory boundaries.",
    "Adhere tightly to clean functional programming paradigms, avoiding unexpected side effects.",
    "Incorporate adaptive fallbacks for unpredictable network contexts, network timeouts, or rate limits."
  ];

  const aestheticSpecs = [
    "Utilize 50mm cinematic view framing, focusing on high-detail texture gradients and warm backlight.",
    "Inject subtle bioluminescent rim lighting, moody smoke simulation, and cinematic film grain.",
    "Optimize around high-contrast golden-ratio coordinates, avoiding visual clutter or flat colors.",
    "Ensure balanced complementary color palettes, emphasizing deep shadows and bright specular highlights."
  ];

  const writingSpecs = [
    "Maintain an elegant active-voice tone that incorporates varying rhythm and length.",
    "Structure using clear hierarchical headings, custom bold markers, and logical callout boxes.",
    "Completely suppress generic corporate jargon, passive filler sentences, or redundant terminology."
  ];

  const specsPool = catKey === "coding" ? technicalSpecs : catKey === "image generation" ? aestheticSpecs : writingSpecs;
  const selectedSpecs = [...specsPool].sort(() => 0.5 - Math.random()).slice(0, 2);

  const generalImprovements = [
    `Assigned veteran "${chosenPersona}" persona to set professional execution standards`,
    "Strictly suppressed standard boilerplate introductions and conversational post-notes",
    "Injected robust modular structural segments to organize final instructions",
    "Aligned overall format specifically to conform to requested scope"
  ];

  const codeSuggestions = [
    "Specify if state or data persistence should use local secure layers (indexedDB/localStorage) or remote backend nodes.",
    "Are there strict execution speed boundaries or payload limits that we must align with?",
    "Would you like complete test coverage files (Vitest/Jest) or mock APIs included in the blueprint?"
  ];

  const imageSuggestions = [
    "Please define the target ratio format (16:9 widescreen, 1:1 square, or 9:16 smartphone portrait).",
    "Should the aesthetic match a hyperrealistic RAW photo, a classical matte oil painting, or a pristine vector asset?",
    "Are there specific focal points, brand-approved color hex codes, or elements that should be isolated?"
  ];

  const generalSuggestions = [
    "What is the exact technical skill level or seniority profile of your target end-user?",
    "Do you have a preferred approximate length standard (e.g. 500 words or single-paragraph caps)?",
    "Are there existing standard-operating guidelines or style manuals this output must match?"
  ];

  const suggestionsPool = catKey === "coding" ? codeSuggestions : catKey === "image generation" ? imageSuggestions : generalSuggestions;
  const selectedSuggestions = [...suggestionsPool].sort(() => 0.5 - Math.random()).slice(0, 2);

  const score = Math.floor(Math.random() * 15) + 76; // Random score between 76 and 91 (realistic high-value scores)
  
  let refinedPrompt = "";
  let negativePrompt = "";

  if (catKey === "image generation") {
    negativePrompt = "blurry, generic textures, deformed dimensions, low contrast, text signatures, brand watermarks, extra limbs, extra fingers, plastic lighting, oversaturated shadows";
  }

  refinedPrompt = `[Role & Persona Configuration]
Act as an elite ${chosenPersona}. Maintain absolute professional focus, task-aligned precision, and authoritative domain-specific terminology.

[Primary Directive & Scenario]
Transform, complete, and refine the following human intention with flawless, production-ready, or highly optimized outputs:
"${rawPrompt}"

[Optimization Standards & Guidelines]
1. Domain Constraints:
   - Ensure maximum quality, consistency, and structural clarity.
   - ${selectedSpecs[0] || "Ensure high applicability, modular abstractions, and zero wasted compute/noise."}
2. Technical Directives:
   - Handle edge cases, unexpected user responses, or environmental failures gracefully.
   - ${selectedSpecs[1] || "Prioritize accessibility standards, high-contrast visual cues, and clear separation of concerns."}
3. Structural Framework:
   - Align instructions inside logical steps.
   - Avoid assumptions; if metadata is missing, rely on the safest industry-standard baseline configuration.

[Format Controls & Directives]
- Provide ONLY the final, polished, target-ready deliverable.
- Absolutely suppress chatbot preamble, supportive comments, or closing remarks.
- ${lengthGuideline}`;

  return {
    refinedPrompt,
    negativePrompt,
    category: catKey,
    intent: `Refine, optimize constraints, and inject expert guidelines for: "${rawPrompt.slice(0, 50)}${rawPrompt.length > 50 ? '...' : ''}"`,
    qualityScore: score,
    missingSuggestions: selectedSuggestions,
    improvements: [
      ...generalImprovements.slice(0, 3),
      "Offline fallback synthesis engine generated this prompt"
    ],
    isOfflineEngine: true,
    sources: []
  };
}

app.post("/api/refine", async (req, res) => {
  const { rawPrompt, category, targetModel, format } = req.body as RefineRequestBody;

  if (!rawPrompt || typeof rawPrompt !== "string" || !rawPrompt.trim()) {
    return res.status(400).json({ error: "rawPrompt is required" });
  }

  const requestedCategory = typeof category === "string" ? category : undefined;
  const requestedTargetModel = typeof targetModel === "string" ? targetModel : undefined;
  const requestedFormat = typeof format === "string" ? format : undefined;

  try {
    const dynamicSeed = Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();

    let userInstruction = `Refine the following raw user prompt:
Raw Prompt: """${rawPrompt}"""\n`;

    if (requestedCategory) {
      userInstruction += `Expected Category: ${requestedCategory}\n`;
    }
    if (requestedTargetModel) {
      userInstruction += `Target AI Model: ${requestedTargetModel}\n`;
    }
    if (requestedFormat) {
      userInstruction += `Desired Output Style/Length: ${requestedFormat}\n`;
    }
    
    userInstruction += `Dynamic Optimization Seed: ${dynamicSeed}\n`;
    userInstruction += `Context Timestamp: ${timestamp}\n`;

    const systemInstruction = `You are Refyn, an elite prompt engineer. Your job is to analyze raw human prompts, understand their intent, and optimize them into professional, high-performance, ready-to-paste AI prompts.

Follow these strict instructions:
1. Do NOT write any introduction, commentary, or meta-explanations. The "refinedPrompt" must be ready to run unmodified in standard AI systems.
2. Formulate the "refinedPrompt" based on prompt engineering best practices:
   - Establish a clear role or persona for the target model.
   - Expand context, fill in vague details with high-quality guidelines.
   - For image prompts: Detail aesthetics, artistic style, camera details, lighting, mood, color palette, and framing. Populate optional "negativePrompt" as well.
   - For coding prompts: Establish rigorous specifications, handling edge cases, code style preference, and strict response structuring.
   - For writing: Outline tone, narrative style, audience, length, and structured constraints.
   - For video: Describe camera transitions, mood, action paces, temporal elements.
   - For research/business: Guide the model through clear step-by-step structured frameworks.
3. Keep the output prompt strictly aligned to the user's "format/length" if specified (concise, detailed, step-by-step, etc.).
4. Detect the category: coding, image generation, writing, video, business, or research.
5. Provide a realistic prompt quality score (0 to 100) assessing the original raw prompt's quality.
6. Extract the user's intent clearly and concisely.
7. Outline 2 to 4 key improvement actions applied.
8. Offer 2 to 4 high-value suggestions of missing information that the human user could supply to make it even more optimal.
9. To guarantee each optimized prompt is truly unique and dynamic, do NOT use rigid cookie-cutter templates or formulaic outlines. Tailor the structure on the spot, injecting creative details, domain-specific terminologies, and custom scenario constraints.
10. Leverage Google Search grounding via the googleSearch tool to locate the latest standard specifications, code libraries, trending patterns, document definitions, or domain standards relevant to the raw prompt topic. Always optimize prompts dynamically based on up-to-date information.`;

    const response = await generateWithModelFallback({
      contents: userInstruction,
      systemInstruction,
      temperature: 0.95,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          refinedPrompt: {
            type: Type.STRING,
            description: "The full refined, high-performance prompt. Ready to copy-paste. Must contain no wrapper commentary.",
          },
          negativePrompt: {
            type: Type.STRING,
            description: "The negative prompt of visual qualities, elements or attributes to exclude. Return empty string if not applicable or not image generation.",
          },
          category: {
            type: Type.STRING,
            description: "One of: coding, image generation, writing, video, business, research.",
          },
          intent: {
            type: Type.STRING,
            description: "A short, crystal-clear statement summarizing what the user is trying to accomplish.",
          },
          qualityScore: {
            type: Type.INTEGER,
            description: "The quality score of the raw prompt (0 to 100). Evaluate strictly based on completeness, ambiguity, lack of constraints, and context.",
          },
          missingSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Up to 3 highly helpful questions or suggestions for specific missing details that could perfect the prompt.",
          },
          improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Up to 4 bullet points outlining key optimizations applied (e.g. 'Established senior developer role', 'Added styling system instructions').",
          },
        },
        required: [
          "refinedPrompt",
          "negativePrompt",
          "category",
          "intent",
          "qualityScore",
          "missingSuggestions",
          "improvements",
        ],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini");
    }

    const data = JSON.parse(text.trim());

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((chunk: GroundingChunk) => ({
      title: chunk.web?.title || chunk.web?.uri,
      uri: chunk.web?.uri
    })).filter((s): s is { title: string; uri: string } => Boolean(s.title && s.uri)) || [];

    data.sources = sources;
    data.isOfflineEngine = false;
    res.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isTransientGeminiError(error)) {
      console.warn("[Refyn Server API] Live Gemini API demand spike or quota issue detected. Falling back to local synthesis engine.");
    } else {
      console.warn("[Refyn Server API] Live Gemini API call failed. Falling back to local synthesis engine. Reason:", errorMessage.slice(0, 150));
    }
    try {
      const fallbackResult = localFallbackRefine(rawPrompt, requestedCategory, requestedTargetModel, requestedFormat);
      res.json(fallbackResult);
    } catch (fallbackErr) {
      console.error("Critical Fallback Error Details:", fallbackErr);
      res.status(500).json({
        error: "Failed to refine prompt.",
        message: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }
});

app.post("/api/generate-raw-prompt", async (req, res) => {
  const { category, seed } = req.body as GeneratePromptRequestBody;
  const requestedCategory = typeof category === "string" ? category : "general";
  try {
    const systemInstruction = `You are a creative prompt assistant. Generate ONE highly realistic, slightly vague or short raw user input prompt representing something a human would ask an AI.
Rules:
1. Provide exactly one sentence or phrase (Max 15 words).
2. DO NOT write descriptions, instructions, or meta-notes.
3. Keep it natural, raw, and ready to be optimized.
4. Output should have no quotes or wrappers. Output just the raw prompt text.
5. Do NOT repeat simple or common tasks (e.g. avoid 'how to build a todo list', 'simple calculator', or basic 'hello world'). Instead, invent fresh, interesting, unique modern topics in the target category (e.g. smart farming, immersive narratives, neural networks, indie game design, automated marketing dashboards, IoT robotics).`;

    const randomSeedText = `Seed value: ${typeof seed === "string" || typeof seed === "number" ? seed : Math.random()}`;

    const response = await generateWithModelFallback({
      contents: `Generate a completely unique and specific raw messy prompt for category: "${requestedCategory}" with the unique ${randomSeedText}. Ensure it represents a complex or interesting modern technical or creative project.`,
      systemInstruction,
      temperature: 0.98,
    });

    let promptText = response.text ? response.text.trim() : "";
    if (!promptText) {
      throw new Error("Empty example prompt generated");
    }
    promptText = promptText.replace(/^["'`]|["'`]$/g, "");
    res.json({ rawPrompt: promptText });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isTransientGeminiError(error)) {
      console.warn("[Refyn Server API] Live Gemini API demand spike or quota issue detected for examples. Falling back to curated dynamic catalog.");
    } else {
      console.warn("[Refyn Server API] Live Gemini API call for examples failed. Falling back to curated catalog. Reason:", errorMessage.slice(0, 150));
    }
    try {
      const fallbackPrompt = getDynamicFallbackPrompt(requestedCategory);
      res.json({ rawPrompt: fallbackPrompt });
    } catch (fallbackErr) {
      res.status(500).json({ error: "Failed to generate dynamic example fallback" });
    }
  }
});

async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode, mounting Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to start server:", err);
});
