import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Hash, Target } from "lucide-react";

interface StatResult {
  sampleSize: number;
  effectSize: number;
  effectSizeLabel: string;
  confidenceInterval: [number, number];
  pValue: number;
  testType: string;
  keyFinding: string;
}

interface Props {
  stats: StatResult | null;
}

export default function StatisticalOutput({ stats }: Props) {
  if (!stats) return null;

  const isSignificant = stats.pValue < 0.05;

  const cards = [
    { icon: Hash, label: "Sample Size", value: `n = ${stats.sampleSize.toLocaleString()}`, sub: stats.testType },
    { icon: TrendingUp, label: "Effect Size", value: `${stats.effectSizeLabel} = ${stats.effectSize.toFixed(3)}`, sub: stats.effectSize > 0.8 ? "Large" : stats.effectSize > 0.5 ? "Medium" : "Small" },
    { icon: Target, label: "95% CI", value: `[${stats.confidenceInterval[0].toFixed(3)}, ${stats.confidenceInterval[1].toFixed(3)}]`, sub: "Confidence Interval" },
    { icon: BarChart3, label: "p-value", value: stats.pValue < 0.001 ? "< .001" : `= ${stats.pValue.toFixed(4)}`, sub: isSignificant ? "Statistically significant" : "Not significant" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2">
        <BarChart3 className="h-3.5 w-3.5" />
        Statistical Results
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {cards.map(({ icon: Icon, label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className="glass-panel p-3 space-y-1"
          >
            <div className="flex items-center gap-1.5">
              <Icon className="h-3 w-3 text-primary" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold">{label}</span>
            </div>
            <p className="text-sm font-mono font-semibold text-foreground">{value}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Key Finding */}
      <div className={`rounded-xl p-3 border ${isSignificant ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
        <p className="text-xs font-medium text-foreground">{stats.keyFinding}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isSignificant ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
            {isSignificant ? "✓ Significant" : "⚠ Not significant"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
