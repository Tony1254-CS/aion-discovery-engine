import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Loader2, CheckCircle2, XCircle, Lightbulb,
  BarChart3, FlaskConical, ArrowRight, ChevronDown, ChevronUp,
  Database, Target, BookOpen, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReviewData {
  strengths: string[];
  weaknesses: string[];
  clarityScore: number;
  clarityFeedback: string;
  noveltyScore: number;
  noveltyFeedback: string;
  datasetSuggestions: string[];
  hypothesis: {
    iv: string;
    dv: string;
    controls: string[];
    statement: string;
  };
  nextSteps: string[];
  overallScore: number;
  summary: string;
}

interface SimilarPaper {
  title: string;
  authors: string;
  relevance: number;
  source: string;
}

const safeArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

const safeNum = (v: unknown, fallback = 0): number =>
  typeof v === "number" && !isNaN(v) ? v : fallback;

const safeStr = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

function ScoreRing({ score, label, size = 72 }: { score: number; label: string; size?: number }) {
  const pct = Math.round(score * 100);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 70 ? "hsl(var(--aion-cyan))" : pct >= 40 ? "hsl(var(--aion-amber, 45 100% 60%))" : "hsl(var(--destructive))";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={4} opacity={0.2} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <span className="text-lg font-bold text-foreground" style={{ marginTop: -(size / 2 + 10) }}>{pct}%</span>
      <span className="text-[10px] text-muted-foreground mt-3">{label}</span>
    </div>
  );
}

function CollapsibleSection({
  title, icon: Icon, children, defaultOpen = false,
}: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-white/[0.03] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function IdeaReview() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [similarPapers, setSimilarPapers] = useState<SimilarPaper[]>([]);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleReview = async () => {
    if (text.trim().length < 50) {
      setError("Please provide at least 50 characters to review.");
      return;
    }
    setError("");
    setReview(null);
    setSimilarPapers([]);
    setLoading(true);

    try {
      // Step 1: Get peer review
      setStatusMsg("Analyzing your idea…");
      const { data, error: fnError } = await supabase.functions.invoke("idea-review", {
        body: { text: text.trim() },
      });

      if (fnError) throw new Error(fnError.message || "Review failed");
      if (data?.error) throw new Error(data.error);

      const r = data?.review;
      if (!r) throw new Error("Empty response from reviewer");

      setReview({
        strengths: safeArr(r.strengths),
        weaknesses: safeArr(r.weaknesses),
        clarityScore: safeNum(r.clarityScore, 0.5),
        clarityFeedback: safeStr(r.clarityFeedback, "No feedback available."),
        noveltyScore: safeNum(r.noveltyScore, 0.5),
        noveltyFeedback: safeStr(r.noveltyFeedback, "No feedback available."),
        datasetSuggestions: safeArr(r.datasetSuggestions),
        hypothesis: {
          iv: safeStr(r.hypothesis?.iv, "Not specified"),
          dv: safeStr(r.hypothesis?.dv, "Not specified"),
          controls: safeArr(r.hypothesis?.controls),
          statement: safeStr(r.hypothesis?.statement, "Not specified"),
        },
        nextSteps: safeArr(r.nextSteps),
        overallScore: safeNum(r.overallScore, 0.5),
        summary: safeStr(r.summary, "Review complete."),
      });

      // Step 2: Find similar papers
      setStatusMsg("Searching for similar papers…");
      try {
        const { data: litData } = await supabase.functions.invoke("literature-search", {
          body: { query: text.trim().slice(0, 500) },
        });
        if (litData?.papers) {
          setSimilarPapers(
            litData.papers.slice(0, 3).map((p: any) => ({
              title: safeStr(p.title, "Untitled"),
              authors: safeStr(p.authors, "Unknown"),
              relevance: safeNum(p.relevance, 0),
              source: safeStr(p.source, "unknown"),
            }))
          );
        }
      } catch { /* literature search is optional */ }

      setStatusMsg("");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setStatusMsg("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Input Area */}
      {!review && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="glass-panel-hero p-[5px] mb-4">
            <div className="bg-background/25 rounded-[calc(1.5rem-3px)] p-5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your research idea, proposal, abstract, or draft here…"
                rows={8}
                maxLength={30000}
                className="w-full bg-transparent border-none outline-none resize-none text-white placeholder:text-muted-foreground/35 text-sm leading-relaxed font-light"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                <span className="text-[10px] text-muted-foreground/40">
                  {wordCount} words · Max ~5,000 words
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleReview}
                  disabled={loading || text.trim().length < 50}
                  className="aion-glow-button flex items-center gap-2 disabled:opacity-15 disabled:cursor-not-allowed disabled:shadow-none text-sm px-6 py-2.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reviewing…
                    </>
                  ) : (
                    <>
                      Review My Idea
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {loading && statusMsg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 justify-center text-xs text-muted-foreground"
            >
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              {statusMsg}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/[0.08] border border-destructive/15 mt-4"
            >
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results */}
      {review && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-4"
        >
          {/* Header with scores */}
          <div className="glass-panel-hero p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Review Results
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{review.summary}</p>
              </div>
              <button
                onClick={() => { setReview(null); setSimilarPapers([]); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]"
              >
                <RefreshCw className="h-3 w-3" />
                New Review
              </button>
            </div>

            <div className="flex justify-center gap-8">
              <ScoreRing score={review.overallScore} label="Overall" size={80} />
              <ScoreRing score={review.noveltyScore} label="Novelty" />
              <ScoreRing score={review.clarityScore} label="Clarity" />
            </div>
          </div>

          {/* Strengths */}
          <CollapsibleSection title="Strengths" icon={CheckCircle2} defaultOpen>
            <ul className="space-y-2">
              {review.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--aion-cyan))] shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Weaknesses */}
          <CollapsibleSection title="Weaknesses" icon={XCircle} defaultOpen>
            <ul className="space-y-2">
              {review.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* Novelty & Clarity Feedback */}
          <CollapsibleSection title="Novelty & Clarity Analysis" icon={BarChart3}>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Novelty</p>
                <p className="text-xs text-foreground/70 leading-relaxed">{review.noveltyFeedback}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Clarity & Structure</p>
                <p className="text-xs text-foreground/70 leading-relaxed">{review.clarityFeedback}</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* Formalized Hypothesis */}
          <CollapsibleSection title="Formalized Hypothesis" icon={FlaskConical} defaultOpen>
            <div className="space-y-3">
              <p className="text-xs text-foreground/80 italic leading-relaxed">
                "{review.hypothesis.statement}"
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-panel p-3 rounded-lg">
                  <p className="text-[9px] text-primary font-semibold uppercase tracking-wider">IV</p>
                  <p className="text-[11px] text-foreground/80 mt-1">{review.hypothesis.iv}</p>
                </div>
                <div className="glass-panel p-3 rounded-lg">
                  <p className="text-[9px] text-primary font-semibold uppercase tracking-wider">DV</p>
                  <p className="text-[11px] text-foreground/80 mt-1">{review.hypothesis.dv}</p>
                </div>
                <div className="glass-panel p-3 rounded-lg">
                  <p className="text-[9px] text-primary font-semibold uppercase tracking-wider">Controls</p>
                  <p className="text-[11px] text-foreground/80 mt-1">
                    {review.hypothesis.controls.length > 0 ? review.hypothesis.controls.join(", ") : "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Dataset Suggestions */}
          {review.datasetSuggestions.length > 0 && (
            <CollapsibleSection title="Suggested Datasets" icon={Database}>
              <ul className="space-y-2">
                {review.datasetSuggestions.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                    <Database className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Similar Papers */}
          {similarPapers.length > 0 && (
            <CollapsibleSection title="Similar Published Work" icon={BookOpen}>
              <div className="space-y-3">
                {similarPapers.map((p, i) => (
                  <div key={i} className="glass-panel p-3 rounded-lg">
                    <p className="text-xs font-medium text-foreground/90">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.authors}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1 flex-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.round(p.relevance * 100)}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{Math.round(p.relevance * 100)}% match</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Next Steps */}
          <CollapsibleSection title="Actionable Next Steps" icon={Target} defaultOpen>
            <ol className="space-y-2">
              {review.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CollapsibleSection>
        </motion.div>
      )}
    </div>
  );
}
