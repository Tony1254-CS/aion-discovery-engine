import { Hypothesis } from "@/lib/research-types";
import { motion } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";

interface Props {
  hypotheses: Hypothesis[];
  selected: number | null;
  onSelect: (id: number) => void;
}

export default function HypothesisCards({ hypotheses, selected, onSelect }: Props) {
  if (!hypotheses || hypotheses.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">
        Generated Hypotheses
      </h3>
      {hypotheses.filter(Boolean).map((h, i) => {
        const isSelected = selected === h.id;
        return (
          <motion.button
            key={h.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            onClick={() => onSelect(h.id)}
            className={`w-full text-left rounded-2xl p-4 transition-all duration-300 border ${
              isSelected
                ? "glass-panel-elevated border-primary/30 shadow-[0_0_20px_hsl(var(--aion-glow)/0.1)]"
                : "glass-panel border-transparent hover:border-border hover:shadow-md"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? "bg-primary/10" : "bg-[hsl(var(--aion-node-hypothesis)/0.1)]"
              }`}>
                <Lightbulb className={`h-4 w-4 ${isSelected ? "text-primary" : "text-[hsl(var(--aion-node-hypothesis))]"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{h.title || "Untitled Hypothesis"}</p>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${isSelected ? "text-primary rotate-90" : "text-muted-foreground/30"}`} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{h.description || ""}</p>
                {isSelected && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-xs text-primary/80 mt-2.5 pt-2.5 border-t border-border/50 leading-relaxed"
                  >
                    <span className="font-semibold">Approach:</span> {h.approach}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
