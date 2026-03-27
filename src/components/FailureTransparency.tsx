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

const iconMap: Record<string, any> = {
  "simulated-data": Database,
  "low-power": BarChart3,
  "conflicting-literature": BookOpen,
};

const colorMap: Record<string, string> = {
  "simulated-data": "border-amber-500/30 bg-amber-500/5",
  "low-power": "border-orange-500/30 bg-orange-500/5",
  "conflicting-literature": "border-red-500/30 bg-red-500/5",
};

export default function FailureTransparency({ warnings }: Props) {
  if (!warnings || warnings.length === 0) return null;

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
      {warnings.filter(Boolean).map((w, i) => {
        const Icon = (w.type && iconMap[w.type]) || AlertTriangle;
        const colors = (w.type && colorMap[w.type]) || "border-amber-500/30 bg-amber-500/5";
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl p-3 border ${colors} flex items-start gap-2.5`}
          >
            <Icon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-foreground">{typeof w.message === "string" ? w.message : "Notice"}</p>
              {w.detail && typeof w.detail === "string" && <p className="text-[10px] text-muted-foreground mt-0.5">{w.detail}</p>}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
