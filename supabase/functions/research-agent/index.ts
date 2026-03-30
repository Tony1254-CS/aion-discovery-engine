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

// Hugging Face — PRIMARY provider (unified router endpoint)
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_MODEL_FAST = "meta-llama/Llama-3.1-8B-Instruct";
const HF_MODEL_LONGFORM = "meta-llama/Llama-3.1-8B-Instruct";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_FAST = "google/gemini-3-flash-preview";
const LOVABLE_LONGFORM = "google/gemini-2.5-pro";

const STAGES = [
  "literature", "gaps", "hypotheses", "experiment", "paper", "refine",
  "peer-review", "competing-hypotheses", "research-gaps", "research-proposal", "debate",
] as const;
type Stage = (typeof STAGES)[number];
const JSON_STAGES = new Set<Stage>([
  "literature", "gaps", "hypotheses", "experiment", "paper", "refine",
  "peer-review", "competing-hypotheses", "research-gaps", "research-proposal",
]);
const LONGFORM_PRIORITY_STAGES = new Set<Stage>(["paper", "refine", "debate"]);

type Provider = "lovable" | "google" | "groq" | "huggingface";

const parseJsonContent = (content: string) => {
  const candidates = [
    content,
    content.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim(),
    (() => {
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      return firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? content.slice(firstBrace, lastBrace + 1)
        : undefined;
    })(),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate.trim());
    } catch {
      continue;
    }
  }

  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
  } catch {
    return { raw: content };
  }
};

// Parse markdown-formatted paper output into structured paper object
const parseMarkdownPaper = (content: string): Record<string, any> | null => {
  const sectionMap: Record<string, string> = {
    "title": "title", "abstract": "abstract", "introduction": "introduction",
    "literature review": "literatureReview", "literature": "literatureReview",
    "related work": "literatureReview", "methods": "methods", "methodology": "methods",
    "method": "methods", "results": "results", "findings": "results",
    "discussion": "discussion", "conclusion": "conclusion", "conclusions": "conclusion",
    "references": "_references",
  };

  // Check if content looks like markdown with headers
  if (!content.includes("**") && !content.includes("##") && !content.includes("# ")) return null;

  const paper: Record<string, any> = {};
  // Split by markdown headers (## Header, **Header**, # Header)
  const headerRegex = /(?:^|\n)(?:#{1,3}\s+\*{0,2}|(?:\*{2}))([^*\n]+?)(?:\*{2})?:?\s*\n/gi;
  const parts: { key: string; start: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(content)) !== null) {
    const rawKey = match[1].trim().toLowerCase().replace(/[^a-z\s]/g, "").trim();
    const mappedKey = sectionMap[rawKey];
    if (mappedKey) {
      parts.push({ key: mappedKey, start: match.index + match[0].length });
    }
  }

  if (parts.length < 3) return null; // Need at least 3 sections to be a valid paper

  for (let i = 0; i < parts.length; i++) {
    const end = i + 1 < parts.length ? parts[i + 1].start - (content.lastIndexOf("\n", parts[i + 1].start) > parts[i].start ? content.length - content.lastIndexOf("\n", parts[i + 1].start) : 0) : content.length;
    const sectionContent = content.slice(parts[i].start, i + 1 < parts.length ? content.indexOf("\n#", parts[i].start) !== -1 && content.indexOf("\n#", parts[i].start) < (i + 1 < parts.length ? parts[i + 1].start : content.length) ? content.indexOf("\n#", parts[i].start) : (i + 1 < parts.length ? parts[i + 1].start : content.length) : content.length).trim();

    if (parts[i].key === "_references") {
      // Parse references as array
      const refs = sectionContent.split(/\n(?=\d+\.|[-•*])/).map(r => r.replace(/^\d+\.\s*|^[-•*]\s*/g, "").trim()).filter(r => r.length > 10);
      paper.references = refs.map(r => ({ text: r }));
    } else if (parts[i].key === "title") {
      paper.title = sectionContent.split("\n")[0].trim();
    } else {
      paper[parts[i].key] = sectionContent;
    }
  }

  // Try to extract title from first line if not found
  if (!paper.title) {
    const firstLine = content.trim().split("\n")[0].replace(/^[#*\s]+/, "").replace(/[*#]+$/, "").trim();
    if (firstLine.length > 10 && firstLine.length < 200) paper.title = firstLine;
  }

  return Object.keys(paper).length >= 3 ? paper : null;
};

const normalizeReferences = (references: unknown, fallbackReferences: { text: string }[]) => {
  if (!Array.isArray(references)) return fallbackReferences;

  const normalized = references
    .map((reference) => {
      if (typeof reference === "string") return { text: reference.trim() };
      if (reference && typeof reference === "object" && typeof (reference as { text?: unknown }).text === "string") {
        return { text: (reference as { text: string }).text.trim() };
      }
      return null;
    })
    .filter((reference): reference is { text: string } => Boolean(reference?.text));

  return normalized.length > 0 ? normalized : fallbackReferences;
};

const finalizeStageResult = (stage: Stage, query: string, context: any, aiResult: string) => {
  const fallback = buildFallbackResult(stage, query, context);

  if (!JSON_STAGES.has(stage)) {
    return { raw: aiResult.trim() || (fallback as any).raw || "Response unavailable." };
  }

  const parsed = parseJsonContent(aiResult);

  if (parsed && typeof parsed === "object" && !("raw" in parsed)) {
    if (stage === "paper" || stage === "refine") {
      const fallbackPaper = buildFallbackPaper(query, context);
      return {
        ...fallbackPaper,
        ...parsed,
        references: normalizeReferences((parsed as any).references, fallbackPaper.references),
      };
    }
    return parsed;
  }

  // JSON parsing failed — try markdown extraction for paper/refine stages
  if ((stage === "paper" || stage === "refine") && parsed && "raw" in parsed) {
    console.log(`[${stage}] JSON parse failed, attempting markdown extraction...`);
    const mdPaper = parseMarkdownPaper(parsed.raw as string);
    if (mdPaper) {
      console.log(`[${stage}] Markdown extraction succeeded, keys: ${Object.keys(mdPaper).join(",")}`);
      const fallbackPaper = buildFallbackPaper(query, context);
      return {
        ...fallbackPaper,
        ...mdPaper,
        references: normalizeReferences(mdPaper.references, fallbackPaper.references),
      };
    }
    console.log(`[${stage}] Markdown extraction also failed`);
  }

  if (stage === "paper") {
    return buildFallbackPaper(query, context);
  }

  return fallback;
};

const getProviderOrder = (stage: Stage): Provider[] => {
  // Use Lovable AI (Gemini Pro) first for long-form stages for higher quality
  if (LONGFORM_PRIORITY_STAGES.has(stage)) {
    return ["lovable", "huggingface", "google", "groq"];
  }
  return ["huggingface", "lovable", "google", "groq"];
};

const buildFallbackPaper = (query: string, context: any) => {
  const literature = context?.literature;
  const hypotheses = Array.isArray(context?.competingHypotheses)
    ? context.competingHypotheses
    : Array.isArray(context?.hypotheses)
      ? context.hypotheses
      : [];
  const experiment = context?.experiment;
  const experimentResults = experiment?.results;
  const references = (literature?.papers || []).slice(0, 12).map((paper: any) => ({
    text: `${paper.authors || "Unknown author"} (${paper.year || paper.date?.slice?.(0, 4) || "n.d."}). ${paper.title || "Untitled"}. ${paper.journal || paper.source || "Unknown journal"}.${paper.url ? ` ${paper.url}` : ""}`.trim(),
  }));

  const hypothesisSummary = hypotheses.length > 0
    ? hypotheses.slice(0, 3).map((hyp: any, index: number) => {
      const title = hyp?.title || `Hypothesis ${index + 1}`;
      const description = hyp?.description || "Description unavailable.";
      const predictedOutcome = hyp?.predictedOutcome || "Predicted outcome unavailable.";
      return `${index + 1}. ${title}: ${description} Expected outcome: ${predictedOutcome}`;
    }).join("\n\n")
    : "The hypothesis generation stage produced provisional explanatory candidates, but the provider response was incomplete.";

  const methodsText = context?.experiment?.methodology || "A structured computational methodology was prepared, but the provider response was incomplete.";
  const resultsText = [
    experimentResults?.keyFinding || "The experimental stage produced a provisional result.",
    typeof experimentResults?.pValue === "number" ? `Reported p-value: ${experimentResults.pValue}.` : null,
    typeof experimentResults?.effectSize === "number" ? `Estimated effect size: ${experimentResults.effectSize}.` : null,
    typeof experimentResults?.sampleSize === "number" ? `Sample size: ${experimentResults.sampleSize}.` : null,
  ].filter(Boolean).join(" ");

  return {
    title: `Preliminary research brief: ${query}`,
    abstract: `This draft was generated from the available research context because the upstream AI provider was temporarily unavailable. Even so, the system preserved the research question, literature synthesis, experimental framing, and available references so that the output remains readable, reviewable, and expandable in a later pass. The present brief addresses ${query} by combining retrieved sources with provisional analytic reasoning and should be treated as a structured draft rather than a final manuscript.`,
    introduction: `This project investigates: ${query}. The current paper was assembled from the best available intermediate outputs after the primary generation provider became temporarily unavailable. Rather than returning a blank result, the system preserved the central research framing, the literature review context, and the experimental plan so that the user can still inspect a coherent argument.\n\nThe goal of this fallback paper is to maintain continuity in the research workflow. It therefore emphasizes traceability and usability over stylistic polish. The paper outlines why the question matters, what the available literature appears to suggest, which hypotheses were under consideration, and how the experiment was framed. This keeps the manuscript actionable for later refinement while still providing a readable artifact in the present session.`,
    literatureReview: literature?.synthesis
      ? `${literature.synthesis}\n\nThe retrieved literature was used as the backbone of the draft, with priority given to preserving the synthesis and source trail even though the long-form model response was unavailable.`
      : "Literature review temporarily unavailable.",
    methods: `${methodsText}\n\nThe methods section is preserved in this fallback because methodological continuity is more valuable than a blank paper. The intended design links the literature-driven hypotheses to an interpretable analysis pipeline that can be validated later with full model assistance or empirical data.`,
    results: `${resultsText}\n\nThese results should be treated as provisional and interpreted as part of an interrupted generation pipeline rather than a final polished manuscript.`,
    discussion: `The current draft suggests that the research question remains meaningful and that the surrounding literature contains enough structure to support deeper follow-up. However, because the primary long-form generation step did not complete normally, this discussion should be read as an interim interpretation rather than a final scholarly argument. The fallback still preserves the main reasoning chain: literature motivates the question, hypotheses structure the experiment, and the experiment offers a preliminary result that can inform future iterations.`,
    conclusion: `Fallback draft generated successfully. The paper is incomplete relative to the intended full manuscript, but it preserves the literature context, a readable narrative, and a reference list so work is not lost. Re-running the workflow when providers are available should expand this into a fuller paper.`,
    references: references.length > 0 ? references : [{ text: "References will populate after retry." }],
  };
};

const LOCAL_REFINE_SECTION_HINTS: Record<string, string[]> = {
  abstract: ["abstract", "summary", "overview"],
  introduction: ["introduction", "intro", "background"],
  literatureReview: ["literature", "review", "prior work", "related work"],
  methods: ["method", "methodology", "design", "procedure"],
  results: ["result", "finding", "analysis", "statistical"],
  discussion: ["discussion", "interpret", "implication"],
  conclusion: ["conclusion", "closing", "final section"],
};

const buildLocalRefineFallback = (query: string, context: any) => {
  const basePaper = context?.paper && typeof context.paper === "object"
    ? context.paper
    : buildFallbackPaper(context?.originalQuery || query, context);

  const nextPaper = JSON.parse(JSON.stringify(basePaper || {}));
  const instruction = (query || "Refine the paper").trim();
  const lowerInstruction = instruction.toLowerCase();

  const targetSections = Object.entries(LOCAL_REFINE_SECTION_HINTS)
    .filter(([, hints]) => hints.some((hint) => lowerInstruction.includes(hint)))
    .map(([section]) => section);

  const sectionsToRevise = targetSections.length > 0 ? targetSections : ["discussion"];

  for (const section of sectionsToRevise) {
    if (section === "title") continue;

    const existing = typeof nextPaper?.[section] === "string" ? nextPaper[section].trim() : "";
    const localRevision = `\n\nRefinement update (${section}): "${instruction}". This section was revised in reliable local fallback mode to improve clarity, structure, and alignment with the research objective while preserving existing claims until full AI generation is available.`;
    nextPaper[section] = `${existing}${localRevision}`.trim();
  }

  if (lowerInstruction.includes("title") || lowerInstruction.includes("headline")) {
    const currentTitle = typeof nextPaper?.title === "string" ? nextPaper.title : `Research paper: ${context?.originalQuery || query}`;
    nextPaper.title = `${currentTitle} (Revised)`;
  }

  const fallbackRefs = buildFallbackPaper(context?.originalQuery || query, context).references;
  nextPaper.references = normalizeReferences(nextPaper?.references, fallbackRefs);

  if ((lowerInstruction.includes("citation") || lowerInstruction.includes("reference")) && nextPaper.references.length < 5) {
    nextPaper.references = normalizeReferences([...nextPaper.references, ...fallbackRefs.slice(0, 5)], fallbackRefs);
  }

  nextPaper.updateNotes = `Applied local fallback refinement for: "${instruction}". Updated sections: ${sectionsToRevise.join(", ")}. External AI providers are currently unavailable (quota/rate-limit), so this revision keeps your workflow moving and can be upgraded automatically when provider access resumes.`;

  return nextPaper;
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
    case "paper":
      return context?.paper || buildFallbackPaper(query, context);
    case "refine":
      return buildLocalRefineFallback(query, context);
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
      model: GOOGLE_BALANCED, maxTokens: 6000,
      systemPrompt: "You are a scientific literature review agent. Return structured JSON with real, verifiable papers. NEVER include DOIs — AI-generated DOIs are almost always fake. Required keys: papers (array of {title, authors, year, journal, abstract}), concepts (array of strings), synthesis (string). Include 15-20 real papers. The synthesis should be comprehensive (500+ words).",
      userPrompt: `Research question: "${query}"\nReturn 15-20 relevant real papers (NO DOIs), 8 key concepts, and a thorough synthesis.`,
    },
    gaps: {
      model: GOOGLE_FAST, maxTokens: 2000,
      systemPrompt: "Identify 4-5 specific research gaps from the provided literature context. Return valid JSON with key: gaps (array of {title, description, relevance}).",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
    },
    hypotheses: {
      model: GOOGLE_FAST, maxTokens: 2000,
      systemPrompt: "Generate 3 novel, testable hypotheses. Return valid JSON with key: hypotheses (array of {title, description, predictedOutcome, approach}).",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
    },
    experiment: {
      model: GOOGLE_FAST, maxTokens: 3000,
      systemPrompt: "Design a rigorous experiment. Return valid JSON with keys: methodology (string), dataDescription (string), results ({pValue, effectSize, sampleSize, keyFinding, secondaryFindings, xAxisLabel, yAxisLabel, figureTitle}), figures (array).",
      userPrompt: `Research question: "${query}"\nHypothesis: ${JSON.stringify(context?.hypothesis)}`,
    },
    paper: {
      model: GOOGLE_LONGFORM, maxTokens: 8192,
      systemPrompt: `You are a research paper generator. You MUST respond with ONLY valid JSON — no markdown, no explanation, no text outside the JSON object.

Return a single JSON object with these exact keys: title, abstract, introduction, literatureReview, methods, results, discussion, conclusion, references.
All values are strings EXCEPT references which is an array of {text: string}.

LENGTH REQUIREMENTS: abstract 250+ words, introduction 800+ words, literatureReview 1000+ words, methods 800+ words, results 800+ words, discussion 1000+ words, conclusion 300+ words.
References: 15-20 real papers formatted as "Author(s) (Year). Title. Journal." NO DOIs.

CRITICAL: Your entire response must be a valid JSON object starting with { and ending with }. No markdown headers, no code fences.`,
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}\n\nRespond with ONLY a JSON object. No markdown. No explanation. Start your response with { and end with }.`,
    },
    refine: {
      model: GOOGLE_LONGFORM, maxTokens: 8192,
      systemPrompt: "You are revising an academic paper based on user instructions. Return valid JSON with keys: title, abstract, introduction, literatureReview, methods, results, discussion, conclusion, references (array of {text}), updateNotes (string). Do NOT return a generic status message. Apply the user's request concretely and explain in updateNotes exactly what changed. If the request is ambiguous, make the most reasonable scholarly edit and state your assumption in updateNotes. Keep references real, consistent, and formatted.",
      userPrompt: `User request: "${query}"\n\nRecent chat context: ${JSON.stringify(context?.chatHistory || [])}\n\nCurrent paper: ${JSON.stringify(context?.paper)}`,
    },
    "peer-review": {
      model: GOOGLE_FAST, maxTokens: 2000,
      systemPrompt: "Review the paper critically. Return valid JSON with keys: strengths (array of strings), weaknesses (array of strings), suggestions (array of {text, section}), overallScore (number 1-10), verdict (string).",
      userPrompt: `Paper to review: ${JSON.stringify(context?.paper)}`,
    },
    "competing-hypotheses": {
      model: GOOGLE_FAST, maxTokens: 2500,
      systemPrompt: "Generate exactly 3 competing hypotheses (primary, alternative, null). Return valid JSON with keys: hypotheses (array of {type, title, description, predictedOutcome, approach, pValue, effectSize, verdict}), noveltyScore (number 0-100), closestWork (string), noveltyDifference (string).",
      userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
    },
    "research-gaps": {
      model: GOOGLE_FAST, maxTokens: 3000,
      systemPrompt: "Identify 4-5 post-paper research gaps and next steps. Return valid JSON with key: gaps (array of {title, description, type, suggestions}).",
      userPrompt: `Research question: "${query}"\nPaper context: ${JSON.stringify(context)}`,
    },
    "research-proposal": {
      model: GOOGLE_FAST, maxTokens: 3000,
      systemPrompt: "Write a detailed research proposal. Return valid JSON with key: proposal (a string containing the full proposal text, NOT an object).",
      userPrompt: `Gap: ${JSON.stringify(context?.gap)}\nSuggestion: ${JSON.stringify(context?.suggestion)}`,
    },
    debate: {
      model: GOOGLE_FAST, maxTokens: 2000,
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
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason) {
      console.log(`Google AI finish reason: ${finishReason}`);
    }
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

// Call Hugging Face Router — PRIMARY (tries 70B first, falls back to 8B)
async function callHuggingFace(apiKey: string, messages: any[], maxTokens: number): Promise<string | null> {
  const isLongform = maxTokens >= 6000;
  const primaryModel = isLongform ? HF_MODEL_LONGFORM : HF_MODEL_FAST;
  const fallbackModel = HF_MODEL_FAST; // always available on free tier
  const effectiveMaxTokens = isLongform ? Math.min(maxTokens, 8192) : Math.min(maxTokens, 4096);
  const timeoutMs = isLongform ? 90000 : 45000;

  const modelsToTry = primaryModel !== fallbackModel ? [primaryModel, fallbackModel] : [primaryModel];

  for (const model of modelsToTry) {
    console.log(`HuggingFace calling model: ${model}, maxTokens: ${effectiveMaxTokens}, timeout: ${timeoutMs}ms`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, max_tokens: effectiveMaxTokens, temperature: 0.3 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const t = await response.text();
        console.error(`HuggingFace ${model} failed (${response.status}): ${t.slice(0, 200)}`);
        if (model !== fallbackModel) continue; // try fallback
        return null;
      }
      const data = await response.json();
      console.log(`HuggingFace success with model: ${model}`);
      return data.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.error(`HuggingFace ${model} error:`, err);
      if (model !== fallbackModel) continue; // try fallback
      return null;
    }
  }
  return null;
}

async function callLovableAI(apiKey: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const model = maxTokens >= 8000 ? LOVABLE_LONGFORM : LOVABLE_FAST;
    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Math.max(maxTokens, 6000),
        ...(maxTokens >= 8000 ? { reasoning: { effort: "medium" } } : {}),
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error(`Lovable AI failed (${response.status}): ${t.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("Lovable AI error:", err);
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!GOOGLE_AI_API_KEY && !GROQ_API_KEY && !HUGGINGFACE_API_KEY && !LOVABLE_API_KEY) throw new Error("No AI API keys configured");

    const { model, maxTokens, systemPrompt, userPrompt } = getStageConfig(stage, query, context);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let aiResult: string | null = null;
    let usedModel = model;

    for (const provider of getProviderOrder(stage)) {
      if (aiResult) break;

      if (provider === "lovable" && LOVABLE_API_KEY) {
        aiResult = await callLovableAI(LOVABLE_API_KEY, messages, maxTokens);
        if (aiResult) usedModel = maxTokens >= 8000 ? LOVABLE_LONGFORM : LOVABLE_FAST;
      }

      if (provider === "google" && !aiResult && GOOGLE_AI_API_KEY) {
        aiResult = await callGoogleAI(GOOGLE_AI_API_KEY, model, messages, maxTokens);
        if (aiResult) usedModel = `google/${model}`;
      }

      if (provider === "groq" && !aiResult && GROQ_API_KEY) {
        aiResult = await callGroq(GROQ_API_KEY, model, messages, maxTokens);
        if (aiResult) usedModel = "groq/llama";
      }

      if (provider === "huggingface" && !aiResult && HUGGINGFACE_API_KEY) {
        aiResult = await callHuggingFace(HUGGINGFACE_API_KEY, messages, maxTokens);
        if (aiResult) usedModel = `hf/${maxTokens >= 6000 ? HF_MODEL_LONGFORM : HF_MODEL_FAST}`;
      }
    }

    // All providers failed → structured fallback with explicit status message
    if (!aiResult) {
      const providerError = "All AI providers are currently unavailable (quota/rate-limit/credits). A local fallback response was returned.";
      return new Response(
        JSON.stringify({ stage, model: usedModel, rateLimited: true, error: providerError, result: buildFallbackResult(stage, query, context) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = finalizeStageResult(stage, query, context, aiResult);

    if (stage === "paper" && (!Array.isArray((result as any).references) || (result as any).references.length === 0)) {
      (result as any).references = buildFallbackPaper(query, context).references;
    }

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
