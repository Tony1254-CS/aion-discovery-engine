import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_AI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const HF_API_URL = "https://router.huggingface.co/novita/v3/openai/chat/completions";
const HF_MODEL = "deepseek-ai/DeepSeek-V3-0324";

async function callHuggingFace(apiKey: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: HF_MODEL, messages, max_tokens: Math.min(maxTokens, 4000), temperature: 0.3 }),
    });
    if (!response.ok) { console.error(`HF failed (${response.status})`); return null; }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) { console.error("HF error:", err); return null; }
}

async function callGoogleAI(apiKey: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const systemMsg = messages.find((m: any) => m.role === "system")?.content || "";
    const userMsg = messages.find((m: any) => m.role === "user")?.content || "";
    const url = `${GOOGLE_AI_URL}/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMsg }] }],
        systemInstruction: { parts: [{ text: systemMsg }] },
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
      }),
    });
    if (!response.ok) { console.error(`Google AI failed (${response.status})`); return null; }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) { console.error("Google AI error:", err); return null; }
}

async function callGroq(apiKey: string, messages: any[], maxTokens: number): Promise<string | null> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages, max_tokens: Math.min(maxTokens, 8000), temperature: 0.3 }),
    });
    if (!response.ok) { console.error(`Groq failed (${response.status})`); return null; }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) { console.error("Groq error:", err); return null; }
}

const parseJson = (content: string) => {
  try {
    const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(m ? m[1].trim() : content.trim());
  } catch { return null; }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Please provide at least 20 characters of text to review." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncated = text.slice(0, 25000); // ~5000 words max

    const systemPrompt = `You are an expert academic peer reviewer. Analyze the provided research idea, proposal, or draft. Return ONLY valid JSON (no markdown, no code fences) with these exact keys:

{
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "clarityScore": 0.0-1.0,
  "clarityFeedback": "detailed feedback on clarity and structure",
  "noveltyScore": 0.0-1.0,
  "noveltyFeedback": "assessment of originality",
  "datasetSuggestions": ["dataset 1", "dataset 2", ...],
  "hypothesis": {
    "iv": "independent variable",
    "dv": "dependent variable",
    "controls": ["control 1", "control 2"],
    "statement": "formal hypothesis statement"
  },
  "nextSteps": ["step 1", "step 2", ...],
  "overallScore": 0.0-1.0,
  "summary": "brief overall assessment"
}

Be thorough, specific, and constructive. Provide 3-5 items for strengths, weaknesses, and next steps. Score honestly.`;

    const userPrompt = `Review this research idea/proposal:\n\n${truncated}`;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const HF_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
    const GOOGLE_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const GROQ_KEY = Deno.env.get("GROQ_API_KEY");

    let result: string | null = null;
    let provider = "unknown";

    if (HF_KEY) { result = await callHuggingFace(HF_KEY, messages, 4000); if (result) provider = "huggingface"; }
    if (!result && GOOGLE_KEY) { result = await callGoogleAI(GOOGLE_KEY, messages, 4000); if (result) provider = "google"; }
    if (!result && GROQ_KEY) { result = await callGroq(GROQ_KEY, messages, 4000); if (result) provider = "groq"; }

    if (!result) {
      return new Response(JSON.stringify({ error: "All AI providers are currently unavailable. Please try again in a moment.", rateLimited: true }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseJson(result);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Failed to parse AI response. Please try again.", raw: result.slice(0, 500) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ review: parsed, provider }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("idea-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
