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
    let model = "google/gemini-3-flash-preview";
    let maxTokens = 4096;

    switch (stage) {
      case "literature":
        systemPrompt = `You are a scientific literature review agent. Given a research question, identify 8-12 relevant papers that would exist in the literature. For each paper, provide: title, authors (abbreviated), year, journal, DOI (generate realistic DOI like 10.1038/s41586-024-XXXXX), and a 3-4 sentence summary of key findings including methodology and sample size. Also identify 5 key concepts/themes. Respond in valid JSON:
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
        model = "google/gemini-2.5-flash";
        maxTokens = 16384;
        systemPrompt = `You are a senior academic paper writing agent. Write a COMPREHENSIVE, PUBLICATION-QUALITY research paper that would span 14-15 pages in print. Use formal academic language with extensive detail. Each section must be thorough and substantive.

CRITICAL REQUIREMENTS:
- The "literatureReview" must be 5-8 paragraphs covering the entire state of knowledge, organized thematically with proper citations
- The "introduction" must be 4-6 paragraphs establishing context, motivation, and research questions
- The "methods" must be 4-6 paragraphs with detailed subsections on study design, data collection, variables, statistical analysis
- The "results" must be 4-6 paragraphs presenting findings systematically with specific numbers, effect sizes, confidence intervals
- The "discussion" must be 5-7 paragraphs interpreting results, comparing with literature, explaining mechanisms
- The "conclusion" must be 3-4 paragraphs summarizing contributions, implications, and future directions
- References must include realistic DOIs in proper APA format

Respond in valid JSON:
{
  "title": "A descriptive academic title",
  "abstract": "A comprehensive 250-300 word abstract covering background, methods, results, and conclusions",
  "introduction": "4-6 detailed paragraphs (each 100-150 words) establishing the research context, identifying the problem, stating the research questions, and outlining the paper's contributions. Cite relevant papers using [Author, Year] format.",
  "literatureReview": "5-8 detailed paragraphs (each 100-150 words) organized thematically. Review key findings, methodological approaches, theoretical frameworks, and identify gaps. Every paragraph should cite 2-3 papers using [Author, Year] format.",
  "methods": "4-6 detailed paragraphs covering: Study Design and Rationale, Data Collection and Participants, Variables and Measures, Statistical Analysis Plan, Ethical Considerations. Include specific numbers (sample sizes, parameters, thresholds).",
  "results": "4-6 detailed paragraphs presenting: Descriptive Statistics, Primary Analysis Results (with exact p-values, effect sizes, CIs), Secondary Analyses, Sensitivity Analyses. Include specific statistical values throughout.",
  "discussion": "5-7 detailed paragraphs covering: Summary of Key Findings, Comparison with Prior Literature, Theoretical Implications, Practical Implications, Strengths of the Study, Limitations and Caveats, and Recommendations.",
  "conclusion": "3-4 paragraphs summarizing the study's main contributions, broader implications for the field, specific actionable recommendations, and concrete directions for future research.",
  "references": [{"text": "Author, A. B., & Author, C. D. (Year). Title of the article. Journal Name, Volume(Issue), Pages. https://doi.org/10.XXXX/XXXXX"}]
}

IMPORTANT: Generate at least 15-20 references with realistic DOIs. Each section should be substantial — aim for at least 500-800 words per major section. The total paper should be 5000-7000 words minimum.`;
        userPrompt = `Full research context including literature, gaps, hypotheses, competing hypotheses, experiment results, novelty analysis, and warnings: ${JSON.stringify(context)}\n\nOriginal research question: "${query}"\n\nWrite a comprehensive, publication-quality research paper. Be extremely detailed and thorough in every section.`;
        break;

      case "refine":
        model = "google/gemini-2.5-flash";
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
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
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

    // Check if output was truncated
    const finishReason = data.choices?.[0]?.finish_reason;
    if (finishReason === "length" || finishReason === "MAX_TOKENS") {
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
