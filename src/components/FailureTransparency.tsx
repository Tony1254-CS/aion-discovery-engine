import { motion } from "framer-motion";
import { AlertTriangle, Database, BarChart3, BookOpen } from "lucide-react";

interface Warning {
  type: "simulated-data" | "low-power" | "conflicting-literature";
  message: string;
  detail?: string;
}

interface Props {
  warnings: Warning[];
}

const iconMap = {
  "simulated-data": Database,
  "low-power": BarChart3,
  "conflicting-literature": BookOpen,
};

const colorMap = {
  "simulated-data": "border-amber-500/30 bg-amber-500/5",
  "low-power": "border-orange-500/30 bg-orange-500/5",
  "conflicting-literature": "border-red-500/30 bg-red-500/5",
};

export default function FailureTransparency({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        Transparency Notices
      </h3>
      {warnings.map((w, i) => {
        const Icon = iconMap[w.type];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-3 border ${colorMap[w.type]} flex items-start gap-2.5`}
          >
            <Icon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">{w.message}</p>
              {w.detail && <p className="text-[10px] text-muted-foreground mt-0.5">{w.detail}</p>}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
