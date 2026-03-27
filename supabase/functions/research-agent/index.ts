import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const FAST_MODEL = "google/gemini-2.5-flash-lite";
const BALANCED_MODEL = "google/gemini-3-flash-preview";
const LONGFORM_MODEL = "google/gemini-2.5-flash";
// Groq fallback models
const GROQ_FAST = "llama-3.1-8b-instant";
const GROQ_BALANCED = "llama-3.3-70b-versatile";
const GROQ_LONGFORM = "llama-3.3-70b-versatile";

const getGroqModel = (primaryModel: string) => {
  if (primaryModel === LONGFORM_MODEL) return GROQ_LONGFORM;
  if (primaryModel === BALANCED_MODEL) return GROQ_BALANCED;
  return GROQ_FAST;
};
const STAGES = [
  "literature",
  "gaps",
  "hypotheses",
  "experiment",
  "paper",
  "refine",
  "peer-review",
  "competing-hypotheses",
  "research-gaps",
  "research-proposal",
  "debate",
] as const;
type Stage = (typeof STAGES)[number];
const JSON_STAGES = new Set<Stage>([
  "literature",
  "gaps",
  "hypotheses",
  "experiment",
  "paper",
  "refine",
  "peer-review",
  "competing-hypotheses",
  "research-gaps",
  "research-proposal",
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
    abstract:
      "This draft was generated as a fallback because the AI provider was temporarily unavailable. It preserves the research direction, experiment summary, and literature context so the workflow can continue without crashing.",
    introduction:
      `This project investigates the question: ${query}. The system switched to a fallback draft because live generation was temporarily unavailable, but the core context from earlier stages has been preserved for continued review.\n\nThis version is intentionally concise and should be treated as a working draft rather than a final manuscript.`,
    literatureReview:
      literature?.synthesis ||
      "A complete literature review could not be generated right now. Retry shortly to regenerate a fuller evidence synthesis.",
    methods:
      context?.experiment?.methodology ||
      "Detailed methods generation is temporarily unavailable. The saved experiment design from earlier stages should be used as the starting point.",
    results:
      context?.experiment?.results?.keyFinding ||
      "Results narration is temporarily unavailable. Quantitative outputs from earlier stages remain available in the dashboard.",
    discussion:
      "Discussion generation is temporarily paused. The safest next step is to preserve the current hypotheses, experimental outputs, and literature evidence, then retry when capacity returns.",
    conclusion:
      "This fallback keeps the research session usable during temporary AI unavailability. A complete paper can be regenerated later without losing the current workflow state.",
    references:
      references.length > 0
        ? references
        : [{ text: "Reference list will repopulate after the next successful paper generation run." }],
  };
};

const buildFallbackResult = (stage: Stage, query: string, context: any) => {
  switch (stage) {
    case "literature":
      return {
        papers: [],
        concepts: [],
        synthesis: `Live literature synthesis is temporarily unavailable for the query "${query}". Please retry shortly.`,
      };
    case "gaps":
      return {
        gaps: [
          {
            title: "Gap analysis temporarily paused",
            description: "Automated gap extraction could not complete right now, but the literature context is preserved.",
            relevance: "Retrying later will restore a fuller evidence-based gap analysis.",
          },
        ],
      };
    case "hypotheses":
    case "competing-hypotheses":
      return {
        hypotheses: [
          {
            type: "primary",
            title: `Provisional hypothesis for: ${query}`,
            description: "A complete multi-hypothesis comparison could not be generated right now.",
            predictedOutcome: "Predicted outcome will populate after the next successful retry.",
            approach: "Retry this stage to generate the full hypothesis set.",
            pValue: 0.05,
            effectSize: 0.2,
            verdict: "weak",
          },
        ],
        noveltyScore: 0,
        closestWork: "Temporarily unavailable",
        noveltyDifference: "Will populate after a successful retry.",
      };
    case "experiment":
      return {
        methodology: "Experiment design is temporarily unavailable. Retry shortly to generate the full methods section.",
        dataDescription: "No structured data description could be generated during the temporary outage window.",
        results: {
          pValue: 0.05,
          effectSize: 0.2,
          sampleSize: 0,
          keyFinding: "Experimental interpretation is pending a successful retry.",
          secondaryFindings: [],
          xAxisLabel: "Pending retry",
          yAxisLabel: "Pending retry",
          figureTitle: "Awaiting regenerated experiment output",
        },
        figures: [],
      };
    case "paper":
    case "refine":
      return context?.paper || buildFallbackPaper(query, context);
    case "peer-review":
      return {
        strengths: ["Session state was preserved despite the temporary AI issue."],
        weaknesses: ["A full peer review could not be generated right now."],
        suggestions: [{ text: "Retry the peer review shortly.", section: "discussion" }],
        overallScore: 5,
        verdict: "Peer review postponed due to temporary AI availability limits.",
      };
    case "research-gaps":
      return {
        gaps: [
          {
            title: "Next-step generation delayed",
            description: "The full next-steps analysis is temporarily unavailable.",
            type: "under-explored",
            suggestions: [
              {
                title: "Retry gap analysis",
                description: "Run the same query again shortly to regenerate detailed research gaps.",
                hypothesisDraft: "A full hypothesis draft will be generated after retry.",
                suggestedIV: "Pending retry",
                suggestedDV: "Pending retry",
                controls: "Pending retry",
                datasetRecommendation: "Pending retry",
              },
            ],
          },
        ],
      };
    case "research-proposal":
      return { proposal: "Research proposal generation is temporarily unavailable. Please retry shortly." };
    case "debate":
      return { raw: "Debate mode is temporarily unavailable. Please retry shortly." };
  }
};

const getStageConfig = (stage: Stage, query: string, context: any) => {
  switch (stage) {
    case "literature":
      return {
        model: BALANCED_MODEL,
        maxTokens: 2600,
        systemPrompt:
          "You are a scientific literature review agent. Return concise structured JSON with real papers when possible. Never invent DOIs. Required keys: papers, concepts, synthesis.",
        userPrompt: `Research question: "${query}"\nReturn 8-10 relevant papers, 5 concepts, and a concise synthesis.`,
      };
    case "gaps":
      return {
        model: FAST_MODEL,
        maxTokens: 1400,
        systemPrompt:
          "Identify 4-5 specific research gaps from the provided literature context. Return valid JSON with key: gaps.",
        userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
      };
    case "hypotheses":
      return {
        model: FAST_MODEL,
        maxTokens: 1400,
        systemPrompt:
          "Generate 3 novel, testable hypotheses. Return valid JSON with key: hypotheses.",
        userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
      };
    case "experiment":
      return {
        model: FAST_MODEL,
        maxTokens: 2000,
        systemPrompt:
          "Design a concise rigorous experiment and return valid JSON with keys: methodology, dataDescription, results, figures.",
        userPrompt: `Research question: "${query}"\nHypothesis: ${JSON.stringify(context?.hypothesis)}`,
      };
    case "paper":
      return {
        model: LONGFORM_MODEL,
        maxTokens: 7000,
        systemPrompt:
          "Write a fast, publication-style research paper draft. Return valid JSON with keys: title, abstract, introduction, literatureReview, methods, results, discussion, conclusion, references. Keep it concise but complete. Do not invent citations or DOIs.",
        userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}\nWrite a complete structured draft with moderate length and clear sections.`,
      };
    case "refine":
      return {
        model: LONGFORM_MODEL,
        maxTokens: 5000,
        systemPrompt:
          "Update the provided paper based on the user request. Return the complete paper as valid JSON with all required keys.",
        userPrompt: `User request: "${query}"\nCurrent paper: ${JSON.stringify(context?.paper)}`,
      };
    case "peer-review":
      return {
        model: FAST_MODEL,
        maxTokens: 1400,
        systemPrompt:
          "Review the paper critically and return valid JSON with keys: strengths, weaknesses, suggestions, overallScore, verdict.",
        userPrompt: `Paper to review: ${JSON.stringify(context?.paper)}`,
      };
    case "competing-hypotheses":
      return {
        model: FAST_MODEL,
        maxTokens: 1600,
        systemPrompt:
          "Generate exactly 3 competing hypotheses (primary, alternative, null). Return valid JSON with keys: hypotheses, noveltyScore, closestWork, noveltyDifference.",
        userPrompt: `Research question: "${query}"\nContext: ${JSON.stringify(context)}`,
      };
    case "research-gaps":
      return {
        model: FAST_MODEL,
        maxTokens: 2000,
        systemPrompt:
          "Identify 4-5 post-paper research gaps and next steps. Return valid JSON with key: gaps.",
        userPrompt: `Research question: "${query}"\nPaper context: ${JSON.stringify(context)}`,
      };
    case "research-proposal":
      return {
        model: FAST_MODEL,
        maxTokens: 2200,
        systemPrompt: "Write a concise research proposal and return valid JSON with key: proposal.",
        userPrompt: `Gap: ${JSON.stringify(context?.gap)}\nSuggestion: ${JSON.stringify(context?.suggestion)}`,
      };
    case "debate":
      return {
        model: FAST_MODEL,
        maxTokens: 1200,
        systemPrompt: context?.systemPrompt || "You are a scientific debater.",
        userPrompt: `${(context?.history || []).map((m: any) => m.content).join("\n\n")}\n\nNow respond in your role. Research question: "${query}"`,
      };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const stage = body?.stage as Stage;
    const context = body?.context;

    if (!query) {
      return new Response(JSON.stringify({ error: "query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stage || !STAGES.includes(stage)) {
      return new Response(JSON.stringify({ error: "valid stage is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!LOVABLE_API_KEY && !GROQ_API_KEY) throw new Error("No AI API keys configured");

    const { model, maxTokens, systemPrompt, userPrompt } = getStageConfig(stage, query, context);
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Try primary (Lovable AI) first
    let aiResult: any = null;
    let usedModel = model;

    if (LOVABLE_API_KEY) {
      try {
        const response = await fetch(AI_GATEWAY_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3 }),
        });
        if (response.ok) {
          const data = await response.json();
          aiResult = data.choices?.[0]?.message?.content || "";
        } else {
          console.log(`Primary AI failed (${response.status}), trying Groq backup...`);
        }
      } catch (err) {
        console.log("Primary AI error, trying Groq backup...", err);
      }
    }

    // Fallback to Groq if primary failed
    if (!aiResult && GROQ_API_KEY) {
      const groqModel = getGroqModel(model);
      usedModel = `groq/${groqModel}`;
      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: groqModel, messages, max_tokens: Math.min(maxTokens, 8000), temperature: 0.3 }),
        });
        if (response.ok) {
          const data = await response.json();
          aiResult = data.choices?.[0]?.message?.content || "";
        } else {
          const t = await response.text();
          console.error("Groq backup also failed:", response.status, t);
        }
      } catch (err) {
        console.error("Groq backup error:", err);
      }
    }

    // If both failed, return fallback
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
