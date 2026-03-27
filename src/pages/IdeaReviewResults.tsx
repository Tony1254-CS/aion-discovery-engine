import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker, Home, Sparkles, CheckCircle2, XCircle, BarChart3,
  FlaskConical, Database, Target, BookOpen, RefreshCw, Loader2,
  PanelLeftClose, PanelLeft, Lightbulb, ChevronDown, ChevronUp,
  Save, Check
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
  hypothesis: { iv: string; dv: string; controls: string[]; statement: string };
  nextSteps: string[];
  overallScore: number;
  summary: string;
}

interface SimilarPaper {
  title: string;
  authors: string;
  relevance: number;
  source: string;
  url: string;
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

export default function IdeaReviewResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const ideaText = (location.state as any)?.ideaText || "";

  const [review, setReview] = useState<ReviewData | null>(null);
  const [similarPapers, setSimilarPapers] = useState<SimilarPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Analyzing your idea…");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!ideaText) {
      navigate("/");
      return;
    }

    const run = async () => {
      try {
        setStatusMsg("Analyzing your idea…");
        const { data, error: fnError } = await supabase.functions.invoke("idea-review", {
          body: { text: ideaText },
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

        // Find similar papers
        setStatusMsg("Searching for similar papers…");
        try {
          const { data: litData } = await supabase.functions.invoke("literature-search", {
            body: { query: ideaText.slice(0, 500) },
          });
          if (litData?.papers) {
            setSimilarPapers(
              litData.papers.slice(0, 5).map((p: any) => ({
                title: safeStr(p.title, "Untitled"),
                authors: safeStr(p.authors, "Unknown"),
                relevance: safeNum(p.relevance, 0),
                source: safeStr(p.source, "unknown"),
                url: safeStr(p.url, ""),
              }))
            );
          }
        } catch { /* optional */ }

        setStatusMsg("");
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
        setStatusMsg("");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [ideaText, navigate]);

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
            className="shrink-0 overflow-hidden border-r border-border/60 bg-[hsl(var(--aion-surface))]"
          >
            <div className="p-5 h-full flex flex-col w-[340px] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
                    <Beaker className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground tracking-tight font-display">AION</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/")}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Back to Home"
                >
                  <Home className="h-4 w-4" />
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6 glass-panel p-4"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-2">Idea Under Review</p>
                <p className="text-sm text-foreground leading-relaxed font-light line-clamp-6">{ideaText}</p>
              </motion.div>

              {/* Scores in sidebar */}
              {review && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel p-5 mb-4"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-4">Scores</p>
                  <div className="flex justify-center gap-6">
                    <ScoreRing score={review.overallScore} label="Overall" size={72} />
                    <ScoreRing score={review.noveltyScore} label="Novelty" size={72} />
                    <ScoreRing score={review.clarityScore} label="Clarity" size={72} />
                  </div>
                </motion.div>
              )}

              <div className="flex-1" />

              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-all mt-4"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Review Another Idea
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-[hsl(var(--aion-surface)/0.8)] backdrop-blur-xl">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </motion.button>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm font-medium text-foreground">Idea Peer Review</span>
          </div>
          <div className="ml-auto">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{statusMsg}</p>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-2xl mx-auto mt-12">
              <div className="glass-panel border border-destructive/30 bg-destructive/5 p-6 rounded-xl">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Review Failed</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    <button
                      onClick={() => navigate("/")}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      ← Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {review && !loading && (
            <div className="max-w-3xl mx-auto space-y-4">
              {/* Summary header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel-hero p-6 rounded-2xl"
              >
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Review Results
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.summary}</p>
              </motion.div>

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

              {/* Novelty & Clarity */}
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

              {/* Hypothesis */}
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

              {/* Datasets */}
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
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
                            {p.title}
                          </a>
                        ) : (
                          <p className="text-xs font-medium text-foreground/90">{p.title}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.authors} · {p.source}</p>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary/60 hover:text-primary truncate block mt-1">
                            {p.url}
                          </a>
                        )}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
