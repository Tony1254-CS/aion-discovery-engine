import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Beaker, Home, Award, Trophy, Loader2, CheckCircle2, Sparkles, FlaskConical, Swords, BarChart3, Bell, X, Shield, AlertTriangle, Lightbulb } from "lucide-react";
import PaperChat from "@/components/PaperChat";
import PeerReview from "@/components/PeerReview";
import ReproducibilityExporter from "@/components/ReproducibilityExporter";
import PaperPDFExporter from "@/components/PaperPDFExporter";
import InteractiveFigures from "@/components/InteractiveFigures";
import ResearchGaps from "@/components/ResearchGaps";
import HypothesisSimulation from "@/components/HypothesisSimulation";
import DebateMode from "@/components/DebateMode";
import MetaAnalysisBuilder from "@/components/MetaAnalysisBuilder";
import LiteratureMonitor from "@/components/LiteratureMonitor";
import { supabase } from "@/integrations/supabase/client";

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.25, 0.4, 0, 1] },
  }),
};

const toolItems = [
  { id: "simulation", icon: FlaskConical, label: "Power Simulation", color: "from-violet-500 to-purple-600", description: "Monte Carlo power analysis" },
  { id: "debate", icon: Swords, label: "AI Debate", color: "from-amber-500 to-orange-600", description: "Hypothesis stress-testing" },
  { id: "meta", icon: BarChart3, label: "Meta-Analysis", color: "from-emerald-500 to-teal-600", description: "Synthesize multiple studies" },
  { id: "literature", icon: Bell, label: "Literature Alerts", color: "from-sky-500 to-blue-600", description: "Track new papers" },
];

export default function PaperView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const query = state?.query || "Scientific research question";
  const [paper, setPaper] = useState<any>(state?.paper);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [peerReviewData, setPeerReviewData] = useState<any>(null);

  const hypotheses = state?.hypotheses || [];
  const firstHypothesis = hypotheses[0] || { title: paper?.title || query, description: "" };

  const submitToLeaderboard = async () => {
    if (!paper) return;
    setSubmitting(true);
    try {
      await supabase.from("leaderboard").insert({
        title: paper.title || "Untitled Research",
        query,
        abstract: paper.abstract || null,
        novelty_score: state?.noveltyScore || 0,
        paper_json: paper,
      });
      setSubmitted(true);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  // Safely convert any value to a renderable string
  const safeStr = (val: any, fallback: string): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") return JSON.stringify(val, null, 2);
    return fallback;
  };

  const title = safeStr(paper?.title, "Research Paper");
  const abstract = safeStr(paper?.abstract, "No abstract generated.");
  const introduction = safeStr(paper?.introduction, "No introduction generated.");
  const literatureReview = safeStr(paper?.literatureReview || paper?.literature_review, "");
  const methods = safeStr(paper?.methods, "No methods generated.");
  const results = safeStr(paper?.results, "No results generated.");
  const discussion = safeStr(paper?.discussion, "No discussion generated.");
  const conclusion = safeStr(paper?.conclusion, "");
  const references = Array.isArray(paper?.references) ? paper.references : [];
  const researchGaps = Array.isArray(state?.researchGaps) ? state.researchGaps : [];

  const sections: { title: string; content: string; showFigures?: boolean }[] = [
    { title: "Abstract", content: abstract },
    { title: "1. Introduction", content: introduction },
  ];

  if (literatureReview) {
    sections.push({ title: "2. Literature Review", content: literatureReview });
    sections.push({ title: "3. Methods", content: methods });
    sections.push({ title: "4. Results", content: results, showFigures: true });
    sections.push({ title: "5. Discussion", content: discussion });
    if (conclusion) sections.push({ title: "6. Conclusion", content: conclusion });
  } else {
    sections.push({ title: "2. Methods", content: methods });
    sections.push({ title: "3. Results", content: results, showFigures: true });
    sections.push({ title: "4. Discussion", content: discussion });
    if (conclusion) sections.push({ title: "5. Conclusion", content: conclusion });
  }

  const limIdx = sections.length;
  const refIdx = limIdx + 1;

  const figureContext = {
    xLabel: state?.stats?.testType?.includes("Correlation") ? "Independent Variable" : "Group",
    yLabel: "Dependent Variable",
    title: paper?.title || query,
  };

  return (
    <div className="min-h-screen bg-background mesh-gradient-bg">
      {/* Sticky header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-[hsl(var(--aion-surface)/0.75)] backdrop-blur-2xl border-b border-border/40"
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ x: -2 }}
              onClick={() => navigate("/dashboard", { state: { query } })}
              className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Dashboard
            </motion.button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
              <Beaker className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight font-display hidden sm:inline">AION</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PeerReview paper={paper} query={query} onPaperUpdate={setPaper} onReviewComplete={setPeerReviewData} />
            <div className="hidden sm:flex items-center gap-2">
              <PaperPDFExporter paper={paper} query={query} />
              <ReproducibilityExporter paper={paper} query={query} />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={submitted ? () => navigate("/leaderboard") : submitToLeaderboard}
              disabled={submitting || !paper}
              className="aion-glow-button text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 !rounded-xl !shadow-sm hover:!shadow-md disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{submitting ? "Submitting…" : submitted ? "View Board" : "Submit"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>




      {/* Active Tool Panel */}
      <AnimatePresence>
        {activeTool && (
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-16 right-0 bottom-0 w-full sm:w-[480px] z-40 bg-[hsl(var(--aion-surface)/0.92)] backdrop-blur-2xl border-l border-border/40 overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-[hsl(var(--aion-surface)/0.9)] backdrop-blur-xl border-b border-border/30">
              <span className="text-sm font-bold text-foreground">
                {toolItems.find(t => t.id === activeTool)?.label}
              </span>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTool(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
            <div className="p-4">
              {activeTool === "simulation" && (
                <HypothesisSimulation
                  hypothesis={firstHypothesis}
                  onClose={() => setActiveTool(null)}
                />
              )}
              {activeTool === "debate" && (
                <DebateMode
                  hypothesis={firstHypothesis}
                  query={query}
                  onClose={() => setActiveTool(null)}
                />
              )}
              {activeTool === "meta" && (
                <MetaAnalysisBuilder />
              )}
              {activeTool === "literature" && (
                <LiteratureMonitor query={query} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12 pb-28 relative z-10"
      >
        <div className="glass-panel-hero p-5 sm:p-8 md:p-12">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-5 flex-wrap"
          >
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary glow-ring">
              <Award className="h-3 w-3" />
              Reproducible
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-3 w-3" />
              AI-Generated
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-tight mb-2"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mb-1"
          >
            Generated by AION — Autonomous AI Scientist
          </motion.p>
          <p className="text-xs text-muted-foreground/50 mb-8">Research query: "{query}"</p>

          {/* Highlighted Advanced Tools CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8 p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-[hsl(var(--aion-gradient-end)/0.05)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Advanced Research Tools</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary animate-pulse">NEW</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {toolItems.map((tool) => {
                const Icon = tool.icon;
                return (
                  <motion.button
                    key={tool.id}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTool(tool.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-transparent hover:border-border/50 transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{tool.label}</span>
                    <span className="text-[9px] text-muted-foreground leading-tight text-center">{tool.description}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <hr className="border-border/30 mb-8" />

          {peerReviewData && (
            <motion.div custom={0.5} initial="hidden" animate="visible" variants={sectionVariants}>
              <div className="mb-8 rounded-2xl border border-border/40 bg-[hsl(var(--aion-surface)/0.55)] p-5 backdrop-blur-xl">
                <h2 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  AI Peer Review
                </h2>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
                  <div className="glass-panel px-5 py-3 text-center sm:min-w-32">
                    <div className="text-2xl font-bold aion-gradient-text">{peerReviewData.overallScore ?? "–"}/10</div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Overall Score</p>
                  </div>
                  <p className="text-sm text-foreground/80 italic flex-1">
                    {typeof peerReviewData.verdict === "string" ? peerReviewData.verdict : "Review complete."}
                  </p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {Array.isArray(peerReviewData.strengths) && peerReviewData.strengths.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Strengths
                      </h3>
                      <ul className="space-y-1.5 pl-5">
                        {peerReviewData.strengths.map((s: any, i: number) => (
                          <li key={i} className="text-xs text-foreground/80 leading-relaxed list-disc">
                            {typeof s === "string" ? s : JSON.stringify(s)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(peerReviewData.weaknesses) && peerReviewData.weaknesses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-primary" /> Weaknesses
                      </h3>
                      <ul className="space-y-1.5 pl-5">
                        {peerReviewData.weaknesses.map((w: any, i: number) => (
                          <li key={i} className="text-xs text-foreground/80 leading-relaxed list-disc">
                            {typeof w === "string" ? w : JSON.stringify(w)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {Array.isArray(peerReviewData.suggestions) && peerReviewData.suggestions.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-primary" /> Suggestions
                    </h3>
                    <div className="space-y-2">
                      {peerReviewData.suggestions.map((s: any, i: number) => (
                        <div key={i} className="rounded-xl bg-muted/40 p-3">
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {typeof s?.text === "string" ? s.text : typeof s === "string" ? s : JSON.stringify(s)}
                          </p>
                          {s?.section && (
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mt-1 block">
                              {s.section}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Dynamic sections */}
          {sections.map((sec, i) => (
            <motion.div
              key={sec.title}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
            >
              <Section title={sec.title}>
                {sec.content}
                {sec.showFigures && (
                  <div className="mt-8">
                    <InteractiveFigures context={figureContext} />
                  </div>
                )}
              </Section>
            </motion.div>
          ))}

          {/* Limitations */}
          <motion.div custom={limIdx} initial="hidden" animate="visible" variants={sectionVariants}>
            <Section title={`${literatureReview ? 7 : 6}. Limitations`}>
              <div className="space-y-2 text-xs text-foreground/80 leading-relaxed">
                <p>This study was conducted using AI-generated simulated data and should be considered exploratory. The following limitations apply:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Data was synthetically generated and may not reflect real-world distributions or population characteristics.</li>
                  <li>Statistical results are illustrative and require validation with empirical datasets from controlled studies.</li>
                  <li>The literature review was AI-assisted and may not capture all relevant publications, particularly recent preprints.</li>
                  <li>Competing hypotheses were tested against the same simulated dataset, which may introduce correlated errors.</li>
                  <li>Effect sizes and p-values should be interpreted with caution given the simulated nature of the data.</li>
                  <li>External validity cannot be established without replication using real-world observational or experimental data.</li>
                </ul>
              </div>
            </Section>
          </motion.div>

          {/* Research Gaps & Next Steps */}
          {researchGaps.length > 0 && (
            <motion.div custom={limIdx + 1} initial="hidden" animate="visible" variants={sectionVariants}>
              <div className="mt-6 pt-8 border-t border-border/30">
                <h2 className="font-serif text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Research Gaps & Next Steps
                </h2>
                <p className="text-xs text-muted-foreground mb-6">Based on the findings above, the following gaps and future research directions have been identified.</p>
                <ResearchGaps gaps={researchGaps} query={query} />
              </div>
            </motion.div>
          )}

          {/* References */}
          {references.length > 0 && (
            <motion.div custom={refIdx} initial="hidden" animate="visible" variants={sectionVariants}>
              <Section title="References">
                <div className="space-y-3">
                  {references.map((ref: any, i: number) => {
                    const authors = Array.isArray(ref?.authors) ? ref.authors.join(", ") : ref?.authors;
                    const refText = typeof ref === "string"
                      ? ref
                      : typeof ref?.text === "string"
                        ? ref.text
                        : [authors, ref?.year ? `(${ref.year})` : null, ref?.title, ref?.journal]
                            .filter(Boolean)
                            .join(". ") || JSON.stringify(ref);
                    const doiMatch = typeof refText === "string" ? refText.match(/(https?:\/\/doi\.org\/[^\s]+|10\.\d{4,}\/[^\s]+)/i) : null;
                    return (
                      <div key={i} className="flex gap-3 text-xs text-muted-foreground group">
                        <span className="text-muted-foreground/40 shrink-0 tabular-nums font-mono">[{i + 1}]</span>
                        <div>
                          <span className="leading-relaxed">{refText}</span>
                          {doiMatch && (
                            <a
                              href={doiMatch[0].startsWith("http") ? doiMatch[0] : `https://doi.org/${doiMatch[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-primary/70 hover:text-primary hover:underline transition-colors"
                            >
                              [DOI]
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            </motion.div>
          )}
        </div>
      </motion.article>

      <PaperChat paper={paper} query={query} onPaperUpdate={setPaper} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10 group">
      <h2 className="font-serif text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] opacity-0 group-hover:opacity-100 transition-opacity" />
        {title}
      </h2>
      <div className="font-serif text-sm text-foreground/85 leading-[1.85] whitespace-pre-line">{children}</div>
    </section>
  );
}
