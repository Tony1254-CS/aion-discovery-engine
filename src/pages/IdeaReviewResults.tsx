import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker, Home, Sparkles, CheckCircle2, XCircle, BarChart3,
  FlaskConical, Database, Target, BookOpen, Loader2,
  PanelLeftClose, PanelLeft, Lightbulb, ChevronDown, ChevronUp,
  Save, Check, TrendingUp, AlertTriangle, ArrowRight, ExternalLink,
  Zap, Award, FileText, Layers, Eye, EyeOff, Menu, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

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

function ScoreRing({ score, label, size = 90, delay = 0 }: { score: number; label: string; size?: number; delay?: number }) {
  const pct = Math.round(score * 100);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct >= 70 ? "hsl(var(--aion-cyan))" : pct >= 40 ? "hsl(45 100% 60%)" : "hsl(var(--destructive))";
  const bgColor = pct >= 70 ? "hsl(var(--aion-cyan) / 0.08)" : pct >= 40 ? "hsl(45 100% 60% / 0.08)" : "hsl(var(--destructive) / 0.08)";
  const grade = pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 50 ? "Fair" : pct >= 30 ? "Needs Work" : "Poor";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center gap-1.5 sm:gap-2 glass-panel rounded-2xl p-3 sm:p-4 flex-1 min-w-[80px] sm:min-w-[100px]"
      style={{ background: bgColor }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} opacity={0.15} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
          transition={{ delay: delay + 0.3, duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="flex flex-col items-center" style={{ marginTop: -(size / 2 + 14) }}>
        <motion.span
          className="text-2xl font-bold text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.8 }}
        >
          {pct}
        </motion.span>
        <span className="text-[9px] text-muted-foreground/70">/ 100</span>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{grade}</p>
      </div>
    </motion.div>
  );
}

function ProgressBar({ value, color = "primary", label, delay = 0 }: { value: number; color?: string; label: string; delay?: number }) {
  const pct = Math.round(value * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-1"
    >
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-foreground/80">{label}</span>
        <span className="text-[11px] font-bold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color === "cyan" ? "bg-[hsl(var(--aion-cyan))]" : color === "amber" ? "bg-[hsl(45_100%_60%)]" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function SectionCard({
  title, icon: Icon, children, defaultOpen = false, badge, badgeColor, delay = 0,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  defaultOpen?: boolean; badge?: string; badgeColor?: string; delay?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="glass-panel rounded-2xl overflow-hidden border border-white/[0.04]"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground hover:bg-white/[0.03] transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          {title}
          {badge && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeColor || "bg-primary/15 text-primary"}`}>
              {badge}
            </span>
          )}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FeedbackItem({ icon: Icon, text, type, index }: { icon: React.ElementType; text: string; type: "strength" | "weakness"; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`flex items-start gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.03] ${
        type === "strength" ? "border-l-2 border-[hsl(var(--aion-cyan))]" : "border-l-2 border-destructive/60"
      }`}
    >
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
        type === "strength" ? "bg-[hsl(var(--aion-cyan)/0.12)]" : "bg-destructive/10"
      }`}>
        <Icon className={`h-3 w-3 ${type === "strength" ? "text-[hsl(var(--aion-cyan))]" : "text-destructive"}`} />
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed">{text}</p>
    </motion.div>
  );
}

export default function IdeaReviewResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const ideaText = (location.state as any)?.ideaText || "";
  const isMobile = useIsMobile();

  const [review, setReview] = useState<ReviewData | null>(null);
  const [similarPapers, setSimilarPapers] = useState<SimilarPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Analyzing your idea…");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFullIdea, setShowFullIdea] = useState(false);

  const handleSave = async () => {
    if (!review || saving || saved) return;
    setSaving(true);
    try {
      const title = ideaText.slice(0, 100).trim() + (ideaText.length > 100 ? "…" : "");
      const { error: insertError } = await supabase.from("idea_reviews" as any).insert({
        idea_text: ideaText,
        review_json: review as any,
        similar_papers: similarPapers as any,
        overall_score: review.overallScore,
        novelty_score: review.noveltyScore,
        clarity_score: review.clarityScore,
        title,
      } as any);
      if (insertError) throw insertError;
      setSaved(true);
    } catch (err: any) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!ideaText) { navigate("/"); return; }

    const run = async () => {
      try {
        setStatusMsg("Sending your idea for expert AI review…");
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

        setStatusMsg("Finding similar published research…");
        try {
          const { data: litData } = await supabase.functions.invoke("literature-search", {
            body: { query: ideaText.slice(0, 500) },
          });
          if (litData?.papers) {
            setSimilarPapers(
              litData.papers.slice(0, 8).map((p: any) => ({
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

  const verdictLabel = review
    ? review.overallScore >= 0.75 ? "Strong Potential" : review.overallScore >= 0.5 ? "Promising with Gaps" : "Needs Significant Work"
    : "";
  const verdictColor = review
    ? review.overallScore >= 0.75 ? "text-[hsl(var(--aion-cyan))]" : review.overallScore >= 0.5 ? "text-[hsl(45_100%_60%)]" : "text-destructive"
    : "";

  // Sidebar content (shared between desktop sidebar and mobile drawer)
  const sidebarContent = (
    <div className="p-4 sm:p-5 h-full flex flex-col overflow-y-auto scrollbar-thin">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
            <Beaker className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground tracking-tight font-display">AION</span>
        </div>
        <div className="flex items-center gap-1">
          {isMobile && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
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
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4 glass-panel p-3 sm:p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Submitted Idea</p>
          <button onClick={() => setShowFullIdea(!showFullIdea)} className="text-muted-foreground hover:text-foreground transition-colors">
            {showFullIdea ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
        </div>
        <p className={`text-sm text-foreground/80 leading-relaxed font-light ${showFullIdea ? "" : "line-clamp-4"}`}>{ideaText}</p>
        {!showFullIdea && ideaText.length > 200 && (
          <button onClick={() => setShowFullIdea(true)} className="text-[10px] text-primary mt-1 hover:underline">Show more…</button>
        )}
      </motion.div>

      {review && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel-hero p-4 sm:p-5 mb-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Verdict</p>
          </div>
          <p className={`text-base sm:text-lg font-bold ${verdictColor}`}>{verdictLabel}</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{review.summary}</p>
        </motion.div>
      )}

      {review && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-3 px-1">Assessment Scores</p>
          <div className="flex gap-2">
            <ScoreRing score={review.overallScore} label="Overall" size={isMobile ? 65 : 80} delay={0.3} />
            <ScoreRing score={review.noveltyScore} label="Novelty" size={isMobile ? 65 : 80} delay={0.45} />
            <ScoreRing score={review.clarityScore} label="Clarity" size={isMobile ? 65 : 80} delay={0.6} />
          </div>
        </motion.div>
      )}

      {review && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-3 sm:p-4 rounded-xl mb-4 space-y-3">
          <ProgressBar value={review.overallScore} label="Overall Quality" color="primary" delay={0.6} />
          <ProgressBar value={review.noveltyScore} label="Originality" color="cyan" delay={0.7} />
          <ProgressBar value={review.clarityScore} label="Clarity & Structure" color="amber" delay={0.8} />
          <ProgressBar value={Math.min(1, (review.strengths.length / 5))} label="Strength Density" color="cyan" delay={0.9} />
        </motion.div>
      )}

      <div className="flex-1" />

      {review && (
        <div className="space-y-2 mt-4">
          <motion.button whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || saved}
            className={`w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-xl transition-all ${saved ? "glass-panel text-[hsl(var(--aion-cyan))] border border-[hsl(var(--aion-cyan))]/20" : "aion-glow-button"}`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : saved ? "Review Saved!" : "Save This Review"}
          </motion.button>
          <motion.button whileHover={{ scale: 1.01, y: -1 }} whileTap={{ scale: 0.98 }} onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-all"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Review Another Idea
          </motion.button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile drawer */}
      {isMobile && (
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />
              <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
                className="fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[360px] bg-[hsl(var(--aion-surface))] border-r border-border/60 overflow-hidden"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
              className="shrink-0 overflow-hidden border-r border-border/60 bg-[hsl(var(--aion-surface))]"
            >
              <div className="w-[360px]">{sidebarContent}</div>
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/40 bg-[hsl(var(--aion-surface)/0.8)] backdrop-blur-xl">
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
            onClick={() => isMobile ? setMobileDrawerOpen(!mobileDrawerOpen) : setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {isMobile ? <Menu className="h-4 w-4" /> : sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </motion.button>
          <div className="h-4 w-px bg-border/50 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs sm:text-sm font-medium text-foreground">Idea Peer Review</span>
          </div>
          {review && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
              review.overallScore >= 0.75 ? "bg-[hsl(var(--aion-cyan)/0.12)] text-[hsl(var(--aion-cyan))]"
              : review.overallScore >= 0.5 ? "bg-[hsl(45_100%_60%/0.12)] text-[hsl(45_100%_60%)]"
              : "bg-destructive/10 text-destructive"
            }`}>
              {Math.round(review.overallScore * 100)}/100
            </span>
          )}
          <div className="ml-auto">
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Home"
            >
              <Home className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-thin">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-5">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary/20 border-t-primary" />
                <Beaker className="h-5 w-5 sm:h-6 sm:w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2 px-4">
                <p className="text-sm font-medium text-foreground">{statusMsg}</p>
                <p className="text-[11px] text-muted-foreground">This typically takes 15–30 seconds</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }} />
                ))}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-2xl mx-auto mt-8 sm:mt-12 px-2">
              <div className="glass-panel border border-destructive/30 bg-destructive/5 p-5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Review Failed</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    <button onClick={() => navigate("/")} className="mt-3 text-xs text-primary hover:underline">← Try again</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {review && !loading && (
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">

              {/* Mobile: Score summary at top */}
              {isMobile && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                  <ScoreRing score={review.overallScore} label="Overall" size={60} delay={0} />
                  <ScoreRing score={review.noveltyScore} label="Novelty" size={60} delay={0.1} />
                  <ScoreRing score={review.clarityScore} label="Clarity" size={60} delay={0.2} />
                </motion.div>
              )}

              {/* Hero summary */}
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="glass-panel-hero p-4 sm:p-6 rounded-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(var(--aion-cyan)/0.05)]" />
                <div className="relative">
                  <div className="flex items-start gap-3 mb-3 sm:mb-4 flex-col sm:flex-row">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--aion-gradient-end))] flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-foreground">Expert Review Complete</h2>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground">Comprehensive AI peer review</p>
                      </div>
                    </div>
                    <div className="sm:ml-auto">
                      <span className={`text-sm font-bold ${verdictColor}`}>{verdictLabel}</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-[1.8]">{review.summary}</p>
                </div>
              </motion.div>

              <SectionCard title="Key Strengths" icon={CheckCircle2} defaultOpen badge={`${review.strengths.length} found`} badgeColor="bg-[hsl(var(--aion-cyan)/0.12)] text-[hsl(var(--aion-cyan))]" delay={0.1}>
                <div className="space-y-2">
                  {review.strengths.map((s, i) => <FeedbackItem key={i} icon={CheckCircle2} text={s} type="strength" index={i} />)}
                </div>
              </SectionCard>

              <SectionCard title="Areas for Improvement" icon={AlertTriangle} defaultOpen badge={`${review.weaknesses.length} identified`} badgeColor="bg-destructive/10 text-destructive" delay={0.2}>
                <div className="space-y-2">
                  {review.weaknesses.map((w, i) => <FeedbackItem key={i} icon={AlertTriangle} text={w} type="weakness" index={i} />)}
                </div>
              </SectionCard>

              <SectionCard title="Novelty & Clarity Analysis" icon={BarChart3} defaultOpen delay={0.3}>
                <div className="space-y-4">
                  <div className="glass-panel rounded-xl p-3 sm:p-4 border-l-2 border-[hsl(var(--aion-cyan))]">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-[hsl(var(--aion-cyan))]" />
                      <p className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider">Novelty</p>
                      <span className="ml-auto text-xs sm:text-sm font-bold text-[hsl(var(--aion-cyan))]">{Math.round(review.noveltyScore * 100)}%</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/75 leading-[1.8]">{review.noveltyFeedback}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-3 sm:p-4 border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <p className="text-[10px] sm:text-xs font-bold text-foreground uppercase tracking-wider">Clarity & Structure</p>
                      <span className="ml-auto text-xs sm:text-sm font-bold text-primary">{Math.round(review.clarityScore * 100)}%</span>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/75 leading-[1.8]">{review.clarityFeedback}</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Formalized Hypothesis" icon={FlaskConical} defaultOpen delay={0.4}>
                <div className="space-y-3">
                  <div className="glass-panel-hero rounded-xl p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-foreground italic leading-[1.8] font-light">"{review.hypothesis.statement}"</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { label: "Independent Variable", value: review.hypothesis.iv, icon: TrendingUp, color: "from-primary/20 to-primary/5" },
                      { label: "Dependent Variable", value: review.hypothesis.dv, icon: Target, color: "from-[hsl(var(--aion-cyan)/0.2)] to-[hsl(var(--aion-cyan)/0.05)]" },
                      { label: "Controls", value: review.hypothesis.controls.length > 0 ? review.hypothesis.controls.join(", ") : "Not specified", icon: Layers, color: "from-[hsl(45_100%_60%/0.2)] to-[hsl(45_100%_60%/0.05)]" },
                    ].map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                        className={`glass-panel p-3 sm:p-4 rounded-xl bg-gradient-to-b ${item.color}`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <item.icon className="h-3 w-3 text-primary" />
                          <p className="text-[9px] font-bold text-primary uppercase tracking-wider">{item.label}</p>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {review.datasetSuggestions.length > 0 && (
                <SectionCard title="Recommended Datasets" icon={Database} badge={`${review.datasetSuggestions.length} suggestions`} delay={0.5}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {review.datasetSuggestions.map((d, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                        className="glass-panel p-3 rounded-xl flex items-start gap-2.5 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Database className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{d}</p>
                      </motion.div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {similarPapers.length > 0 && (
                <SectionCard title="Similar Published Research" icon={BookOpen} badge={`${similarPapers.length} papers`} delay={0.6}>
                  <div className="space-y-3">
                    {similarPapers.map((p, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        className="glass-panel p-3 sm:p-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            {p.url ? (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors flex items-start gap-1.5">
                                <span className="line-clamp-2">{p.title}</span>
                                <ExternalLink className="h-3 w-3 text-primary/50 shrink-0 mt-0.5" />
                              </a>
                            ) : (
                              <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2">{p.title}</p>
                            )}
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 line-clamp-1">{p.authors}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">{p.source}</span>
                              {p.url && (
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary/50 hover:text-primary truncate max-w-[120px] sm:max-w-[200px]">
                                  {p.url}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs sm:text-sm font-bold text-foreground">{Math.round(p.relevance * 100)}%</p>
                            <p className="text-[9px] text-muted-foreground">match</p>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-3">
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--aion-cyan))] rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${Math.round(p.relevance * 100)}%` }}
                              transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </SectionCard>
              )}

              <SectionCard title="Actionable Next Steps" icon={Target} defaultOpen badge="Roadmap" delay={0.7}>
                <div className="space-y-2 sm:space-y-3">
                  {review.nextSteps.map((step, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <span className="text-[10px] sm:text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground/85 leading-[1.7] flex-1">{step}</p>
                      <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-1" />
                    </motion.div>
                  ))}
                </div>
              </SectionCard>

              {/* Mobile: Save + actions at bottom */}
              {isMobile && (
                <div className="space-y-2 pb-4">
                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || saved}
                    className={`w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-xl transition-all ${saved ? "glass-panel text-[hsl(var(--aion-cyan))] border border-[hsl(var(--aion-cyan))]/20" : "aion-glow-button"}`}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : saved ? "Review Saved!" : "Save This Review"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate("/")}
                    className="w-full flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Review Another Idea
                  </motion.button>
                </div>
              )}

              <div className="h-6 sm:h-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0, 1] }}
            className="shrink-0 overflow-hidden border-r border-border/60 bg-[hsl(var(--aion-surface))]"
          >
            <div className="p-5 h-full flex flex-col w-[360px] overflow-y-auto scrollbar-thin">
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

              {/* Idea text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-4 glass-panel p-4 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Submitted Idea</p>
                  <button onClick={() => setShowFullIdea(!showFullIdea)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {showFullIdea ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
                <p className={`text-sm text-foreground/80 leading-relaxed font-light ${showFullIdea ? "" : "line-clamp-4"}`}>{ideaText}</p>
                {!showFullIdea && ideaText.length > 200 && (
                  <button onClick={() => setShowFullIdea(true)} className="text-[10px] text-primary mt-1 hover:underline">Show more…</button>
                )}
              </motion.div>

              {/* Verdict card */}
              {review && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel-hero p-5 mb-4 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-4 w-4 text-primary" />
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Verdict</p>
                  </div>
                  <p className={`text-lg font-bold ${verdictColor}`}>{verdictLabel}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{review.summary}</p>
                </motion.div>
              )}

              {/* Scores */}
              {review && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold mb-3 px-1">Assessment Scores</p>
                  <div className="flex gap-2">
                    <ScoreRing score={review.overallScore} label="Overall" size={80} delay={0.3} />
                    <ScoreRing score={review.noveltyScore} label="Novelty" size={80} delay={0.45} />
                    <ScoreRing score={review.clarityScore} label="Clarity" size={80} delay={0.6} />
                  </div>
                </motion.div>
              )}

              {/* Score bars */}
              {review && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-panel p-4 rounded-xl mb-4 space-y-3"
                >
                  <ProgressBar value={review.overallScore} label="Overall Quality" color="primary" delay={0.6} />
                  <ProgressBar value={review.noveltyScore} label="Originality" color="cyan" delay={0.7} />
                  <ProgressBar value={review.clarityScore} label="Clarity & Structure" color="amber" delay={0.8} />
                  <ProgressBar value={Math.min(1, (review.strengths.length / 5))} label="Strength Density" color="cyan" delay={0.9} />
                </motion.div>
              )}

              <div className="flex-1" />

              {/* Action buttons */}
              {review && (
                <div className="space-y-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`w-full flex items-center justify-center gap-2 text-xs px-4 py-3 rounded-xl transition-all ${
                      saved
                        ? "glass-panel text-[hsl(var(--aion-cyan))] border border-[hsl(var(--aion-cyan))]/20"
                        : "aion-glow-button"
                    }`}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? "Saving…" : saved ? "Review Saved!" : "Save This Review"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/")}
                    className="w-full flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-xl glass-panel text-muted-foreground hover:text-foreground transition-all"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Review Another Idea
                  </motion.button>
                </div>
              )}
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
          {review && (
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              review.overallScore >= 0.75 ? "bg-[hsl(var(--aion-cyan)/0.12)] text-[hsl(var(--aion-cyan))]"
              : review.overallScore >= 0.5 ? "bg-[hsl(45_100%_60%/0.12)] text-[hsl(45_100%_60%)]"
              : "bg-destructive/10 text-destructive"
            }`}>
              {Math.round(review.overallScore * 100)}/100
            </span>
          )}
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
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary"
                />
                <Beaker className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">{statusMsg}</p>
                <p className="text-[11px] text-muted-foreground">This typically takes 15–30 seconds</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-2xl mx-auto mt-12">
              <div className="glass-panel border border-destructive/30 bg-destructive/5 p-6 rounded-2xl">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Review Failed</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    <button onClick={() => navigate("/")} className="mt-3 text-xs text-primary hover:underline">← Try again</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {review && !loading && (
            <div className="max-w-3xl mx-auto space-y-5">

              {/* Hero summary */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-panel-hero p-6 rounded-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(var(--aion-cyan)/0.05)]" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(var(--aion-gradient-end))] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">Expert Review Complete</h2>
                      <p className="text-[11px] text-muted-foreground">Comprehensive AI peer review of your research idea</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`text-sm font-bold ${verdictColor}`}>{verdictLabel}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-[1.8]">{review.summary}</p>
                </div>
              </motion.div>

              {/* Strengths */}
              <SectionCard title="Key Strengths" icon={CheckCircle2} defaultOpen badge={`${review.strengths.length} found`} badgeColor="bg-[hsl(var(--aion-cyan)/0.12)] text-[hsl(var(--aion-cyan))]" delay={0.1}>
                <div className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <FeedbackItem key={i} icon={CheckCircle2} text={s} type="strength" index={i} />
                  ))}
                </div>
              </SectionCard>

              {/* Weaknesses */}
              <SectionCard title="Areas for Improvement" icon={AlertTriangle} defaultOpen badge={`${review.weaknesses.length} identified`} badgeColor="bg-destructive/10 text-destructive" delay={0.2}>
                <div className="space-y-2">
                  {review.weaknesses.map((w, i) => (
                    <FeedbackItem key={i} icon={AlertTriangle} text={w} type="weakness" index={i} />
                  ))}
                </div>
              </SectionCard>

              {/* Novelty & Clarity deep dive */}
              <SectionCard title="Novelty & Clarity Analysis" icon={BarChart3} defaultOpen delay={0.3}>
                <div className="space-y-5">
                  <div className="glass-panel rounded-xl p-4 border-l-2 border-[hsl(var(--aion-cyan))]">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-[hsl(var(--aion-cyan))]" />
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">Novelty Assessment</p>
                      <span className="ml-auto text-sm font-bold text-[hsl(var(--aion-cyan))]">{Math.round(review.noveltyScore * 100)}%</span>
                    </div>
                    <p className="text-sm text-foreground/75 leading-[1.8]">{review.noveltyFeedback}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-4 border-l-2 border-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-primary" />
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider">Clarity & Structure</p>
                      <span className="ml-auto text-sm font-bold text-primary">{Math.round(review.clarityScore * 100)}%</span>
                    </div>
                    <p className="text-sm text-foreground/75 leading-[1.8]">{review.clarityFeedback}</p>
                  </div>
                </div>
              </SectionCard>

              {/* Hypothesis */}
              <SectionCard title="Formalized Hypothesis" icon={FlaskConical} defaultOpen delay={0.4}>
                <div className="space-y-4">
                  <div className="glass-panel-hero rounded-xl p-4">
                    <p className="text-sm text-foreground italic leading-[1.8] font-light">
                      "{review.hypothesis.statement}"
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Independent Variable", value: review.hypothesis.iv, icon: TrendingUp, color: "from-primary/20 to-primary/5" },
                      { label: "Dependent Variable", value: review.hypothesis.dv, icon: Target, color: "from-[hsl(var(--aion-cyan)/0.2)] to-[hsl(var(--aion-cyan)/0.05)]" },
                      { label: "Controls", value: review.hypothesis.controls.length > 0 ? review.hypothesis.controls.join(", ") : "Not specified", icon: Layers, color: "from-[hsl(45_100%_60%/0.2)] to-[hsl(45_100%_60%/0.05)]" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`glass-panel p-4 rounded-xl bg-gradient-to-b ${item.color}`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <item.icon className="h-3 w-3 text-primary" />
                          <p className="text-[9px] font-bold text-primary uppercase tracking-wider">{item.label}</p>
                        </div>
                        <p className="text-sm text-foreground/85 leading-relaxed">{item.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Datasets */}
              {review.datasetSuggestions.length > 0 && (
                <SectionCard title="Recommended Datasets" icon={Database} badge={`${review.datasetSuggestions.length} suggestions`} delay={0.5}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {review.datasetSuggestions.map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className="glass-panel p-3 rounded-xl flex items-start gap-2.5 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Database className="h-3 w-3 text-primary" />
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{d}</p>
                      </motion.div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Similar Papers */}
              {similarPapers.length > 0 && (
                <SectionCard title="Similar Published Research" icon={BookOpen} badge={`${similarPapers.length} papers`} delay={0.6}>
                  <div className="space-y-3">
                    {similarPapers.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="glass-panel p-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {p.url ? (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group-hover:gap-2">
                                {p.title}
                                <ExternalLink className="h-3 w-3 text-primary/50 shrink-0 group-hover:text-primary transition-colors" />
                              </a>
                            ) : (
                              <p className="text-sm font-medium text-foreground">{p.title}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-1">{p.authors}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">{p.source}</span>
                              {p.url && (
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-primary/50 hover:text-primary truncate max-w-[200px]">
                                  {p.url}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-foreground">{Math.round(p.relevance * 100)}%</p>
                            <p className="text-[9px] text-muted-foreground">match</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-primary to-[hsl(var(--aion-cyan))] rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round(p.relevance * 100)}%` }}
                              transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Next Steps */}
              <SectionCard title="Actionable Next Steps" icon={Target} defaultOpen badge="Roadmap" delay={0.7}>
                <div className="space-y-3">
                  {review.nextSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground/85 leading-[1.7]">{step}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 mt-1" />
                    </motion.div>
                  ))}
                </div>
              </SectionCard>

              {/* Bottom spacer */}
              <div className="h-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
