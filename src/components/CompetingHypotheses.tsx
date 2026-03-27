import { motion } from "framer-motion";
import { FlaskConical, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface CompetingHyp {
  type: "primary" | "alternative" | "null";
  title: string;
  description: string;
  pValue: number;
  effectSize: number;
  verdict: "supported" | "weak" | "rejected";
}

interface Props {
  hypotheses: CompetingHyp[];
  onSelect?: (idx: number) => void;
  selected?: number;
}

const verdictConfig = {
  supported: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Supported" },
  weak: { icon: MinusCircle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Weak Evidence" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Rejected" },
};

const typeColors = {
  primary: "from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))]",
  alternative: "from-amber-500 to-orange-500",
  null: "from-slate-400 to-slate-500",
};

export default function CompetingHypotheses({ hypotheses, onSelect, selected }: Props) {
  if (hypotheses.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2">
        <FlaskConical className="h-3.5 w-3.5 text-primary" />
        Competing Hypotheses
      </h3>

      {hypotheses.filter(Boolean).map((h, i) => {
        const safeVerdict = (h.verdict && verdictConfig[h.verdict]) ? h.verdict : "weak";
        const safeType = (h.type && typeColors[h.type]) ? h.type : "primary";
        const v = verdictConfig[safeVerdict];
        const VIcon = v.icon;
        const isSelected = selected === i;

        return (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onSelect?.(i)}
            className={`w-full text-left rounded-2xl p-4 border transition-all duration-300 ${
              isSelected
                ? "glass-panel-elevated border-primary/30"
                : "glass-panel border-transparent hover:border-border"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${typeColors[h.type]} flex items-center justify-center shrink-0`}>
                <span className="text-[10px] font-bold text-white uppercase">{h.type[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{h.title}</p>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${v.bg} ${v.color} shrink-0`}>
                    <VIcon className="h-2.5 w-2.5" />
                    {v.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{h.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] font-mono text-muted-foreground">p = {h.pValue < 0.001 ? "<.001" : h.pValue.toFixed(4)}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">d = {h.effectSize.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
