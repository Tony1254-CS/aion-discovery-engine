import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, stage, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (stage) {
      case "literature":
        systemPrompt = `You are a scientific literature review agent. Given a research question, identify 5-7 relevant papers that would exist in the literature. For each paper, provide: title, authors (abbreviated), year, journal, and a 2-sentence summary of key findings. Also identify 3 key concepts/themes that emerge from this body of work. Respond in valid JSON format:
{
  "papers": [{"title": "...", "authors": "...", "year": 2024, "journal": "...", "summary": "..."}],
  "concepts": ["concept1", "concept2", "concept3"],
  "synthesis": "A 3-4 sentence synthesis of the literature landscape."
}`;
        userPrompt = `Research question: "${query}"`;
        break;

      case "gaps":
        systemPrompt = `You are a research gap identification agent. Given a literature synthesis and key concepts, identify 3 specific research gaps — areas that are understudied, contradictory, or where novel approaches could yield insights. Respond in valid JSON:
{
  "gaps": [{"title": "...", "description": "...", "relevance": "..."}]
}`;
        userPrompt = `Literature context: ${JSON.stringify(context)}\n\nResearch question: "${query}"`;
        break;

      case "hypotheses":
        systemPrompt = `You are a hypothesis generation agent. Given research gaps and literature context, generate 3 novel, testable hypotheses. Each must include a clear prediction and suggested experimental approach. Respond in valid JSON:
{
  "hypotheses": [{"title": "...", "description": "...", "predictedOutcome": "...", "approach": "..."}]
}`;
        userPrompt = `Research gaps: ${JSON.stringify(context?.gaps)}\nLiterature: ${JSON.stringify(context?.synthesis)}\nQuestion: "${query}"`;
        break;

      case "experiment":
        systemPrompt = `You are a computational experiment design agent. Given a hypothesis, describe the experiment methodology, simulated data analysis approach, and provide plausible statistical results. Respond in valid JSON:
{
  "methodology": "...",
  "dataDescription": "...",
  "results": {"pValue": 0.003, "effectSize": 1.24, "sampleSize": 5000, "keyFinding": "..."},
  "figures": [{"title": "...", "description": "...", "type": "scatter|heatmap|boxplot"}]
}`;
        userPrompt = `Hypothesis: ${JSON.stringify(context?.hypothesis)}\nQuestion: "${query}"`;
        break;

      case "paper":
        systemPrompt = `You are an academic paper writing agent. Given all research components, write a complete academic paper. Use formal academic language with Merriweather-style prose. Include proper citations to the papers found earlier. Respond in valid JSON:
{
  "title": "...",
  "abstract": "...",
  "introduction": "...",
  "methods": "...",
  "results": "...",
  "discussion": "...",
  "references": [{"text": "..."}]
}`;
        userPrompt = `Full research context: ${JSON.stringify(context)}\nOriginal question: "${query}"`;
        break;

      case "refine":
        systemPrompt = `You are a research paper refinement agent. Given a completed paper and a user request, modify the specific section or aspect requested. Return the full updated paper in the same JSON format as before.`;
        userPrompt = `Current paper: ${JSON.stringify(context?.paper)}\nUser request: "${query}"`;
        break;

      case "peer-review":
        systemPrompt = `You are a rigorous academic peer reviewer. Evaluate the given research paper critically. Assess methodology, clarity, novelty, reproducibility, and potential biases. Respond in valid JSON:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": [{"text": "suggestion text", "section": "methods|results|discussion|introduction|abstract"}],
  "overallScore": 7,
  "verdict": "A one-sentence overall assessment"
}`;
        userPrompt = `Paper to review: ${JSON.stringify(context?.paper)}`;
        break;

      case "competing-hypotheses":
        systemPrompt = `You are a hypothesis generation agent. Given research gaps and literature, generate exactly 3 competing hypotheses: a primary hypothesis, an alternative hypothesis, and a null hypothesis. For each, provide a title, description, predicted outcome, approach, and simulated statistical results. Respond in valid JSON:
{
  "hypotheses": [
    {"type": "primary", "title": "...", "description": "...", "predictedOutcome": "...", "approach": "...", "pValue": 0.003, "effectSize": 0.82, "verdict": "supported"},
    {"type": "alternative", "title": "...", "description": "...", "predictedOutcome": "...", "approach": "...", "pValue": 0.042, "effectSize": 0.45, "verdict": "weak"},
    {"type": "null", "title": "...", "description": "...", "predictedOutcome": "...", "approach": "...", "pValue": 0.38, "effectSize": 0.08, "verdict": "rejected"}
  ],
  "noveltyScore": 0.75,
  "closestWork": "Title of closest prior study",
  "noveltyDifference": "How this work differs from closest prior study"
}`; 
        userPrompt = `Research gaps: ${JSON.stringify(context?.gaps)}\nLiterature: ${JSON.stringify(context?.synthesis)}\nQuestion: "${query}"`;
        break;

      default:
        throw new Error(`Unknown stage: ${stage}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content.trim());
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ stage, result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("research-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
