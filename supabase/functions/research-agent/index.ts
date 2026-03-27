import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Google AI Studio (FREE tier: 15 RPM, 1M TPM)
const GOOGLE_AI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GOOGLE_FAST = "gemini-2.0-flash-lite";
const GOOGLE_BALANCED = "gemini-2.0-flash";
const GOOGLE_LONGFORM = "gemini-2.0-flash";

// Groq backup (FREE tier: 6K TPM)
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_FAST = "llama-3.1-8b-instant";
const GROQ_BALANCED = "llama-3.3-70b-versatile";

// Hugging Face backup (FREE tier)
const HF_API_URL = "https://router.huggingface.co/novita/v3/openai/chat/completions";
const HF_MODEL = "deepseek-ai/DeepSeek-V3-0324";

const STAGES = [
  "literature", "gaps", "hypotheses", "experiment", "paper", "refine",
  "peer-review", "competing-hypotheses", "research-gaps", "research-proposal", "debate",
] as const;
type Stage = (typeof STAGES)[number];
const JSON_STAGES = new Set<Stage>([
  "literature", "gaps", "hypotheses", "experiment", "paper", "refine",
  "peer-review", "competing-hypotheses", "research-gaps", "research-proposal",
]);

const parseJsonContent = (content: string) => {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
  } catch {
    return { raw: content };
  }
};

const buildFallbackPaper = (query: string, context: any) => {
  const literature = context?.literature;
  const references = (literature?.papers || []).slice(0, 12).map((paper: any) => ({
    text: `${paper.authors || "Unknown author"} (${paper.year || "n.d."}). ${paper.title || "Untitled"}. ${paper.journal || "Unknown journal"}.${paper.doi ? ` https://doi.org/${paper.doi}` : ""}`.trim(),
  }));
  return {
    title: `Preliminary research brief: ${query}`,
    abstract: "This draft was generated as a fallback because the AI provider was temporarily unavailable.",
    introduction: `This project investigates: ${query}. The system used a fallback draft.`,
    literatureReview: literature?.synthesis || "Literature review temporarily unavailable.",
    methods: context?.experiment?.methodology || "Methods temporarily unavailable.",
    results: context?.experiment?.results?.keyFinding || "Results temporarily unavailable.",
    discussion: "Discussion temporarily unavailable.",
    conclusion: "Fallback draft — retry for full paper.",
    references: references.length > 0 ? references : [{ text: "References will populate after retry." }],
  };
};

const buildFallbackResult = (stage: Stage, query: string, context: any) => {
  switch (stage) {
    case "literature":
      return { papers: [], concepts: [], synthesis: `Literature synthesis temporarily unavailable for "${query}". Please retry.` };
    case "gaps":
      return { gaps: [{ title: "Gap analysis paused", description: "Temporarily unavailable.", relevance: "Retry later." }] };
    case "hypotheses":
    case "competing-hypotheses":
      return {
        hypotheses: [{ type: "primary", title: `Provisional hypothesis: ${query}`, description: "Temporarily unavailable.", predictedOutcome: "Pending retry.", approach: "Retry.", pValue: 0.05, effectSize: 0.2, verdict: "weak" }],
        noveltyScore: 0, closestWork: "Unavailable", noveltyDifference: "Pending retry.",
      };
    case "experiment":
      return {
        methodology: "Temporarily unavailable.", dataDescription: "Temporarily unavailable.",
        results: { pValue: 0.05, effectSize: 0.2, sampleSize: 0, keyFinding: "Pending retry.", secondaryFindings: [], xAxisLabel: "Pending", yAxisLabel: "Pending", figureTitle: "Pending" },
        figures: [],
      };
    case "paper": case "refine":
      return context?.paper || buildFallbackPaper(query, context);
    case "peer-review":
      return { strengths: ["State preserved."], weaknesses: ["Review unavailable."], suggestions: [{ text: "Retry shortly.", section: "discussion" }], overallScore: 5, verdict: "Postponed." };
    case "research-gaps":
      return { gaps: [{ title: "Delayed", description: "Unavailable.", type: "under-explored", suggestions: [{ title: "Retry", description: "Retry shortly.", hypothesisDraft: "Pending.", suggestedIV: "Pending", suggestedDV: "Pending", controls: "Pending", datasetRecommendation: "Pending" }] }] };
    case "research-proposal":
      return { proposal: "Temporarily unavailable." };
    case "debate":
      return { raw: "Debate temporarily unavailable." };
  }
};

const getStageConfig = (stage: Stage, query: string, context: any) => {
  const configs: Record<Stage, { model: string; maxTokens: number; systemPrompt: string; userPrompt: string }> = {
    literature: {
      model: GOOGLE_BALANCED, maxTokens: 2600,
      systemPrompt: "You are a scientific literature review agent. Return concise structured JSON with real papers when possible. Never invent DOIs. Required keys: papers, concepts, synthesis.",
      userPrompt: `Research question: "${query}"\nReturn 8-10 relevant papers, 5 concepts, and a concise synthesis.`,
    },
    gaps: {
      model: GOOGLE_FAST, maxTokens: 1400,
      systemPrompt: "Identify 4-5 specific research gaps from the provided literature context. Return valid JSON with key: gaps.",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
    },
    hypotheses: {
      model: GOOGLE_FAST, maxTokens: 1400,
      systemPrompt: "Generate 3 novel, testable hypotheses. Return valid JSON with key: hypotheses.",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
    },
    experiment: {
      model: GOOGLE_FAST, maxTokens: 2000,
      systemPrompt: "Design a concise rigorous experiment and return valid JSON with keys: methodology, dataDescription, results, figures.",
      userPrompt: `Research question: "${query}"\nHypothesis: ${JSON.stringify(context?.hypothesis)}`,
    },
    paper: {
      model: GOOGLE_LONGFORM, maxTokens: 7000,
      systemPrompt: "Write a publication-style research paper draft. Return valid JSON with keys: title, abstract, introduction, literatureReview, methods, results, discussion, conclusion, references. Concise but complete. Do not invent DOIs.",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}\nWrite a complete structured draft.`,
    },
    refine: {
      model: GOOGLE_LONGFORM, maxTokens: 5000,
      systemPrompt: "Update the provided paper based on the user request. Return the complete paper as valid JSON with all required keys.",
      userPrompt: `User request: "${query}"\nCurrent paper: ${JSON.stringify(context?.paper)}`,
    },
    "peer-review": {
      model: GOOGLE_FAST, maxTokens: 1400,
      systemPrompt: "Review the paper critically and return valid JSON with keys: strengths, weaknesses, suggestions, overallScore, verdict.",
      userPrompt: `Paper to review: ${JSON.stringify(context?.paper)}`,
    },
    "competing-hypotheses": {
      model: GOOGLE_FAST, maxTokens: 1600,
      systemPrompt: "Generate exactly 3 competing hypotheses (primary, alternative, null). Return valid JSON with keys: hypotheses, noveltyScore, closestWork, noveltyDifference.",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
    },
    "research-gaps": {
      model: GOOGLE_FAST, maxTokens: 2000,
      systemPrompt: "Identify 4-5 post-paper research gaps and next steps. Return valid JSON with key: gaps.",
      userPrompt: `Research question: "${query}"\nPaper context: ${JSON.stringify(context)}`,
    },
    "research-proposal": {
      model: GOOGLE_FAST, maxTokens: 2200,
      systemPrompt: "Write a concise research proposal and return valid JSON with key: proposal.",
      userPrompt: `Gap: ${JSON.stringify(context?.gap)}\nSuggestion: ${JSON.stringify(context?.suggestion)}`,
    },
    debate: {
      model: GOOGLE_FAST, maxTokens: 1200,
      systemPrompt: context?.systemPrompt || "You are a scientific debater.",
      userPrompt: `${(context?.history || []).map((m: any) => m.content).join("\n\n")}\n\nNow respond in your role. Research question: "${query}"`,
    },
  };
  return configs[stage];
};

// Call Google AI Studio (Gemini) directly — FREE
async function callGoogleAI(apiKey: string, model: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const systemMsg = messages.find((m: any) => m.role === "system")?.content || "";
    const userMsg = messages.find((m: any) => m.role === "user")?.content || "";
    
    const url = `${GOOGLE_AI_URL}/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemMsg }] },
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.log(`Google AI failed (${response.status}): ${t.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.log("Google AI error:", err);
    return null;
  }
}

// Call Groq as backup — FREE but limited
async function callGroq(apiKey: string, model: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const groqModel = model === GOOGLE_LONGFORM || model === GOOGLE_BALANCED ? GROQ_BALANCED : GROQ_FAST;
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: groqModel, messages, max_tokens: Math.min(maxTokens, 8000), temperature: 0.3 }),
    });
    if (!response.ok) {
      const t = await response.text();
      console.error(`Groq failed (${response.status}): ${t.slice(0, 200)}`);
      return null;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("Groq error:", err);
    return null;
  }
}

// Call Hugging Face as 3rd backup — FREE
async function callHuggingFace(apiKey: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: HF_MODEL, messages, max_tokens: Math.min(maxTokens, 4000), temperature: 0.3 }),
    });
    if (!response.ok) {
      const t = await response.text();
      console.error(`HuggingFace failed (${response.status}): ${t.slice(0, 200)}`);
      return null;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("HuggingFace error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const stage = body?.stage as Stage;
    const context = body?.context;

    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!stage || !STAGES.includes(stage)) {
      return new Response(JSON.stringify({ error: "valid stage is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    if (!GOOGLE_AI_API_KEY && !GROQ_API_KEY && !HUGGINGFACE_API_KEY) throw new Error("No AI API keys configured");

    const { model, maxTokens, systemPrompt, userPrompt } = getStageConfig(stage, query, context);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let aiResult: string | null = null;
    let usedModel = model;

    // 1st: Hugging Face / DeepSeek-V3 (FREE, good quality, reliable)
    if (HUGGINGFACE_API_KEY) {
      aiResult = await callHuggingFace(HUGGINGFACE_API_KEY, messages, maxTokens);
      if (aiResult) usedModel = "hf/deepseek-v3";
    }

    // 2nd: Google AI Studio (FREE, but quota may be exhausted)
    if (!aiResult && GOOGLE_AI_API_KEY) {
      console.log("HuggingFace unavailable, trying Google AI...");
      aiResult = await callGoogleAI(GOOGLE_AI_API_KEY, model, messages, maxTokens);
      if (aiResult) usedModel = `google/${model}`;
    }

    // 3rd: Groq (FREE, fast but very limited TPM)
    if (!aiResult && GROQ_API_KEY) {
      console.log("Google AI unavailable, trying Groq...");
      aiResult = await callGroq(GROQ_API_KEY, model, messages, maxTokens);
      if (aiResult) usedModel = "groq/llama";
    }

    // Both failed → structured fallback
    if (!aiResult) {
      return new Response(
        JSON.stringify({ stage, model: usedModel, rateLimited: true, result: buildFallbackResult(stage, query, context) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON_STAGES.has(stage) ? parseJsonContent(aiResult) : { raw: aiResult };
    const result = parsed && typeof parsed === "object" && !("raw" in parsed && JSON_STAGES.has(stage))
      ? parsed
      : buildFallbackResult(stage, query, context);

    return new Response(JSON.stringify({ stage, model: usedModel, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("research-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
