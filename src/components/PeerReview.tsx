import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Lightbulb, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PeerReviewProps {
  paper: any;
  query: string;
  onPaperUpdate: (paper: any) => void;
}

interface ReviewData {
  strengths: string[];
  weaknesses: string[];
  suggestions: { text: string; section: string }[];
  overallScore: number;
  verdict: string;
}

export default function PeerReview({ paper, query, onPaperUpdate }: PeerReviewProps) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [revising, setRevising] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("strengths");

  const getReview = async () => {
    if (!paper) return;
    setLoading(true);
    setOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke("research-agent", {
        body: { query, stage: "peer-review", context: { paper } },
      });
      if (error) throw error;
      setReview(data?.result);
    } catch (e: any) {
      console.error("Peer review error:", e);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (idx: number, suggestion: { text: string; section: string }) => {
    setRevising(idx);
    try {
      const { data, error } = await supabase.functions.invoke("research-agent", {
        body: {
          query: `Apply this peer review suggestion to the ${suggestion.section} section: ${suggestion.text}`,
          stage: "refine",
          context: { paper },
        },
      });
      if (error) throw error;
      if (data?.result?.title) {
        onPaperUpdate(data.result);
      }
    } catch (e) {
      console.error("Revision error:", e);
    } finally {
      setRevising(null);
    }
  };

  const sections = [
    { key: "strengths", label: "Strengths", icon: CheckCircle2, color: "text-emerald-500", items: review?.strengths },
    { key: "weaknesses", label: "Weaknesses", icon: AlertTriangle, color: "text-amber-500", items: review?.weaknesses },
  ];

  return (
    <>
      <button
        onClick={getReview}
        disabled={loading || !paper}
        className="aion-glow-button text-xs px-4 py-2 flex items-center gap-1.5 !rounded-xl !shadow-sm hover:!shadow-md disabled:opacity-50"
      >
        <Shield className="h-3.5 w-3.5" />
        {loading ? "Reviewing…" : "Peer Review"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-full w-[420px] max-w-[90vw] border-l border-border bg-background shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">AI Peer Review</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing paper rigorously…</p>
                </div>
              ) : review ? (
                <>
                  {/* Score */}
                  <div className="glass-panel p-4 text-center">
                    <div className="text-3xl font-bold aion-gradient-text">{review.overallScore}/10</div>
                    <p className="text-xs text-muted-foreground mt-1">{review.verdict}</p>
                  </div>

                  {/* Strengths / Weaknesses */}
                  {sections.map(({ key, label, icon: Icon, color, items }) => (
                    <div key={key} className="glass-panel overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${color}`} />
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className="text-xs text-muted-foreground">({items?.length || 0})</span>
                        </div>
                        {expandedSection === key ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      <AnimatePresence>
                        {expandedSection === key && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 space-y-2">
                              {(items || []).map((item, i) => (
                                <p key={i} className="text-xs text-foreground/80 leading-relaxed pl-6 relative before:content-['•'] before:absolute before:left-2 before:text-muted-foreground">
                                  {item}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* Suggestions */}
                  <div className="glass-panel overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === "suggestions" ? null : "suggestions")}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Suggestions</span>
                        <span className="text-xs text-muted-foreground">({review.suggestions?.length || 0})</span>
                      </div>
                      {expandedSection === "suggestions" ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                    <AnimatePresence>
                      {expandedSection === "suggestions" && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 space-y-3">
                            {(review.suggestions || []).map((s, i) => (
                              <div key={i} className="rounded-xl bg-muted/40 p-3">
                                <p className="text-xs text-foreground/80 leading-relaxed mb-2">{s.text}</p>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">{s.section}</span>
                                  <button
                                    onClick={() => applySuggestion(i, s)}
                                    disabled={revising !== null}
                                    className="text-[10px] px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 font-medium"
                                  >
                                    {revising === i ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="text-center text-sm text-muted-foreground mt-12">
                  Click "Peer Review" to analyze the paper.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
