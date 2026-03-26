import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, ChevronDown, ChevronUp, Beaker, Target,
  ArrowRight, FileText, Loader2, Variable, Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Gap {
  title: string;
  description: string;
  type: "unanswered" | "contradiction" | "methodological" | "under-explored";
  suggestions: Suggestion[];
}

interface Suggestion {
  title: string;
  description: string;
  hypothesisDraft: string;
  suggestedIV: string;
  suggestedDV: string;
  controls: string;
  datasetRecommendation: string;
}

interface Props {
  gaps: Gap[];
  query: string;
}

const typeColors: Record<string, string> = {
  "unanswered": "text-[hsl(var(--aion-cyan))]",
  "contradiction": "text-[hsl(var(--aion-rose))]",
  "methodological": "text-[hsl(var(--aion-violet))]",
  "under-explored": "text-primary",
};

const typeLabels: Record<string, string> = {
  "unanswered": "Unanswered Question",
  "contradiction": "Contradictory Finding",
  "methodological": "Methodological Gap",
  "under-explored": "Under-Explored",
};

export default function ResearchGaps({ gaps, query }: Props) {
  const [expandedGap, setExpandedGap] = useState<number | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState<number | null>(null);
  const [proposals, setProposals] = useState<Record<number, string>>({});

  const generateProposal = async (gapIdx: number, sugIdx: number) => {
    const key = gapIdx * 100 + sugIdx;
    if (proposals[key]) return;

    const gap = gaps[gapIdx];
    const suggestion = gap.suggestions[sugIdx];
    setGeneratingProposal(key);

    try {
      const { data, error } = await supabase.functions.invoke("research-agent", {
        body: {
          query,
          stage: "research-proposal",
          context: { gap, suggestion },
        },
      });
      if (error) throw error;
      setProposals((prev) => ({ ...prev, [key]: data.result?.proposal || "Proposal generation failed." }));
    } catch (e) {
      console.error(e);
      setProposals((prev) => ({ ...prev, [key]: "Failed to generate proposal. Please try again." }));
    } finally {
      setGeneratingProposal(null);
    }
  };

  if (!gaps || gaps.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="font-serif text-lg font-bold text-foreground mb-2 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))]" />
        Research Gaps & Next Steps
      </h2>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        Identified gaps and actionable suggestions for future research based on this study's findings and the broader literature.
      </p>

      <div className="space-y-3">
        {gaps.map((gap, gi) => (
          <motion.div
            key={gi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            {/* Gap header */}
            <button
              onClick={() => setExpandedGap(expandedGap === gi ? null : gi)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/[0.06] border border-white/[0.06] flex items-center justify-center shrink-0">
                <Lightbulb className={`h-4 w-4 ${typeColors[gap.type] || "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[9px] font-semibold uppercase tracking-widest ${typeColors[gap.type] || "text-primary"}`}>
                    {typeLabels[gap.type] || gap.type}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{gap.title}</p>
              </div>
              {expandedGap === gi ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {expandedGap === gi && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-white/[0.04] pt-4">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-5">{gap.description}</p>

                    {gap.suggestions.map((sug, si) => {
                      const key = gi * 100 + si;
                      return (
                        <div key={si} className="mb-4 last:mb-0 rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                          <div className="flex items-start gap-2 mb-3">
                            <Target className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[13px] font-semibold text-foreground">{sug.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{sug.description}</p>
                            </div>
                          </div>

                          {/* Hypothesis draft */}
                          <div className="ml-5 space-y-2 mt-3">
                            <div className="flex items-start gap-2">
                              <Beaker className="h-3 w-3 text-[hsl(var(--aion-cyan))] mt-0.5 shrink-0" />
                              <p className="text-[11px] text-foreground/80 italic leading-relaxed">"{sug.hypothesisDraft}"</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Variable className="h-3 w-3 text-primary/50" />
                                <span><strong>IV:</strong> {sug.suggestedIV}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Variable className="h-3 w-3 text-[hsl(var(--aion-violet))]/50" />
                                <span><strong>DV:</strong> {sug.suggestedDV}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Database className="h-3 w-3 text-[hsl(var(--aion-cyan))]/50" />
                                <span>{sug.datasetRecommendation}</span>
                              </div>
                            </div>
                          </div>

                          {/* Generate Proposal button */}
                          <div className="mt-3 ml-5">
                            {proposals[key] ? (
                              <div className="rounded-xl bg-primary/[0.04] border border-primary/10 p-4 mt-2">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <FileText className="h-3 w-3 text-primary" />
                                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Research Proposal</span>
                                </div>
                                <div className="text-[11px] text-foreground/80 leading-[1.8] whitespace-pre-line">{proposals[key]}</div>
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => generateProposal(gi, si)}
                                disabled={generatingProposal !== null}
                                className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
                              >
                                {generatingProposal === key ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ArrowRight className="h-3 w-3" />
                                )}
                                Generate Research Proposal
                              </motion.button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
