import { Hypothesis } from "@/lib/research-types";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface Props {
  hypotheses: Hypothesis[];
  selected: number | null;
  onSelect: (id: number) => void;
}

export default function HypothesisCards({ hypotheses, selected, onSelect }: Props) {
  if (hypotheses.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Hypotheses</h3>
      {hypotheses.map((h, i) => (
        <motion.button
          key={h.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onSelect(h.id)}
          className={`w-full text-left glass-panel p-4 transition-all ${selected === h.id ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"}`}
        >
          <div className="flex items-start gap-3">
            <Lightbulb className={`h-4 w-4 mt-0.5 shrink-0 ${selected === h.id ? "text-primary" : "text-aion-hypothesis"}`} />
            <div>
              <p className="text-sm font-semibold text-foreground">{h.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{h.description}</p>
              <p className="text-xs text-primary mt-2">Approach: {h.approach}</p>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
