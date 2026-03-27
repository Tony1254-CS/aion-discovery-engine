import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, stage, context } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";
    let model = "google/gemini-2.0-flash-001";
    let maxTokens = 4096;

    switch (stage) {
      case "literature":
        systemPrompt = `You are a scientific literature review agent. Given a research question, identify 8-12 REAL, PUBLISHED papers from the actual scientific literature. You MUST use genuinely existing papers with their correct, real DOIs. Use well-known, highly cited papers in the relevant field. Do NOT fabricate or invent DOIs — every DOI must resolve to a real paper on doi.org. If you are unsure of a DOI, omit the doi field for that paper rather than guessing. For each paper provide: title (exact real title), authors (abbreviated), year, journal, doi (REAL existing DOI like 10.1038/s41586-023-06185-3 or 10.1126/science.abc1234 — must be genuine), and a 3-4 sentence summary. Also identify 5 key concepts/themes. Respond in valid JSON:
{
  "papers": [{"title": "...", "authors": "...", "year": 2024, "journal": "...", "doi": "10.1038/...", "summary": "..."}],
  "concepts": ["concept1", "concept2", "concept3", "concept4", "concept5"],
  "synthesis": "A 6-8 sentence comprehensive synthesis covering the current state of knowledge, methodological trends, key findings, controversies, and remaining questions in the field."
}`;
        userPrompt = `Research question: "${query}"`;
        break;

      case "gaps":
        systemPrompt = `You are a research gap identification agent. Given a literature synthesis and key concepts, identify 4-5 specific research gaps — areas that are understudied, contradictory, or where novel approaches could yield insights. For each gap, provide detailed reasoning. Respond in valid JSON:
{
  "gaps": [{"title": "...", "description": "A detailed 3-4 sentence description of why this gap exists and why it matters", "relevance": "How filling this gap advances the field"}]
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
        systemPrompt = `You are a computational experiment design agent. Given a hypothesis, design a rigorous experiment. Describe detailed methodology (statistical tests, sample sizes, controls, variables), data analysis pipeline, and provide plausible statistical results. Include figure descriptions that relate to the specific research question. Respond in valid JSON:
{
  "methodology": "A detailed 6-8 sentence description of the experimental methodology including study design, variables, controls, and statistical approach",
  "dataDescription": "Description of the dataset characteristics, variables measured, and data collection approach",
  "results": {
    "pValue": 0.003,
    "effectSize": 1.24,
    "sampleSize": 5000,
    "keyFinding": "A detailed 2-3 sentence key finding",
    "secondaryFindings": ["finding1", "finding2"],
    "xAxisLabel": "Independent Variable Name",
    "yAxisLabel": "Dependent Variable Name",
    "figureTitle": "Relationship between X and Y"
  },
  "figures": [{"title": "...", "description": "...", "type": "scatter|heatmap|boxplot"}]
}`;
        userPrompt = `Hypothesis: ${JSON.stringify(context?.hypothesis)}\nQuestion: "${query}"`;
        break;

      case "paper":
        model = "google/gemini-2.5-pro-preview-06-05";
        maxTokens = 65536;
        systemPrompt = `You are a senior academic paper writing agent. Write a COMPREHENSIVE, PUBLICATION-QUALITY research paper spanning 14-15 pages. Use formal academic language. Every section MUST be thorough — this is non-negotiable.

MANDATORY SECTION LENGTHS (violation = failure):
- "abstract": EXACTLY 250-350 words. A complete summary of objectives, methods, key results, and implications.
- "introduction": EXACTLY 6 paragraphs, each 120-180 words (total ~900 words). Cover background, significance, research gap, objectives, contribution, and paper structure.
- "literatureReview": EXACTLY 8 paragraphs, each 120-180 words (total ~1200 words), organized thematically with [Author, Year] citations in every paragraph. Cover major theories, empirical studies, methodological approaches, contradictions, and synthesis.
- "methods": EXACTLY 6 paragraphs covering: (1) Study Design Overview, (2) Population & Sampling, (3) Independent Variables, (4) Dependent Variables & Measures, (5) Statistical Analysis Plan, (6) Ethical Considerations & Limitations of Design. Each 100-150 words.
- "results": EXACTLY 6 paragraphs: (1) Descriptive Statistics, (2) Primary Hypothesis Test, (3) Secondary Analyses, (4) Subgroup Analyses, (5) Sensitivity/Robustness Checks, (6) Summary of Effect Sizes. Include exact p-values, CIs, effect sizes in EVERY paragraph.
- "discussion": EXACTLY 7 paragraphs: (1) Summary of Findings, (2) Comparison with Prior Work, (3) Theoretical Implications, (4) Practical Implications, (5) Strengths, (6) Limitations, (7) Future Directions. Each 120-160 words.
- "conclusion": EXACTLY 4 paragraphs summarizing contributions, implications, recommendations, future work. Each 100-140 words.
- "references": EXACTLY 20-25 references in APA 7th format. CRITICAL: Use ONLY real, genuinely existing published papers with their correct, verifiable DOIs that resolve on https://doi.org/. Do NOT fabricate or invent DOIs. Use well-known, highly cited papers from Nature, Science, PNAS, Lancet, JAMA, PLoS ONE, Psychological Bulletin, etc. If you are unsure of a DOI, provide the reference WITHOUT a DOI rather than inventing one.

CRITICAL RULES:
1. TOTAL PAPER MUST EXCEED 6000 WORDS. Count carefully.
2. Each section MUST be a single string (paragraphs separated by double newlines \\n\\n).
3. Do NOT use markdown formatting — plain text only.
4. Every claim must cite [Author, Year].
5. Results must include specific numbers: p-values, effect sizes, confidence intervals, sample sizes.
6. References MUST cite real papers with real DOIs — never fabricate a DOI.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Full descriptive academic title",
  "abstract": "...",
  "introduction": "...",
  "literatureReview": "...",
  "methods": "...",
  "results": "...",
  "discussion": "...",
  "conclusion": "...",
  "references": [{"text": "Author, A. B., & Author, C. D. (Year). Title. Journal, Vol(Issue), Pages. https://doi.org/10.XXXX/XXXXX"}]
}`;
        userPrompt = `Research context: ${JSON.stringify(context)}\n\nResearch question: "${query}"\n\nWrite the COMPLETE paper NOW. Every section must meet the EXACT paragraph counts specified. Do NOT truncate, abbreviate, or summarize any section. Write FULL paragraphs with complete sentences. The paper must be 6000+ words total. IMPORTANT: All references MUST cite real, existing published papers with genuine DOIs that resolve on doi.org. Do NOT invent or fabricate DOIs.`;
        break;

      case "refine":
        model = "google/gemini-2.0-flash-001";
        maxTokens = 16384;
        systemPrompt = `You are a research paper refinement agent. Given a completed paper and a user request, modify the specific section or aspect requested. Return the COMPLETE updated paper in the same JSON format. Maintain or increase the length and detail of all sections. The JSON must include ALL fields: title, abstract, introduction, literatureReview, methods, results, discussion, conclusion, references.`;
        userPrompt = `Current paper: ${JSON.stringify(context?.paper)}\nUser request: "${query}"`;
        break;

      case "peer-review":
        systemPrompt = `You are a rigorous academic peer reviewer. Evaluate the given research paper critically. Assess methodology, clarity, novelty, reproducibility, and potential biases. Respond in valid JSON:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": [{"text": "suggestion text", "section": "methods|results|discussion|introduction|abstract|literatureReview|conclusion"}],
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

      case "research-gaps":
        model = "google/gemini-2.0-flash-001";
        maxTokens = 8192;
        systemPrompt = `You are a research gap analysis agent. Given a completed research paper and its context, identify 4-5 specific research gaps and provide actionable next-step suggestions for each. 

For each gap, classify it as one of: "unanswered", "contradiction", "methodological", or "under-explored".

For each gap, provide 1-2 concrete future research suggestions with a testable hypothesis draft, suggested variables, and dataset recommendation.

Respond in valid JSON:
{
  "gaps": [
    {
      "title": "Short gap title",
      "description": "3-4 sentence explanation of why this gap exists and its significance",
      "type": "unanswered|contradiction|methodological|under-explored",
      "suggestions": [
        {
          "title": "Concrete suggestion title",
          "description": "2-3 sentences on what to do and why",
          "hypothesisDraft": "A one-sentence testable hypothesis",
          "suggestedIV": "Independent variable",
          "suggestedDV": "Dependent variable",
          "controls": "Key control variables",
          "datasetRecommendation": "Which dataset or data collection approach to use"
        }
      ]
    }
  ]
}`;
        userPrompt = `Research question: "${query}"\nPaper context: ${JSON.stringify(context)}`;
        break;

      case "research-proposal":
        model = "gemini-2.0-flash";
        maxTokens = 4096;
        systemPrompt = `You are a research proposal writing agent. Given a research gap and a suggestion, write a concise 1-2 page research proposal with: (1) Introduction & Background (2 paragraphs), (2) Research Question & Hypothesis, (3) Proposed Methodology (2 paragraphs), (4) Expected Outcomes, (5) Suggested Timeline (6 months). Write in formal academic prose. Return ONLY valid JSON: {"proposal": "The full proposal text with paragraph breaks"}`;
        userPrompt = `Gap: ${JSON.stringify(context?.gap)}\nSuggestion: ${JSON.stringify(context?.suggestion)}`;
        break;

      case "debate":
        model = "gemini-2.0-flash";
        maxTokens = 2048;
        systemPrompt = context?.systemPrompt || "You are a scientific debater.";
        userPrompt = (context?.history || []).map((m: any) => m.content).join("\n\n") + `\n\nNow respond in your role. Research question: "${query}"`;
        break;

      default:
        throw new Error(`Unknown stage: ${stage}`);
    }

    const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";

    const requestBody = JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    // Retry with exponential backoff for rate limits
    let response: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      response = await fetch(openRouterUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://aion-discovery-engine.lovable.app",
          "X-Title": "AION Research Engine",
        },
        body: requestBody,
      });

      if (response.status !== 429) break;

      const waitMs = 3000 * Math.pow(2, attempt);
      console.log(`Rate limited on attempt ${attempt + 1}, waiting ${waitMs}ms...`);
      await response.text();
      await new Promise(r => setTimeout(r, waitMs));
    }

    if (!response || !response.ok) {
      if (response?.status === 429) {
        return new Response(JSON.stringify({ error: "API rate limit reached. Please wait a minute and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = response ? await response.text() : "No response";
      console.error("OpenRouter error:", response?.status, t);
      throw new Error(`OpenRouter error: ${response?.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const finishReason = data.choices?.[0]?.finish_reason;
    if (finishReason === "length") {
      console.warn(`Output truncated for stage ${stage} - finish_reason: ${finishReason}`);
    }

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
