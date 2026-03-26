import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  score: number; // 0-1
  closestWork?: string;
  difference?: string;
}

export default function NoveltyScore({ score, closestWork, difference }: Props) {
  const pct = Math.round(score * 100);
  const color = score > 0.7 ? "text-emerald-500" : score > 0.4 ? "text-amber-500" : "text-red-500";
  const label = score > 0.7 ? "Highly Novel" : score > 0.4 ? "Moderately Novel" : "Low Novelty";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Novelty Score
        </h3>
        <span className={`text-lg font-bold font-mono ${color}`}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--aion-gradient-start))] to-[hsl(var(--aion-gradient-end))]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${score > 0.7 ? "bg-emerald-500/10 text-emerald-600" : score > 0.4 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"}`}>
        {label}
      </span>

      {closestWork && (
        <div className="pt-2 border-t border-border/50 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">Closest Prior Work</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{closestWork}</p>
          {difference && <p className="text-xs text-primary/70 leading-relaxed italic">{difference}</p>}
        </div>
      )}
    </motion.div>
  );
}
