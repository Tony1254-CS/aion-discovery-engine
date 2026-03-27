import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleLeft, ToggleRight, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";
import { CompetingHyp } from "@/lib/research-pipeline";

interface CheckpointData {
  selectedHypothesis?: number;
  overrideTest?: string;
  adjustedVariables?: { iv: string; dv: string; controls: string };
}

interface Props {
  autoMode: boolean;
  onToggleAuto: (auto: boolean) => void;
  competingHyps: CompetingHyp[];
  onSelectHypothesis?: (idx: number) => void;
  selectedHyp?: number;
  currentStage?: string;
  onCheckpoint?: (data: CheckpointData) => void;
}

const testOptions = [
  { value: "auto", label: "Auto-Select" },
  { value: "pearson", label: "Pearson Correlation" },
  { value: "ttest", label: "Independent t-Test" },
  { value: "anova", label: "One-Way ANOVA" },
  { value: "regression", label: "Linear Regression" },
  { value: "chi-square", label: "Chi-Square Test" },
];

export default function HumanCheckpoints({
  autoMode, onToggleAuto, competingHyps, onSelectHypothesis,
  selectedHyp, currentStage, onCheckpoint,
}: Props) {
  const [selectedTest, setSelectedTest] = useState("auto");
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<string | null>(null);

  const isHypothesisStage = currentStage === "hypotheses" || (competingHyps.length > 0 && currentStage !== "paper");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Auto Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-primary" />
          Research Mode
        </h3>
        <button
          onClick={() => onToggleAuto(!autoMode)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          {autoMode ? (
            <>
              <ToggleRight className="h-5 w-5 text-primary" />
              <span className="text-primary">Auto</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Manual</span>
            </>
          )}
        </button>
      </div>

      {/* Checkpoints */}
      {!autoMode && (
        <AnimatePresence>
          {/* Hypothesis Selection */}
          {isHypothesisStage && competingHyps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-panel overflow-hidden"
            >
              <button
                onClick={() => setExpandedCheckpoint(expandedCheckpoint === "hyp" ? null : "hyp")}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Select Hypothesis</span>
                </div>
                <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expandedCheckpoint === "hyp" ? "rotate-90" : ""}`} />
              </button>
              {expandedCheckpoint === "hyp" && (
                <div className="px-3 pb-3 space-y-1.5">
                  {competingHyps.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectHypothesis?.(i)}
                      className={`w-full text-left rounded-lg p-2 text-xs transition-colors border ${
                        selectedHyp === i
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-transparent hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className="font-medium">{(h.type || "hyp").toUpperCase()}</span>: {h.title || "Untitled"}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Test Override */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="glass-panel overflow-hidden"
          >
            <button
              onClick={() => setExpandedCheckpoint(expandedCheckpoint === "test" ? null : "test")}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Statistical Test</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{testOptions.find(t => t.value === selectedTest)?.label}</span>
            </button>
            {expandedCheckpoint === "test" && (
              <div className="px-3 pb-3 space-y-1">
                {testOptions.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setSelectedTest(t.value);
                      onCheckpoint?.({ overrideTest: t.value === "auto" ? undefined : t.value });
                    }}
                    className={`w-full text-left rounded-lg px-2 py-1.5 text-xs transition-colors ${
                      selectedTest === t.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {autoMode && (
        <p className="text-[10px] text-muted-foreground/60 italic">
          All decisions are automated. Switch to Manual mode to intervene at checkpoints.
        </p>
      )}
    </motion.div>
  );
}
