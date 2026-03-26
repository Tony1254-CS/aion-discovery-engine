import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Beaker, Home, Award, Trophy, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import PaperChat from "@/components/PaperChat";
import PeerReview from "@/components/PeerReview";
import ReproducibilityExporter from "@/components/ReproducibilityExporter";
import InteractiveFigures from "@/components/InteractiveFigures";
import ResearchGaps from "@/components/ResearchGaps";
import { supabase } from "@/integrations/supabase/client";

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: 0.1 + i * 0.06, duration: 0.5, ease: [0.25, 0.4, 0, 1] },
  }),
};

export default function PaperView() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  const query = state?.query || "Scientific research question";
  const [paper, setPaper] = useState<any>(state?.paper);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const title = paper?.title || "Research Paper";
  const abstract = paper?.abstract || "No abstract generated.";
  const introduction = paper?.introduction || "No introduction generated.";
  const literatureReview = paper?.literatureReview || paper?.literature_review || "";
  const methods = paper?.methods || "No methods generated.";
  const results = paper?.results || "No results generated.";
  const discussion = paper?.discussion || "No discussion generated.";
  const conclusion = paper?.conclusion || "";
  const references = paper?.references || [];
  const researchGaps = state?.researchGaps || [];

  // Build sections dynamically
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

  // Get figure context from paper state
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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Dashboard
            </motion.button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))] flex items-center justify-center glow-ring">
              <Beaker className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight font-display">AION</span>
          </div>
          <div className="flex items-center gap-2">
            <PeerReview paper={paper} query={query} onPaperUpdate={setPaper} />
            <ReproducibilityExporter paper={paper} query={query} />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={submitted ? () => navigate("/leaderboard") : submitToLeaderboard}
              disabled={submitting || !paper}
              className="aion-glow-button text-xs px-4 py-2 flex items-center gap-1.5 !rounded-xl !shadow-sm hover:!shadow-md disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
              {submitting ? "Submitting…" : submitted ? "View Board" : "Submit"}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 py-12 relative z-10"
      >
        <div className="glass-panel-hero p-8 sm:p-12">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-5"
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
          <hr className="border-border/30 mb-8" />

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

          {/* Research Gaps & Next Steps - shown AFTER the full paper */}
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
                    const refText = ref.text || ref;
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
